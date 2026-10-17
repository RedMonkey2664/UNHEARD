// Final act (docs/06 section 1). Stage 2 builds the locker only; the tape
// moment, call and police ETA arrive in Stage 5.

import { completedCount } from './gameState.js';

const LOCKER_NEEDS = 7;

export function createFinalAct(bus, { puzzles }) {
  return {
    lockerUsable(state) {
      return completedCount(state) >= LOCKER_NEEDS && !state.flags.lockerOpened;
    },

    // Wrong code: noise spike (Stage 3 listens), no battery cost.
    tryCode(state, code) {
      if (!this.lockerUsable(state)) return { ok: false, reason: 'notYet' };
      if (!puzzles.checkLocker(code)) {
        bus.emit('locker:wrong', {});
        return { ok: false, reason: 'wrongCode' };
      }
      state.flags.lockerOpened = true;
      state.flags.tapeTaken = true;
      if (!state.inventory.evidence.includes('E8')) {
        state.inventory.evidence.push('E8');
        state.stats.evidenceCount = state.inventory.evidence.length;
        bus.emit('evidence:added', { id: 'E8' });
      }
      bus.emit('final:start', {});
      return { ok: true };
    }
  };
}
