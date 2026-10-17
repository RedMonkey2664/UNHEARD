import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/config/balance.js';
import { createEventBus } from '../src/systems/eventBus.js';
import { createState, setCompleted } from '../src/systems/gameState.js';
import { createNoise } from '../src/systems/noise.js';
import { connectRules } from '../src/systems/rules.js';
import { createVikramAI, planPath } from '../src/systems/vikramAI.js';
import { createRng } from '../src/utils/rng.js';

const V = BALANCE.vikram;
const DT = 0.05;

function setup(act = 2) {
  const bus = createEventBus();
  const log = [];
  const emit = bus.emit;
  bus.emit = (n, p) => { log.push([n, p]); emit(n, p); };
  const noise = createNoise(bus);
  const vikram = createVikramAI(bus, { noise, rng: createRng(42) });
  const state = createState();
  setCompleted(state, { 2: 2, 3: 6, 4: 7 }[act] ?? 2);
  // Keep the player out of his way (Bedroom far corner, AWAY-proof).
  state.player.room = 'LIVING';
  state.player.x = 60;
  return { bus, log, noise, vikram, state };
}

// Runs until pred() is true; returns seconds taken.
function until(ctx, pred, max = 300) {
  let t = 0;
  while (!pred() && t < max) {
    ctx.vikram.tick(ctx.state, DT);
    t += DT;
  }
  return t;
}

describe('planPath', () => {
  it('goes through the Hall between rooms', () => {
    expect(planPath('LIVING', 'KITCHEN', 420)).toEqual([
      { walk: 880 }, { door: 'HALL', toX: 130 }, { walk: 420 }, { door: 'KITCHEN', toX: 70 }, { walk: 420 }
    ]);
    expect(planPath('HALL', 'HALL', 880)).toEqual([{ walk: 880 }]);
  });
});

describe('entering and patrol', () => {
  it('AWAY until entered; ENTERING takes the 3 s key warning, then PATROL from x 880', () => {
    const ctx = setup();
    until(ctx, () => false, 5);
    expect(ctx.state.vikram.state).toBe('AWAY');
    ctx.vikram.enter(ctx.state);
    expect(ctx.log.map(([n]) => n)).toContain('vikram:keyInLock');
    const t = until(ctx, () => ctx.state.vikram.state === 'PATROL');
    expect(t).toBeCloseTo(V.keyWarningSec, 1);
    expect(ctx.state.vikram).toMatchObject({ room: 'HALL', routeId: 'A' });
  });

  it('route A visits LIVING, KITCHEN, BEDROOM then leaves (about 60 s); AWAY is 30 s', () => {
    const ctx = setup();
    ctx.state.player.room = 'HALL';
    ctx.state.player.x = 30;
    ctx.state.player.hidden = true;     // keep noise out of it
    ctx.vikram.enter(ctx.state);
    until(ctx, () => ctx.state.vikram.state === 'PATROL');
    const dwells = [];
    ctx.bus.on('vikram:dwell', ({ room }) => dwells.push(room));
    const patrol = until(ctx, () => ctx.state.vikram.state === 'AWAY');
    expect(dwells).toEqual(['LIVING', 'KITCHEN', 'BEDROOM']);
    // 3720 px at 110 px/s + 20 s dwell + 6 doors at 1 s.
    expect(patrol).toBeGreaterThan(57);
    expect(patrol).toBeLessThan(62);
    const away = until(ctx, () => ctx.state.vikram.state === 'ENTERING');
    expect(away).toBeCloseTo(30, 0);
  });

  it('doors take doorTime', () => {
    const ctx = setup();
    const v = ctx.state.vikram;
    Object.assign(v, { state: 'PATROL', room: 'HALL', x: 420, phase: 'walk',
      path: [{ door: 'KITCHEN', toX: 70 }] });
    ctx.state.flags.vikramEntered = true;
    const t = until(ctx, () => v.room === 'KITCHEN');
    expect(t).toBeCloseTo(V.doorTime, 1);
    expect(v.x).toBe(70);
  });

  it('Act 4 uses route B (reversed) and a 10 s away gap', () => {
    const ctx = setup(4);
    ctx.state.player.hidden = true;
    ctx.vikram.enter(ctx.state);
    until(ctx, () => ctx.state.vikram.state === 'PATROL');
    expect(ctx.state.vikram.routeId).toBe('B');
    const dwells = [];
    ctx.bus.on('vikram:dwell', ({ room }) => dwells.push(room));
    until(ctx, () => ctx.state.vikram.state === 'AWAY');
    expect(dwells).toEqual(['BEDROOM', 'KITCHEN', 'LIVING']);
    expect(until(ctx, () => ctx.state.vikram.state === 'ENTERING')).toBeCloseTo(10, 0);
  });
});

describe('hearing, investigate, search', () => {
  function patrolling() {
    const ctx = setup();
    ctx.vikram.enter(ctx.state);
    until(ctx, () => ctx.state.vikram.state === 'PATROL');
    return ctx;
  }

  it('noise >= 60 with prox > 0 sends a patrolling Vikram to investigate', () => {
    const ctx = patrolling();
    ctx.state.player.room = 'HALL';
    ctx.state.player.x = 500;
    ctx.state.noise = 59;
    ctx.vikram.tick(ctx.state, DT);
    expect(ctx.state.vikram.state).toBe('PATROL');
    ctx.state.noise = 60;
    ctx.vikram.tick(ctx.state, DT);
    expect(ctx.state.vikram.state).toBe('INVESTIGATE');
    expect(ctx.state.vikram.target).toEqual({ room: 'HALL', x: 500 });
    expect(ctx.state.stats.investigations).toBe(1);
  });

  it('noise does not matter when prox is 0', () => {
    const ctx = patrolling();
    ctx.state.player.room = 'BEDROOM';    // he is in the Hall walking to Living
    ctx.state.vikram.room = 'LIVING';
    ctx.state.noise = 90;
    ctx.vikram.tick(ctx.state, DT);
    expect(ctx.state.vikram.state).toBe('PATROL');
  });

  it('INVESTIGATE gives up after 10 s and SEARCHES where he is', () => {
    const ctx = patrolling();
    ctx.vikram.force(ctx.state, 'INVESTIGATE');
    ctx.state.vikram.target = { room: 'BEDROOM', x: 900 };
    ctx.state.vikram.path = [{ walk: 99999 }];          // never arrives
    ctx.state.player.hidden = true;                     // no target refresh
    const t = until(ctx, () => ctx.state.vikram.state === 'SEARCH');
    expect(t).toBeCloseTo(V.investigateTimeout, 1);
  });

  it('SEARCH looks for 6 s, checks hide spots in range nearest first, then noise is 30 and he resumes', () => {
    const ctx = patrolling();
    const v = ctx.state.vikram;
    Object.assign(v, { room: 'BEDROOM', x: 600 });
    ctx.vikram.force(ctx.state, 'SEARCH');
    const checks = [];
    ctx.bus.on('vikram:check', ({ spotId }) => checks.push(spotId));
    const look = until(ctx, () => v.phase !== 'look');
    expect(look).toBeCloseTo(V.searchTime, 1);
    expect(v.searchSpots).toEqual(['BEDROOM_UNDERBED', 'BEDROOM_WARDROBE']);
    ctx.state.noise = 0;
    until(ctx, () => v.state !== 'SEARCH');
    expect(checks).toEqual(['BEDROOM_UNDERBED', 'BEDROOM_WARDROBE']);
    expect(ctx.state.noise).toBe(V.noiseAfterSearch);
    expect(v.state).toBe('PATROL');
  });

  it('hide spots outside 250 px are not checked', () => {
    const ctx = patrolling();
    const v = ctx.state.vikram;
    Object.assign(v, { room: 'LIVING', x: 450 });
    ctx.vikram.force(ctx.state, 'SEARCH');
    until(ctx, () => v.phase !== 'look');
    // Curtain x 70 is 380 away, sofa x 720 is 270 away.
    expect(v.searchSpots).toEqual([]);
  });
});

describe('rules', () => {
  it('completed 1 foreshadows; completed 2 lets him in; interact spikes noise', () => {
    const ctx = setup();
    ctx.state.vikram.state = 'AWAY';
    ctx.state.flags.vikramEntered = false;
    connectRules(ctx.bus, { noise: ctx.noise, vikram: ctx.vikram }, () => ctx.state);
    ctx.bus.emit('memory:end', { completed: 1 });
    expect(ctx.log).toContainEqual(['beat:fire', { id: 'FORESHADOW' }]);
    ctx.bus.emit('memory:end', { completed: 2 });
    expect(ctx.state.vikram.state).toBe('ENTERING');
    ctx.state.vikram = { ...ctx.state.vikram, state: 'PATROL', room: 'LIVING', x: 100 };
    ctx.bus.emit('hotspot:interact', { id: 'H_RADIO' });
    expect(ctx.state.noise).toBeCloseTo(8 * 1.5, 6);
  });

  it('is deterministic for a given seed', () => {
    const run = () => {
      const ctx = setup();
      ctx.vikram.enter(ctx.state);
      until(ctx, () => false, 40);
      return JSON.stringify(ctx.state.vikram);
    };
    expect(run()).toBe(run());
  });
});
