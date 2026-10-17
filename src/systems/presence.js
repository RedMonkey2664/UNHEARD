// Presence: how close the Hollow is (docs/03 section 5). Hidden from the
// player; shown only through flicker, tint, whispers and the Hollow. Pure.

import { BALANCE } from '../config/balance.js';
import { TEXTS } from '../data/texts.js';
import { clamp } from '../utils/math.js';

const PR = BALANCE.presence;
const NA = BALANCE.nani;
const ORDER = ['flicker', 'naniHelp', 'whisper', 'manifest', 'doom'];

export function createPresence(bus, { noise, rng }) {
  let lastShown = null;

  function announce(state) {
    const shown = Math.round(state.presence);
    if (shown !== lastShown) {
      lastShown = shown;
      bus.emit('presence:changed', { value: state.presence });
    }
  }

  function offerChai(state) {
    const n = state.nani;
    if (n.touchesUsed >= PR.maxNaniTouches) return;
    if (state.clock.runSeconds - n.lastOfferAt < PR.naniOfferCooldown) return;
    const p = state.player;
    // Toward the middle of the room so it is always reachable.
    const x = p.x < BALANCE.world.width / 2 ? p.x + NA.ng4Dist : p.x - NA.ng4Dist;
    n.lastOfferAt = state.clock.runSeconds;
    n.offer = { room: p.room, x, left: NA.ng4FadeSec };
    bus.emit('nani:glimpse', { id: 'NG4', room: p.room, x });
  }

  function manifest(state) {
    const f = state.flags;
    if (f.manifestTimer !== null) return;
    f.manifestTimer = PR.manifestSec;
    f.manifestRoom = state.player.room;
    // Only the first manifestation is the full jump scare (JS2).
    bus.emit('hollow:manifest', { full: f.manifestCount === 0, room: f.manifestRoom });
    f.manifestCount++;
  }

  function fire(state, name) {
    bus.emit('presence:threshold', { name });
    const ps = state.presenceState;
    if (name === 'flicker' && !ps.ng2Shown) {
      ps.ng2Shown = true;
      bus.emit('nani:glimpse', { id: 'NG2', room: state.player.room });
    }
    if (name === 'naniHelp') offerChai(state);
    if (name === 'manifest') manifest(state);
    if (name === 'doom') bus.emit('presence:doom', {});
  }

  // Each threshold fires on an upward crossing and re-arms once Presence
  // drops back below it.
  function checkThresholds(state) {
    const armed = state.presenceState.armed;
    for (const name of ORDER) {
      const at = PR.thresholds[name];
      if (state.presence >= at && armed[name]) {
        armed[name] = false;
        fire(state, name);
      } else if (state.presence < at) {
        armed[name] = true;
      }
    }
  }

  function add(state, delta) {
    if (state.flags.endingId) return;   // nothing changes after an ending
    state.presence = clamp(state.presence + delta, 0, PR.max);
    announce(state);
    checkThresholds(state);
  }

  // Not idle in the dark while doing anything (docs/03 section 5).
  function idleInDark(state) {
    const p = state.player;
    return !state.torchOn && !p.hidden && !p.moving && !p.locked && !state.ui.puzzleOpen &&
      !(state.phone.playing && !state.phone.paused);
  }

  function tickWhispers(state) {
    const ps = state.presenceState;
    const now = state.clock.runSeconds;
    if (state.presence < PR.thresholds.whisper) {
      ps.nextWhisperAt = null;
      return;
    }
    if (ps.nextWhisperAt === null) ps.nextWhisperAt = now + rng.range(...PR.whisperEvery);
    if (now < ps.nextWhisperAt) return;
    ps.nextWhisperAt = now + rng.range(...PR.whisperEvery);
    const line = rng.pick(TEXTS.hollow);
    bus.emit('hollow:whisper', { id: line.id, text: line.hi });
    // A whisper during a search near your hide spot gives you away.
    const v = state.vikram;
    const p = state.player;
    if (v.state === 'SEARCH' && p.hidden && v.room === p.room &&
        Math.abs(v.x - p.x) <= BALANCE.vikram.hideCheckRadius) {
      noise.set(state, state.noise + PR.whisperNoise);
    }
  }

  function tickManifest(state, dt) {
    const f = state.flags;
    if (f.manifestTimer === null) return;
    // Leaving through a door is the only way out. Hiding does not help.
    if (state.player.room !== f.manifestRoom) {
      f.manifestTimer = null;
      f.manifestRoom = null;
      state.presence = PR.manifestResetTo;
      announce(state);
      checkThresholds(state);
      bus.emit('hollow:fade', {});
      return;
    }
    f.manifestTimer -= dt;
    if (f.manifestTimer <= 0) {
      f.manifestTimer = null;
      add(state, PR.max);
    }
  }

  function tickOffer(state, dt) {
    const offer = state.nani.offer;
    if (!offer) return;
    offer.left -= dt;
    if (offer.left <= 0) {
      state.nani.offer = null;
      bus.emit('nani:offerFade', {});
    }
  }

  // NG3: after VM3, a late reflection in the Living window, only if the
  // player is there within ng3WindowSec; otherwise it is skipped.
  function tickReflection(state) {
    const n = state.nani;
    if (n.ng3Until === null) return;
    if (state.clock.runSeconds > n.ng3Until) {
      n.ng3Until = null;
    } else if (state.player.room === 'LIVING') {
      n.ng3Until = null;
      bus.emit('nani:glimpse', { id: 'NG3', room: 'LIVING' });
    }
  }

  return {
    // kind: wrongFix | replay | skipMemory | callFail
    rise(state, kind) {
      add(state, PR.rise[kind]);
    },

    // kind: memoryDone | naniTouch
    fall(state, kind) {
      add(state, -PR.fall[kind]);
    },

    set(state, value) {
      add(state, value - state.presence);
    },

    touchChai(state) {
      const n = state.nani;
      if (!n.offer || n.touchesUsed >= PR.maxNaniTouches) return false;
      n.offer = null;
      n.touchesUsed++;
      bus.emit('nani:touch', {});
      add(state, -PR.fall.naniTouch);
      return true;
    },

    tick(state, dt) {
      if (state.flags.endingId) return;
      const ps = state.presenceState;
      if (idleInDark(state)) {
        ps.idleDarkTimer += dt;
        if (ps.idleDarkTimer > PR.idleDarkAfter) add(state, (PR.rise.idleDarkPer10s / 10) * dt);
      } else {
        ps.idleDarkTimer = 0;
      }
      tickWhispers(state);
      tickManifest(state, dt);
      tickOffer(state, dt);
      tickReflection(state);
    }
  };
}

// The temptation (docs/03 section 11).
export function createTemptation(bus) {
  return {
    show(state) {
      if (state.flags.temptationShown) return;
      state.flags.temptationShown = true;
      const h2 = TEXTS.hollow.find((h) => h.id === 'H2');
      bus.emit('hollow:whisper', { id: h2.id, text: h2.hi });
      bus.emit('temptation:shown', {});
    },

    press(state) {
      if (!state.flags.temptationShown || state.flags.endingId) return false;
      state.flags.temptationPressed = true;
      bus.emit('temptation:pressed', {});
      return true;
    }
  };
}
