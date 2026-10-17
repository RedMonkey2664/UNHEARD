import { describe, expect, it } from 'vitest';
import { createFixPuzzles } from '../src/systems/fixPuzzles.js';
import { createState } from '../src/systems/gameState.js';

const fp = createFixPuzzles();
const s = createState();

describe('RADIO', () => {
  it('94.3 +-0.1 passes; 94.5 fails', () => {
    expect(fp.validate('RADIO', 94.3, s)).toBe(true);
    expect(fp.validate('RADIO', 94.2, s)).toBe(true);
    expect(fp.validate('RADIO', 94.4, s)).toBe(true);
    // Float sums from 0.1 steps must still pass.
    expect(fp.validate('RADIO', 88 + 0.1 * 63, s)).toBe(true);
    expect(fp.validate('RADIO', 94.5, s)).toBe(false);
    expect(fp.validate('RADIO', 94.1, s)).toBe(false);
  });
});

describe('CARD', () => {
  it('order A, B, C passes; others fail', () => {
    expect(fp.validate('CARD', ['CARD_A', 'CARD_B', 'CARD_C'], s)).toBe(true);
    expect(fp.validate('CARD', ['CARD_B', 'CARD_A', 'CARD_C'], s)).toBe(false);
    expect(fp.validate('CARD', ['CARD_A', 'CARD_B'], s)).toBe(false);
  });
});

describe('WINDOWS', () => {
  it('KITCHEN, BEDROOM, LIVING passes; others fail', () => {
    expect(fp.validate('WINDOWS', ['KITCHEN', 'BEDROOM', 'LIVING'], s)).toBe(true);
    expect(fp.validate('WINDOWS', ['LIVING', 'BEDROOM', 'KITCHEN'], s)).toBe(false);
  });

  it('closeWindow records order, ignores repeats, reports on the third', () => {
    const st = createState();
    expect(fp.closeWindow(st, 'KITCHEN')).toBeNull();
    expect(fp.closeWindow(st, 'KITCHEN')).toBeNull();
    expect(fp.closeWindow(st, 'LIVING')).toBeNull();
    expect(fp.closeWindow(st, 'BEDROOM')).toEqual({ order: ['KITCHEN', 'LIVING', 'BEDROOM'] });
  });
});

describe('COOKER', () => {
  it('4 passes, anything else fails', () => {
    expect(fp.validate('COOKER', 4, s)).toBe(true);
    expect(fp.validate('COOKER', 3, s)).toBe(false);
    expect(fp.validate('COOKER', '4', s)).toBe(false);
  });
});

describe('NOTE', () => {
  it('needs GLASSES', () => {
    const st = createState();
    expect(fp.validate('NOTE', null, st)).toBe(false);
    st.inventory.tools.push('GLASSES');
    expect(fp.validate('NOTE', null, st)).toBe(true);
  });
});

describe('EARPHONES', () => {
  it('the picker accepts EARPHONES only', () => {
    expect(fp.validate('EARPHONES', 'EARPHONES', s)).toBe(true);
    expect(fp.validate('EARPHONES', 'GLASSES', s)).toBe(false);
  });
});

describe('locker', () => {
  it('0614 opens it', () => {
    expect(fp.checkLocker('0614')).toBe(true);
    expect(fp.checkLocker('6140')).toBe(false);
  });

  it('unknown fix types throw', () => {
    expect(() => fp.validate('NOPE', 1, s)).toThrow();
  });
});
