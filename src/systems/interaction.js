// Hotspot variants, the condition mini-language (docs/04 section 2) and door
// passage. Pure: no Phaser.

import { VM_STATUS } from '../config/constants.js';
import { ROOMS } from '../data/rooms.js';
import { CARD_PIECES } from '../data/items.js';
import { VM_COUNT } from './gameState.js';

const FIXED_OR_LATER = [VM_STATUS.FIXED, VM_STATUS.PLAYING, VM_STATUS.MEMORY,
  VM_STATUS.DONE];

// Lowest-numbered voicemail that is not done (docs/03 section 9 gating).
export function currentVmId(state) {
  for (let id = 1; id <= VM_COUNT; id++) {
    if (state.voicemails[id].status !== VM_STATUS.DONE) return id;
  }
  return null;
}

function doneCount(state) {
  let n = 0;
  for (let id = 1; id <= VM_COUNT; id++) {
    if (state.voicemails[id].status === VM_STATUS.DONE) n++;
  }
  return n;
}

const CHECKS = {
  vmCurrent: (s, n) => currentVmId(s) === n && s.voicemails[n].status === VM_STATUS.DAMAGED,
  vmFixed: (s, n) => FIXED_OR_LATER.includes(s.voicemails[n].status),
  vmDone: (s, n) => s.voicemails[n].status === VM_STATUS.DONE,
  completedAtLeast: (s, n) => doneCount(s) >= n,
  flag: (s, name) => s.flags[name] === true,
  notFlag: (s, name) => !s.flags[name],
  hasTool: (s, id) => s.inventory.tools.includes(id),
  hasEvidence: (s, id) => s.inventory.evidence.includes(id),
  notHasEvidence: (s, id) => !s.inventory.evidence.includes(id),
  hasCardPiece: (s, id) => s.cardPieces.includes(id),
  notHasCardPiece: (s, id) => !s.cardPieces.includes(id),
  hasAllCardPieces: (s, want) =>
    Object.keys(CARD_PIECES).every((id) => s.cardPieces.includes(id)) === want,
  windowClosed: (s, id) => s.windowsClosed.includes(id)
};

// A "when" passes only if every key passes. Unknown keys throw so a data
// typo fails loudly in tests instead of silently picking the wrong variant.
export function checkWhen(when, state) {
  if (!when) return true;
  for (const key of Object.keys(when)) {
    const check = CHECKS[key];
    if (!check) throw new Error('unknown condition: ' + key);
    if (!check(state, when[key])) return false;
  }
  return true;
}

export function pickVariant(hotspot, state) {
  return hotspot.variants.find((v) => checkWhen(v.when, state)) || null;
}

export function createInteraction(bus) {
  // Actions that only change state are applied here. The rest (openFix,
  // closeWindow, openKeypad, glimpse) are returned for later stages to run.
  function applyAction(state, action) {
    if (!action) return null;
    if (action.setFlag) state.flags[action.setFlag] = true;
    if (action.giveTool && !state.inventory.tools.includes(action.giveTool)) {
      state.inventory.tools.push(action.giveTool);
      bus.emit('item:added', { id: action.giveTool, kind: 'tool' });
    }
    if (action.giveEvidence && !state.inventory.evidence.includes(action.giveEvidence)) {
      state.inventory.evidence.push(action.giveEvidence);
      state.stats.evidenceCount = state.inventory.evidence.length;
      bus.emit('evidence:added', { id: action.giveEvidence });
    }
    if (action.giveCardPiece && !state.cardPieces.includes(action.giveCardPiece)) {
      state.cardPieces.push(action.giveCardPiece);
      bus.emit('item:added', { id: action.giveCardPiece, kind: 'card' });
    }
    return action;
  }

  return {
    // Returns { text, action } for the chosen variant.
    interact(state, hotspotId) {
      const hotspot = ROOMS[state.player.room].hotspots.find((h) => h.id === hotspotId);
      if (!hotspot) return null;
      const variant = pickVariant(hotspot, state);
      bus.emit('hotspot:interact', { id: hotspotId });
      if (!variant) return null;
      return { text: variant.examine, action: applyAction(state, variant.action) };
    },

    // Moves the player through a door. Locked doors return their examine text.
    useDoor(state, doorId) {
      const from = state.player.room;
      const door = ROOMS[from].doors.find((d) => d.id === doorId);
      if (!door) return null;
      if (door.locked || !door.to) return { passed: false, text: door.examine || null };
      state.player.room = door.to;
      state.player.x = door.toX;
      bus.emit('room:enter', { room: door.to, from });
      return { passed: true };
    },

    // Debug teleport.
    teleport(state, room, x) {
      const from = state.player.room;
      state.player.room = room;
      state.player.x = x;
      bus.emit('room:enter', { room, from, teleport: true });
    }
  };
}
