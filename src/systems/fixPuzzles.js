// Validators for the 6 fix types plus the locker code (docs/03 section 10).
// Pure: they only answer "is this right?". voicemailFlow applies results.

import { BALANCE } from '../config/balance.js';

const Z = BALANCE.puzzles;
const EPS = 1e-6;  // the dial steps in 0.1, so compare with a float margin

function sameOrder(a, b) {
  return Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i]);
}

export const VALIDATORS = {
  RADIO: (value) => typeof value === 'number' &&
    Math.abs(value - Z.radio.solution) <= Z.radio.tolerance + EPS,
  CARD: (order) => sameOrder(order, Z.cardOrder),
  WINDOWS: (order) => sameOrder(order, Z.windowOrder),
  COOKER: (n) => n === Z.cooker.solution,
  NOTE: (_input, state) => state.inventory.tools.includes('GLASSES'),
  EARPHONES: (itemId) => itemId === 'EARPHONES',
  NONE: () => true
};

export function createFixPuzzles() {
  return {
    validate(type, input, state) {
      const v = VALIDATORS[type];
      if (!v) throw new Error('unknown fix type: ' + type);
      return v(input, state);
    },

    checkLocker(code) {
      return String(code) === Z.lockerCode;
    },

    // Closing a window records the order. Returns null until the third
    // window, then { order } for voicemailFlow to validate.
    closeWindow(state, id) {
      if (state.windowsClosed.includes(id)) return null;
      state.windowsClosed.push(id);
      if (state.windowsClosed.length < Z.windowOrder.length) return null;
      return { order: state.windowsClosed.slice() };
    }
  };
}
