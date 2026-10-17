// Final act (docs/06 section 1). So far: the locker and the dead-air timer.
// The tape moment, call and police ETA arrive in Stage 5.

import { completedCount, deriveAct } from './gameState.js';

const LOCKER_NEEDS = 7;

export function createFinalAct(bus, { puzzles }) {
  return {
    // Battery dead and no call: 25 s, then Vikram finds you (docs/03 s3).
    tick(state, dt) {
      const f = state.flags;
      if (f.deadAirTimer === null || f.cornerActive || f.endingId) return;
      f.deadAirTimer = Math.max(0, f.deadAirTimer - dt);
      if (f.deadAirTimer === 0) bus.emit('player:caught', { cause: 'dead_air' });
    },

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
      const prev = state.act;
      state.act = deriveAct(state);
      bus.emit('act:changed', { act: state.act, prev });
      bus.emit('final:start', {});
      return { ok: true };
    }
  };
}
