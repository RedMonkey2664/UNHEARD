// Voicemail status machine (docs/03 section 9): locked -> damaged -> fixed ->
// playing -> memory -> done. Gating, fixes, playback, replay, memories,
// automatic evidence and the small horror beats. Pure: no Phaser.
//
// Presence and noise effects are not applied here. Those systems listen to
// fix:fail, vm:play:start {replay}, memory:skip and memory:end.

import { BALANCE } from '../config/balance.js';
import { VM_STATUS } from '../config/constants.js';
import { VOICEMAILS } from '../data/voicemails.js';
import { completedCount, deriveAct, VM_COUNT } from './gameState.js';
import { currentVmId } from './interaction.js';

const AUTO_EVIDENCE = { 3: 'E3', 7: 'E7' };     // docs/04 section 7
const END_EPS = 1e-9;

function fail(reason) {
  return { ok: false, reason };
}

export function createVoicemailFlow(bus, { battery, puzzles, messages }) {
  let scheduled = [];   // delayed beats: { left, run }

  function giveEvidence(state, id) {
    if (state.inventory.evidence.includes(id)) return;
    state.inventory.evidence.push(id);
    state.stats.evidenceCount = state.inventory.evidence.length;
    bus.emit('evidence:added', { id });
  }

  function fireBeats(state, vmId, when) {
    for (const beat of VOICEMAILS[vmId].beats || []) {
      if (beat.when !== when) continue;
      if (beat.id === 'WINDOW_REOPENS') {
        scheduled.push({ left: BALANCE.beats.windowReopenSec, run: () => {
          state.flags.livingWindowReopened = true;
          bus.emit('beat:fire', { id: beat.id });
        } });
      } else {
        bus.emit('beat:fire', { id: beat.id });
      }
    }
  }

  function isCurrentDamaged(state, id) {
    return currentVmId(state) === id && state.voicemails[id].status === VM_STATUS.DAMAGED;
  }

  function succeed(state, id, type) {
    state.voicemails[id].status = VM_STATUS.FIXED;
    if (type === 'CARD') {
      state.flags.cardAssembled = true;
      state.cardPieces = [];
    }
    if (type === 'NOTE') giveEvidence(state, 'E5');
    bus.emit('fix:success', { vmId: id, type });
    fireBeats(state, id, 'afterFix');
    return { ok: true };
  }

  function wrongFix(state, id, type) {
    battery.spend(state, BALANCE.battery.wrongFixCost);
    state.stats.wrongFixes++;
    // Partial state resets so the puzzle can be retried from scratch.
    if (type === 'WINDOWS') {
      state.windowsClosed = [];
      bus.emit('windows:open', {});
    }
    bus.emit('fix:fail', { vmId: id, type });
    return fail('wrongFix');
  }

  function start(state, id, replay) {
    const phone = state.phone;
    phone.playing = true;
    phone.paused = false;
    phone.playingId = id;
    phone.playPos = 0;
    phone.replay = replay;
    if (!replay) state.voicemails[id].status = VM_STATUS.PLAYING;
    state.voicemails[id].playCount++;
    state.player.locked = true;
    state.player.moving = false;
    battery.setTorch(state, false);   // the phone glow replaces the torch
    bus.emit('vm:play:start', { vmId: id, replay });
    return { ok: true };
  }

  function resetPhone(state) {
    const phone = state.phone;
    phone.playing = false;
    phone.paused = false;
    phone.playingId = null;
    phone.playPos = 0;
    phone.replay = false;
  }

  function finishPlay(state) {
    const id = state.phone.playingId;
    const replay = state.phone.replay;
    resetPhone(state);
    bus.emit('vm:play:end', { vmId: id, replay, interrupted: false });
    if (replay) {
      state.player.locked = false;
      return;
    }
    if (AUTO_EVIDENCE[id]) giveEvidence(state, AUTO_EVIDENCE[id]);
    state.voicemails[id].status = VM_STATUS.MEMORY;
    bus.emit('memory:start', { vmId: id });
  }

  // Battery died mid-playback: the voicemail stays fixed, not played.
  function interrupt(state) {
    const id = state.phone.playingId;
    if (!state.phone.replay) state.voicemails[id].status = VM_STATUS.FIXED;
    resetPhone(state);
    state.player.locked = false;
    bus.emit('vm:play:end', { vmId: id, replay: false, interrupted: true });
  }

  function onCompleted(state, id) {
    const next = id + 1;
    if (next <= VM_COUNT) {
      state.voicemails[next].status = next === VM_COUNT ? VM_STATUS.FIXED : VM_STATUS.DAMAGED;
    }
    // VM3 becoming current swings the windows open (docs/04 section 5).
    if (next === 3) {
      state.windowsClosed = [];
      bus.emit('windows:open', {});
    }
    if (VOICEMAILS[id].onDone === 'MOM_TEXT_2') messages.send(state, 'mom2');
    fireBeats(state, id, 'afterMemory');
  }

  const api = {
    current: currentVmId,

    preview(state, id) {
      if (currentVmId(state) !== id) return fail('notYet');
      if (state.phone.playing) return fail('busy');
      bus.emit('vm:preview', { vmId: id });
      return { ok: true };
    },

    // The phone FIX button. Only EARPHONES is fixed from the phone; the rest
    // show the damage label as a pointer back into the house.
    fixButton(state, id) {
      if (currentVmId(state) !== id) return fail('notYet');
      if (state.voicemails[id].status !== VM_STATUS.DAMAGED) return fail('nothingToFix');
      if (VOICEMAILS[id].fix.type === 'EARPHONES') return { ok: true, picker: true };
      return { ok: true, toast: VOICEMAILS[id].previewLabel };
    },

    attemptFix(state, id, input) {
      if (!isCurrentDamaged(state, id)) return fail('notYet');
      const type = VOICEMAILS[id].fix.type;
      bus.emit('fix:attempt', { vmId: id, type });
      return puzzles.validate(type, input, state) ? succeed(state, id, type) : wrongFix(state, id, type);
    },

    closeWindow(state, room) {
      if (!isCurrentDamaged(state, 3)) return fail('notYet');
      const result = puzzles.closeWindow(state, room);
      bus.emit('window:closed', { id: room });
      return result ? api.attemptFix(state, 3, result.order) : { ok: true, pending: true };
    },

    play(state, id) {
      if (state.phone.playing) return fail('busy');
      const vm = state.voicemails[id];
      if (vm.status === VM_STATUS.DONE) {
        if (state.flags.tapeTaken) return fail('notYet');   // no replay in Act 5
        if (state.battery <= 0) return fail('lowBattery');
        state.stats.replays++;
        return start(state, id, true);
      }
      if (currentVmId(state) !== id) return fail('notYet');
      if (vm.status !== VM_STATUS.FIXED) return fail('needsFix');
      if (state.battery <= 0) return fail('lowBattery');
      return start(state, id, false);
    },

    // Pausing frees the player to move and hide; resuming locks them again.
    togglePause(state) {
      const phone = state.phone;
      if (!phone.playing) return false;
      phone.paused = !phone.paused;
      state.player.locked = !phone.paused;
      if (!phone.paused) state.player.moving = false;
      bus.emit('vm:play:pause', { vmId: phone.playingId, paused: phone.paused });
      return phone.paused;
    },

    endMemory(state, id, skipped) {
      const vm = state.voicemails[id];
      if (vm.status !== VM_STATUS.MEMORY) return fail('notInMemory');
      vm.status = VM_STATUS.DONE;
      vm.memorySkipped = skipped;
      state.player.locked = false;
      if (skipped) {
        state.stats.skippedMemories++;
        bus.emit('memory:skip', { vmId: id });
      }
      onCompleted(state, id);
      bus.emit('memory:end', { vmId: id, skipped, completed: completedCount(state) });
      const prev = state.act;
      state.act = deriveAct(state);
      if (state.act !== prev) bus.emit('act:changed', { act: state.act, prev });
      return { ok: true };
    },

    tick(state, dt) {
      if (scheduled.length) {
        for (const s of scheduled) s.left -= dt;
        const due = scheduled.filter((s) => s.left <= 0);
        scheduled = scheduled.filter((s) => s.left > 0);
        for (const s of due) s.run();
      }

      const cur = currentVmId(state);
      if (cur && state.voicemails[cur].status === VM_STATUS.DAMAGED) {
        if (state.hints.currentVm !== cur) {
          state.hints.currentVm = cur;
          state.hints.damagedSeconds = 0;
        }
        state.hints.damagedSeconds += dt;
      }

      const phone = state.phone;
      if (!phone.playing || phone.paused) return;
      if (state.battery <= 0) {
        interrupt(state);
        return;
      }
      const duration = VOICEMAILS[phone.playingId].durationSec;
      // The last step is clipped so the total cost is exact.
      const step = Math.min(dt, duration - phone.playPos);
      battery.tickPlayback(state, step);
      phone.playPos += step;
      if (state.battery <= 0 && phone.playPos < duration - END_EPS) {
        interrupt(state);
        return;
      }
      if (phone.playPos >= duration - END_EPS) finishPlay(state);
    },

    // Debug: complete VMs 1..n with their consequences (automatic evidence,
    // messages, windows). Physical evidence must still be picked up.
    debugComplete(state, n) {
      for (let id = 1; id <= Math.min(n, VM_COUNT); id++) {
        const vm = state.voicemails[id];
        if (vm.status === VM_STATUS.DONE) continue;
        if (AUTO_EVIDENCE[id]) giveEvidence(state, AUTO_EVIDENCE[id]);
        if (id === 2) state.flags.cardAssembled = true;
        vm.status = VM_STATUS.MEMORY;
        api.endMemory(state, id, false);
      }
    },

    // NOTES hints: hint1 after 90 s damaged, hint2 added after 180 s.
    hintsFor(state) {
      const cur = currentVmId(state);
      if (!cur || state.voicemails[cur].status !== VM_STATUS.DAMAGED) return [];
      const H = BALANCE.hints;
      const t = state.hints.damagedSeconds;
      const out = [];
      if (t >= H.hint1Sec) out.push(VOICEMAILS[cur].hint1);
      if (t >= H.hint2Sec) out.push(VOICEMAILS[cur].hint2);
      return out;
    }
  };
  return api;
}
