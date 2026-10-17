import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/config/balance.js';
import { createNoise } from '../src/systems/noise.js';
import { createPresence, createTemptation } from '../src/systems/presence.js';
import { connectRules } from '../src/systems/rules.js';
import { createVikramAI } from '../src/systems/vikramAI.js';
import { createRng } from '../src/utils/rng.js';
import { runFor, setupFlow, SOLUTIONS } from './helpers.js';

const PR = BALANCE.presence;

function setup() {
  const ctx = setupFlow();
  ctx.noise = createNoise(ctx.bus);
  ctx.vikram = createVikramAI(ctx.bus, { noise: ctx.noise, rng: createRng(1) });
  ctx.presence = createPresence(ctx.bus, { noise: ctx.noise, rng: createRng(99) });
  ctx.temptation = createTemptation(ctx.bus);
  connectRules(ctx.bus, ctx, () => ctx.state);
  ctx.thresholds = () => ctx.log.filter(([n]) => n === 'presence:threshold').map(([, p]) => p.name);
  return ctx;
}

function finish(ctx, id, skip = false) {
  ctx.flow.attemptFix(ctx.state, id, SOLUTIONS[id]);
  ctx.flow.play(ctx.state, id);
  runFor((dt) => ctx.flow.tick(ctx.state, dt), 20);
  ctx.flow.endMemory(ctx.state, id, skip);
}

describe('rises and falls', () => {
  it('wrong fix +10, skip +20 (instead of -5), finished memory -5, replay +10', () => {
    const ctx = setup();
    ctx.flow.attemptFix(ctx.state, 1, 99);
    expect(ctx.state.presence).toBe(10);
    finish(ctx, 1, true);
    expect(ctx.state.presence).toBe(30);
    finish(ctx, 2);
    expect(ctx.state.presence).toBe(25);
    ctx.flow.play(ctx.state, 1);
    expect(ctx.state.presence).toBe(35);
    ctx.bus.emit('call:failed', {});
    expect(ctx.state.presence).toBe(40);
  });

  it('clamps 0 to 100', () => {
    const ctx = setup();
    ctx.presence.fall(ctx.state, 'memoryDone');
    expect(ctx.state.presence).toBe(0);
    ctx.presence.set(ctx.state, 150);
    expect(ctx.state.presence).toBe(100);
  });

  it('idle in the dark: nothing for 5 s, then +2 per 10 s', () => {
    const ctx = setup();
    runFor((dt) => ctx.presence.tick(ctx.state, dt), 5);
    expect(ctx.state.presence).toBe(0);
    runFor((dt) => ctx.presence.tick(ctx.state, dt), 10);
    expect(ctx.state.presence).toBeCloseTo(2, 1);
  });

  it('no idle accrual with the torch on, hidden, moving or playing', () => {
    for (const tweak of [(s) => { s.torchOn = true; }, (s) => { s.player.hidden = true; },
      (s) => { s.player.moving = true; }, (s) => { s.phone.playing = true; }, (s) => { s.ui.puzzleOpen = true; }]) {
      const ctx = setup();
      tweak(ctx.state);
      runFor((dt) => ctx.presence.tick(ctx.state, dt), 30);
      expect(ctx.state.presence).toBe(0);
    }
  });
});

describe('thresholds', () => {
  it('fire once per upward crossing and re-arm after a drop', () => {
    const ctx = setup();
    ctx.presence.set(ctx.state, 35);
    ctx.presence.set(ctx.state, 40);
    expect(ctx.thresholds()).toEqual(['flicker']);
    ctx.presence.set(ctx.state, 20);
    ctx.presence.set(ctx.state, 31);
    expect(ctx.thresholds()).toEqual(['flicker', 'flicker']);
  });

  it('a jump fires every threshold it passes, in order', () => {
    const ctx = setup();
    ctx.presence.set(ctx.state, 65);
    expect(ctx.thresholds()).toEqual(['flicker', 'naniHelp', 'whisper']);
  });

  it('NG2 shows on the first flicker crossing only', () => {
    const ctx = setup();
    ctx.presence.set(ctx.state, 31);
    ctx.presence.set(ctx.state, 0);
    ctx.presence.set(ctx.state, 31);
    const ng2 = ctx.log.filter(([n, p]) => n === 'nani:glimpse' && p.id === 'NG2');
    expect(ng2).toHaveLength(1);
  });
});

describe("Nani's chai (NG4)", () => {
  it('offered at 45, tapping it gives -10; at most 3 touches; 90 s cooldown', () => {
    const ctx = setup();
    const s = ctx.state;
    ctx.presence.set(s, 50);
    expect(s.nani.offer).not.toBeNull();
    expect(Math.abs(s.nani.offer.x - s.player.x)).toBe(BALANCE.nani.ng4Dist);
    expect(ctx.presence.touchChai(s)).toBe(true);
    expect(s.presence).toBe(40);
    // Crossing again inside the cooldown: no offer.
    ctx.presence.set(s, 50);
    expect(s.nani.offer).toBeNull();
    for (let i = 0; i < 2; i++) {
      s.clock.runSeconds += PR.naniOfferCooldown;
      ctx.presence.set(s, 40);
      ctx.presence.set(s, 50);
      expect(ctx.presence.touchChai(s)).toBe(true);
    }
    s.clock.runSeconds += PR.naniOfferCooldown;
    ctx.presence.set(s, 40);
    ctx.presence.set(s, 50);
    expect(s.nani.offer).toBeNull();
    expect(s.nani.touchesUsed).toBe(3);
  });

  it('fades if ignored for 12 s', () => {
    const ctx = setup();
    ctx.state.torchOn = true;           // keep idle accrual out of it
    ctx.presence.set(ctx.state, 50);
    runFor((dt) => ctx.presence.tick(ctx.state, dt), 12.1);
    expect(ctx.state.nani.offer).toBeNull();
  });
});

describe('manifestation', () => {
  it('leave the room within 5 s: Presence 75, no ending', () => {
    const ctx = setup();
    ctx.state.torchOn = true;
    ctx.presence.set(ctx.state, 90);
    expect(ctx.log).toContainEqual(['hollow:manifest', { full: true, room: 'HALL' }]);
    runFor((dt) => ctx.presence.tick(ctx.state, dt), 4);
    ctx.state.player.room = 'KITCHEN';
    ctx.presence.tick(ctx.state, 0.05);
    expect(ctx.state.presence).toBe(PR.manifestResetTo);
    expect(ctx.state.flags.endingId).toBeNull();
  });

  it('stay 5 s (even hidden): Presence 100 -> LATER presence_doom', () => {
    const ctx = setup();
    ctx.state.player.hidden = true;
    ctx.presence.set(ctx.state, 92);
    runFor((dt) => ctx.presence.tick(ctx.state, dt), 5.1);
    expect(ctx.state.presence).toBe(100);
    expect(ctx.log).toContainEqual(['ending:trigger', { id: 'LATER', cause: 'presence_doom' }]);
  });

  it('only the first manifestation is the full jump scare', () => {
    const ctx = setup();
    ctx.state.torchOn = true;
    ctx.presence.set(ctx.state, 90);
    ctx.state.player.room = 'KITCHEN';
    ctx.presence.tick(ctx.state, 0.05);
    ctx.presence.set(ctx.state, 95);
    const fulls = ctx.log.filter(([n]) => n === 'hollow:manifest').map(([, p]) => p.full);
    expect(fulls).toEqual([true, false]);
  });
});

describe('whispers', () => {
  it('every 20 to 35 s at Presence >= 60, none below', () => {
    const ctx = setup();
    ctx.state.torchOn = true;
    const at = [];
    ctx.bus.on('hollow:whisper', () => at.push(ctx.state.clock.runSeconds));
    const step = (dt) => { ctx.state.clock.runSeconds += dt; ctx.presence.tick(ctx.state, dt); };
    runFor(step, 60);
    expect(at).toEqual([]);
    ctx.presence.set(ctx.state, 65);
    runFor(step, 200, 0.25);
    expect(at.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < at.length; i++) {
      expect(at[i] - at[i - 1]).toBeGreaterThanOrEqual(20 - 0.3);
      expect(at[i] - at[i - 1]).toBeLessThanOrEqual(35 + 0.3);
    }
  });

  it('a whisper during a search near your hide spot adds 15 noise', () => {
    const ctx = setup();
    const s = ctx.state;
    ctx.presence.set(s, 65);
    Object.assign(s.player, { room: 'BEDROOM', x: 790, hidden: true });
    Object.assign(s.vikram, { state: 'SEARCH', room: 'BEDROOM', x: 600 });
    s.presenceState.nextWhisperAt = 0;
    ctx.presence.tick(s, 0.05);
    expect(s.noise).toBe(PR.whisperNoise);
  });
});

describe('temptation', () => {
  it('appears when VM4 memory ends, with whisper H2', () => {
    const ctx = setup();
    ctx.flow.debugComplete(ctx.state, 4);
    expect(ctx.state.flags.temptationShown).toBe(true);
    expect(ctx.log).toContainEqual(['hollow:whisper', { id: 'H2', text: 'Play the last one first, beta. Why wait, beta?' }]);
  });

  it('pressing PLAY #8 NOW ends the run with LATER, cause temptation', () => {
    const ctx = setup();
    expect(ctx.temptation.press(ctx.state)).toBe(false);   // not shown yet
    ctx.flow.debugComplete(ctx.state, 4);
    expect(ctx.temptation.press(ctx.state)).toBe(true);
    expect(ctx.log).toContainEqual(['ending:trigger', { id: 'LATER', cause: 'temptation' }]);
    expect(ctx.state.flags.temptationPressed).toBe(true);
  });

  it('nothing changes after an ending', () => {
    const ctx = setup();
    ctx.flow.debugComplete(ctx.state, 4);
    ctx.temptation.press(ctx.state);
    ctx.presence.set(ctx.state, 50);
    expect(ctx.state.presence).toBe(0);
  });
});

describe('NG3', () => {
  it('reflection only if the player is in the Living room within 30 s of VM3', () => {
    const ctx = setup();
    ctx.flow.debugComplete(ctx.state, 3);
    ctx.state.clock.runSeconds += 31;
    ctx.state.player.room = 'LIVING';
    ctx.presence.tick(ctx.state, 0.05);
    expect(ctx.log.some(([n, p]) => n === 'nani:glimpse' && p.id === 'NG3')).toBe(false);

    const ok = setup();
    ok.flow.debugComplete(ok.state, 3);
    ok.state.player.room = 'LIVING';
    ok.presence.tick(ok.state, 0.05);
    expect(ok.log.some(([n, p]) => n === 'nani:glimpse' && p.id === 'NG3')).toBe(true);
  });
});
