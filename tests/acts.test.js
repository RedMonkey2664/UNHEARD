import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/config/balance.js';
import { TEXTS } from '../src/data/texts.js';
import { createBarks } from '../src/systems/barks.js';
import { createFinalAct } from '../src/systems/finalAct.js';
import { completedCount, setCompleted } from '../src/systems/gameState.js';
import { createNoise } from '../src/systems/noise.js';
import { applyPreset } from '../src/systems/presets.js';
import { connectRules } from '../src/systems/rules.js';
import { actParams, createVikramAI } from '../src/systems/vikramAI.js';
import { createRng } from '../src/utils/rng.js';
import { runFor, setupFlow } from './helpers.js';

const V = BALANCE.vikram;

function setup() {
  const ctx = setupFlow();
  ctx.noise = createNoise(ctx.bus);
  ctx.vikram = createVikramAI(ctx.bus, { noise: ctx.noise, rng: createRng(3) });
  ctx.barks = createBarks(ctx.bus);
  ctx.finalAct = createFinalAct(ctx.bus, { puzzles: ctx.puzzles });
  connectRules(ctx.bus, ctx, () => ctx.state);
  return ctx;
}

describe('per-act parameters', () => {
  it.each([[2, 2], [6, 3], [7, 4]])('completed %i -> act %i uses that act\'s parameters', (done, act) => {
    const { state } = setupFlow();
    setCompleted(state, done);
    expect(state.act).toBe(act);
    expect(actParams(state)).toEqual(V.acts[act]);
  });

  it('later acts are faster with shorter gaps, and Act 4 reverses the route', () => {
    expect(V.acts[3].speed).toBeGreaterThan(V.acts[2].speed);
    expect(V.acts[4].speed).toBeGreaterThan(V.acts[3].speed);
    expect(V.acts[3].away).toBeLessThan(V.acts[2].away);
    expect(V.acts[4].away).toBeLessThan(V.acts[3].away);
    expect(V.acts[4].route).toBe('B');
  });
});

describe('dead air', () => {
  it('battery 0 without a call: he comes back with a door slam, CAUGHT after deadAirDoomSec', () => {
    const ctx = setup();
    setCompleted(ctx.state, 2);
    Object.assign(ctx.state.vikram, { state: 'AWAY', awayTimer: 999 });
    ctx.state.flags.vikramEntered = true;
    ctx.battery.set(ctx.state, 0);
    expect(ctx.state.flags.deadAirTimer).toBe(BALANCE.battery.deadAirDoomSec);
    expect(ctx.names()).toContain('vikram:doorSlam');
    runFor((dt) => ctx.vikram.tick(ctx.state, dt), V.huntReenterSec + 0.1);
    expect(ctx.state.vikram.room).toBe('HALL');
    runFor((dt) => ctx.finalAct.tick(ctx.state, dt), BALANCE.battery.deadAirDoomSec - 0.1);
    expect(ctx.state.flags.endingId).toBeNull();
    runFor((dt) => ctx.finalAct.tick(ctx.state, dt), 0.2);
    expect(ctx.log).toContainEqual(['ending:trigger', { id: 'CAUGHT', cause: 'dead_air' }]);
  });

  it('battery 0 with the call connected changes nothing', () => {
    const ctx = setup();
    ctx.state.flags.callConnected = true;
    ctx.battery.set(ctx.state, 0);
    expect(ctx.state.flags.deadAirTimer).toBeNull();
    expect(ctx.names()).not.toContain('vikram:doorSlam');
  });

  it('battery 0 in Act 1 brings him in too', () => {
    const ctx = setup();
    ctx.battery.set(ctx.state, 0);
    expect(ctx.state.vikram.state).toBe('ENTERING');
    expect(ctx.state.flags.vikramEntered).toBe(true);
  });
});

describe('barks', () => {
  function near(ctx) {
    Object.assign(ctx.state.vikram, { state: 'PATROL', room: 'HALL', x: 600, phase: 'dwell', stateTimer: 99 });
    ctx.state.player.room = 'HALL';
    ctx.state.player.x = 500;
  }

  it('one bark, then silence for 12 s, then the next line in order', () => {
    const ctx = setup();
    near(ctx);
    const barks = [];
    ctx.bus.on('vikram:bark', (b) => barks.push(b));
    runFor((dt) => ctx.barks.tick(ctx.state, dt), V.barkCooldown - 0.1);
    expect(barks).toHaveLength(1);
    runFor((dt) => ctx.barks.tick(ctx.state, dt), 0.2);
    expect(barks.map((b) => b.text)).toEqual(TEXTS.barks.patrol.slice(0, 2));
  });

  it('is silent when he is not within earshot', () => {
    const ctx = setup();
    near(ctx);
    ctx.state.player.room = 'BEDROOM';
    ctx.state.vikram.room = 'LIVING';
    expect(ctx.barks.say(ctx.state, 'patrol')).toBe(false);
  });

  it("'away' lines only by the front door", () => {
    const ctx = setup();
    Object.assign(ctx.state.vikram, { state: 'AWAY', room: null });
    ctx.state.flags.vikramEntered = true;
    ctx.state.player.x = 500;
    expect(ctx.barks.say(ctx.state, 'away')).toBe(false);
    ctx.state.player.x = 860;
    expect(ctx.barks.say(ctx.state, 'away')).toBe(true);
  });

  it('a state change speaks from its set', () => {
    const ctx = setup();
    near(ctx);
    const barks = [];
    ctx.bus.on('vikram:bark', (b) => barks.push(b.set));
    ctx.state.player.x = 300;                   // out of sight (torch off), in earshot
    ctx.state.noise = 70;
    ctx.vikram.tick(ctx.state, 0.05);
    expect(barks).toEqual(['investigate']);
  });
});

describe('noise from playback and puzzles', () => {
  it('playing a voicemail near him adds rise.voicemail; an open puzzle rise.puzzle', () => {
    const ctx = setup();
    Object.assign(ctx.state.vikram, { state: 'PATROL', room: 'HALL', x: 800 });
    ctx.state.player.x = 500;                  // 300 px: sameMid x1.0
    ctx.state.phone.playing = true;
    ctx.noise.tick(ctx.state, 1);
    expect(ctx.state.noise).toBeCloseTo(BALANCE.noise.rise.voicemail, 6);
    ctx.state.phone.playing = false;
    ctx.state.ui.puzzleOpen = true;
    ctx.noise.tick(ctx.state, 1);
    expect(ctx.state.noise).toBeCloseTo(BALANCE.noise.rise.voicemail + BALANCE.noise.rise.puzzle, 6);
  });
});

describe('skip-to-act presets', () => {
  it.each([1, 2, 3, 4, 5])('Act %i preset matches docs/09', (act) => {
    const ctx = setup();
    applyPreset(ctx.state, act, ctx);
    const s = ctx.state;
    const expected = { 1: [0, 100], 2: [2, 82], 3: [6, 38], 4: [7, 28], 5: [7, 24] }[act];
    expect(completedCount(s)).toBe(expected[0]);
    expect(s.battery).toBe(expected[1]);
    expect(s.presence).toBe(0);
    if (act === 2) {
      expect(s.inventory.evidence).toEqual(expect.arrayContaining(['E1', 'E2']));
      expect(s.inventory.tools).toEqual(['GLASSES', 'EARPHONES']);
      expect(s.vikram).toMatchObject({ state: 'AWAY', awayTimer: 5 });
    }
    if (act === 3) expect(s.flags.momText2Sent).toBe(true);
    if (act === 4) expect(ctx.finalAct.lockerUsable(s)).toBe(true);
    if (act === 5) {
      expect(s.flags.tapeTaken).toBe(true);
      expect(s.act).toBe(5);
    }
  });
});
