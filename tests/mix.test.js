import { describe, expect, it } from 'vitest';
import { ambienceGains, barkKey, dbToGain, dreadGain, heartbeatGain, stepInterval, whisperGain,
  whisperKey } from '../src/audio/mix.js';
import { createState } from '../src/systems/gameState.js';
import { footstepMix } from '../src/systems/footsteps.js';

describe('mix maths (docs/07 section 8)', () => {
  it('dB to gain', () => {
    expect(dbToGain(0)).toBe(1);
    expect(dbToGain(-6)).toBeCloseTo(0.501, 3);
  });

  it('step interval is 0.55 s at speed 110 and scales inversely', () => {
    expect(stepInterval(110)).toBeCloseTo(0.55, 6);
    expect(stepInterval(220)).toBeCloseTo(0.275, 6);
  });

  it('whispers go from -18 dB at 60 to -8 dB at 100', () => {
    expect(whisperGain(60)).toBeCloseTo(dbToGain(-18), 6);
    expect(whisperGain(100)).toBeCloseTo(dbToGain(-8), 6);
    expect(whisperGain(40)).toBeCloseTo(dbToGain(-18), 6);
  });

  it('heartbeat = noise/100 x 0.8', () => {
    expect(heartbeatGain(50)).toBeCloseTo(0.4, 6);
    expect(heartbeatGain(200)).toBeCloseTo(0.8, 6);
  });

  it('ambience crossfades warm to cold and ducks to 40 percent', () => {
    const a = ambienceGains(0, false);
    expect(a.cold).toBe(0);
    const b = ambienceGains(100, true);
    expect(b.flat).toBe(0);
    expect(b.cold).toBeCloseTo(dbToGain(-24) * 0.4, 6);
    expect(dreadGain(1, false)).toBe(0);
    expect(dreadGain(5, true)).toBeCloseTo(dbToGain(-20) * 0.25, 6);
  });

  it('asset keys for barks and whispers', () => {
    expect(barkKey('patrol', 0)).toBe('vik_p1');
    expect(barkKey('entering', 0)).toBe('vik_entering');
    expect(barkKey('away', 1)).toBe('vik_a2');
    expect(whisperKey('H7')).toBe('hol_7');
  });
});

describe('footstep mix (docs/07 section 8.5)', () => {
  function walking(vRoom, vx, pRoom, px) {
    const s = createState();
    Object.assign(s.vikram, { state: 'PATROL', room: vRoom, x: vx, moving: true });
    Object.assign(s.player, { room: pRoom, x: px });
    return s;
  }

  it('same room: volume falls to 0.45 over 700 px; pan follows his side', () => {
    expect(footstepMix(walking('HALL', 500, 'HALL', 500))).toEqual({ volume: 1, pan: 0, muffled: false });
    const far = footstepMix(walking('HALL', 900, 'HALL', 100));
    expect(far.volume).toBeCloseTo(0.45, 6);
    expect(far.pan).toBe(0.9);
    expect(footstepMix(walking('HALL', 260, 'HALL', 500)).pan).toBeCloseTo(-0.5, 6);
  });

  it('adjacent: 0.35 (0.25 without a filter), muffled, panned by door position', () => {
    const m = footstepMix(walking('KITCHEN', 300, 'HALL', 900));
    expect(m).toMatchObject({ volume: 0.35, muffled: true });
    expect(m.pan).toBe(-0.9);                 // (420 - 900) / 480 = -1, clamped to -0.9
    expect(footstepMix(walking('KITCHEN', 300, 'HALL', 600)).pan).toBeCloseTo((420 - 600) / 480, 6);
    expect(footstepMix(walking('KITCHEN', 300, 'HALL', 900), false).volume).toBe(0.25);
  });

  it('elsewhere, AWAY or standing still: silent', () => {
    expect(footstepMix(walking('KITCHEN', 300, 'LIVING', 500))).toBeNull();
    const still = walking('HALL', 500, 'HALL', 500);
    still.vikram.moving = false;
    expect(footstepMix(still)).toBeNull();
  });
});
