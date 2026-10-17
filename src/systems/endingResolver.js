// Ending resolution (docs/06 section 2). Pure.

import { BALANCE } from '../config/balance.js';

const PHYSICAL = ['E1', 'E2', 'E4', 'E5', 'E6'];
const PRIORITY = { LATER: 3, CAUGHT: 2, EAT_PROPERLY: 1, STATIC: 1 };
// The corner event is a cinematic, not a test: these causes are ignored.
const CORNER_IGNORES = ['caught', 'dead_air'];

export function resolveEnding(cause, state) {
  if (cause === 'temptation' || cause === 'presence_doom') return 'LATER';
  if (cause === 'caught' || cause === 'dead_air') return 'CAUGHT';
  if (cause === 'police_arrived') {
    return state.presence <= BALANCE.final.niceEndingMaxPresence ? 'EAT_PROPERLY' : 'STATIC';
  }
  throw new Error('unknown ending cause: ' + cause);
}

export function physicalEvidenceCount(state) {
  return PHYSICAL.filter((id) => state.inventory.evidence.includes(id)).length;
}

// Epilogue band for the evidence card: '5', '3-4' or '0-2'.
export function epilogueKey(state) {
  const n = physicalEvidenceCount(state);
  if (n >= 5) return '5';
  if (n >= 3) return '3-4';
  return '0-2';
}

// Causes raised during a frame are collected and resolved together at the
// end of it (frame step 10), so LATER wins over CAUGHT in the same frame.
// deferred: false resolves each request at once (used in unit tests).
export function createEndingResolver(bus, { deferred = true } = {}) {
  let pending = [];

  const api = {
    request(state, cause) {
      if (state.flags.endingId) return;
      pending.push(cause);
      if (!deferred) api.flush(state);
    },

    flush(state) {
      const causes = pending;
      pending = [];
      if (state.flags.endingId || !causes.length) return null;
      let best = null;
      for (const cause of causes) {
        if (state.flags.cornerActive && CORNER_IGNORES.includes(cause)) continue;
        const id = resolveEnding(cause, state);
        if (!best || PRIORITY[id] > PRIORITY[best.id]) best = { id, cause };
      }
      if (!best) return null;
      state.flags.endingId = best.id;
      state.flags.endingCause = best.cause;
      if (best.id === 'CAUGHT') state.flags.caught = true;
      bus.emit('ending:trigger', best);
      return best;
    }
  };
  return api;
}
