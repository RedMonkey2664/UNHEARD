// Noise: what Vikram can hear right now (docs/03 section 4). It only rises
// when something noisy happens AND he is close. Pure.

import { BALANCE } from '../config/balance.js';
import { clamp } from '../utils/math.js';

const N = BALANCE.noise;

// Rooms connect only through the Hall: exactly one side must be the Hall.
export function isAdjacent(a, b) {
  return a !== b && (a === 'HALL') !== (b === 'HALL');
}

export function proximity(state) {
  const v = state.vikram;
  const p = state.player;
  if (v.state === 'AWAY' || !v.room) return N.prox.elsewhere;
  if (v.room === p.room) {
    const d = Math.abs(v.x - p.x);
    if (d < N.closeDist) return N.prox.sameClose;
    if (d < N.midDist) return N.prox.sameMid;
    return N.prox.sameFar;
  }
  if (isAdjacent(v.room, p.room)) return N.prox.adjacent;
  return N.prox.elsewhere;
}

export function createNoise(bus) {
  let lastShown = null;

  function assistMult(state) {
    return state.settings.assist ? BALANCE.assist.noiseMult : 1;
  }

  function announce(state) {
    const shown = Math.round(state.noise);
    if (shown !== lastShown) {
      lastShown = shown;
      bus.emit('noise:changed', { value: state.noise });
    }
  }

  return {
    proximity,

    tick(state, dt) {
      const R = N.rise;
      const p = state.player;
      let rate = 0;
      if (p.moving) rate += p.sneaking ? R.sneak : R.walk;
      if (state.torchOn && !p.hidden) rate += R.torch;
      if (state.phone.playing && !state.phone.paused) rate += R.voicemail;
      if (state.ui.puzzleOpen || state.flags.callConnecting) rate += R.puzzle;
      rate *= proximity(state) * assistMult(state);

      if (rate > 0) {
        state.noise = Math.min(N.max, state.noise + rate * dt);
      } else {
        const sameRoom = state.vikram.room === p.room && state.vikram.state !== 'AWAY';
        const decay = p.hidden && sameRoom ? N.decayHiddenSameRoom : N.decayIdle;
        state.noise = Math.max(0, state.noise - decay * dt);
      }
      announce(state);
    },

    // kind: interact | wrongFix | door | wrongCode
    spike(state, kind) {
      const amount = N.spike[kind] * proximity(state) * assistMult(state);
      if (amount <= 0) return;
      state.noise = Math.min(N.max, state.noise + amount);
      bus.emit('noise:spike', { kind });
      announce(state);
    },

    set(state, value) {
      state.noise = clamp(value, 0, N.max);
      announce(state);
    }
  };
}
