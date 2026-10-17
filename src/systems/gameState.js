// The one GameState object (docs/02 section 5) plus act derivation (docs/03
// section 2). Pure: no Phaser, no DOM.

import { BALANCE } from '../config/balance.js';
import { DEFAULT_SETTINGS, VM_STATUS } from '../config/constants.js';
import { ROOMS } from '../data/rooms.js';

export const VM_COUNT = 7;

function createVoicemails() {
  const vms = {};
  for (let id = 1; id <= VM_COUNT; id++) {
    vms[id] = {
      status: id === 1 ? VM_STATUS.DAMAGED : VM_STATUS.LOCKED,
      playCount: 0,
      memorySkipped: false
    };
  }
  return vms;
}

export function createState(settings = {}) {
  return {
    clock: { runSeconds: 0 },
    act: 1,
    battery: BALANCE.battery.start,
    noise: 0,
    presence: 0,
    torchOn: false,

    player: {
      room: 'HALL', x: ROOMS.HALL.start.x,
      moving: false, sneaking: false,
      hidden: false, hideSpotId: null,
      locked: false,
      facing: 1
    },

    vikram: {
      state: 'AWAY',
      room: null, x: 0,
      stateTimer: 0, awayTimer: 0,
      routeIndex: 0, routeId: 'A', cycle: 0,
      target: null, lastSeen: null,
      seenHiding: false, doorTimer: 0,
      path: [], phase: null, searchSpots: [], refreshTimer: 0,
      moving: false, facing: -1
    },

    phone: {
      open: false, tab: 'VOICEMAIL',
      playing: false, paused: false,
      playingId: null, playPos: 0,
      replay: false
    },

    voicemails: createVoicemails(),

    ui: { puzzleOpen: false },

    inventory: { tools: [], evidence: [] },
    cardPieces: [],
    windowsClosed: [],
    cookerWhistles: 0,
    flags: {
      arrivalShown: false, momText1Sent: false, momText2Sent: false,
      foreshadowDone: false, vikramEntered: false,
      temptationShown: false, temptationPressed: false,
      readUmbrellaTag: false, readCalendar: false, readNotebookPage1: false,
      cardAssembled: false,
      livingWindowReopened: false,
      lockerOpened: false, tapeTaken: false,
      callConnecting: false, callConnected: false, policeEta: null,
      callConnectTimer: 0,
      deadAirTimer: null, manifestTimer: null,
      manifestCount: 0,
      cornerActive: false,
      caught: false, endingId: null, endingCause: null
    },
    presenceState: {
      idleDarkTimer: 0,
      armed: { flicker: true, naniHelp: true, whisper: true,
               manifest: true, doom: true },
      nextWhisperAt: null,
      ng2Shown: false
    },
    hints: { currentVm: 1, damagedSeconds: 0 },
    nani: { touchesUsed: 0, lastOfferAt: -999 },
    messages: [],
    stats: { wrongFixes: 0, replays: 0, skippedMemories: 0, hides: 0,
             investigations: 0, evidenceCount: 0 },
    settings: { ...DEFAULT_SETTINGS, ...settings },
    debug: { godMode: false }
  };
}

export function completedCount(state) {
  let n = 0;
  for (let id = 1; id <= VM_COUNT; id++) {
    if (state.voicemails[id].status === VM_STATUS.DONE) n++;
  }
  return n;
}

// Statuses only: VM 1..n done, the next one current, the rest locked. Used by
// debug and presets; the consequences of each memory are not replayed here.
export function setCompleted(state, n) {
  for (let id = 1; id <= VM_COUNT; id++) {
    const vm = state.voicemails[id];
    if (id <= n) vm.status = VM_STATUS.DONE;
    else if (id === n + 1) vm.status = id === VM_COUNT ? VM_STATUS.FIXED : VM_STATUS.DAMAGED;
    else vm.status = VM_STATUS.LOCKED;
  }
  state.act = deriveAct(state);
}

// Act is derived, never stored independently (docs/03 section 2).
// state.act is only a cache of this value.
export function deriveAct(state) {
  if (state.flags.tapeTaken) return 5;
  const completed = completedCount(state);
  if (completed === 7) return 4;
  if (completed === 6) return 3;
  if (completed >= 2) return 2;
  return 1;
}
