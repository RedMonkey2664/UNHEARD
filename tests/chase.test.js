import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/config/balance.js';
import { createBattery } from '../src/systems/battery.js';
import { createEventBus } from '../src/systems/eventBus.js';
import { createState, setCompleted } from '../src/systems/gameState.js';
import { createHideSystem } from '../src/systems/hideSystem.js';
import { createNaniWarning, secondsUntilEnters } from '../src/systems/naniWarning.js';
import { createNoise } from '../src/systems/noise.js';
import { connectRules } from '../src/systems/rules.js';
import { canSee, createVikramAI, vikramSpeed } from '../src/systems/vikramAI.js';
import { createRng } from '../src/utils/rng.js';

const V = BALANCE.vikram;
const DT = 0.05;

function setup() {
  const bus = createEventBus();
  const log = [];
  const emit = bus.emit;
  bus.emit = (n, p) => { log.push([n, p]); emit(n, p); };
  const noise = createNoise(bus);
  const battery = createBattery(bus);
  const vikram = createVikramAI(bus, { noise, rng: createRng(7) });
  const hide = createHideSystem(bus, { battery });
  const state = createState();
  setCompleted(state, 2);
  state.flags.vikramEntered = true;
  connectRules(bus, { noise, vikram }, () => state);
  return { bus, log, noise, vikram, hide, state };
}

// Vikram standing in a room in a given state.
function place(ctx, room, x, playerX, st = 'PATROL') {
  Object.assign(ctx.state.vikram, { state: st, room, x, path: [], phase: 'dwell', stateTimer: 99 });
  ctx.state.player.room = room;
  ctx.state.player.x = playerX;
}

function run(ctx, seconds) {
  for (let t = 0; t < seconds; t += DT) {
    ctx.vikram.tick(ctx.state, DT);
    if (ctx.state.vikram.state === 'CAUGHT') return;
  }
}

describe('sight', () => {
  it('torch on: 520 px; torch off: 130 px; hidden: never', () => {
    const ctx = setup();
    place(ctx, 'HALL', 900, 900 - 500);
    expect(canSee(ctx.state)).toBe(false);
    ctx.state.torchOn = true;
    expect(canSee(ctx.state)).toBe(true);
    ctx.state.torchOn = false;
    ctx.state.player.x = 900 - 129;
    expect(canSee(ctx.state)).toBe(true);
    ctx.state.player.hidden = true;
    ctx.state.torchOn = true;
    expect(canSee(ctx.state)).toBe(false);
  });

  it('never through a wall: another room is never seen', () => {
    const ctx = setup();
    place(ctx, 'HALL', 420, 420);
    ctx.state.player.room = 'KITCHEN';
    ctx.state.torchOn = true;
    expect(canSee(ctx.state)).toBe(false);
  });

  it('seeing the player from PATROL starts a CHASE at x1.3', () => {
    const ctx = setup();
    place(ctx, 'HALL', 800, 400);
    ctx.state.torchOn = true;
    ctx.vikram.tick(ctx.state, DT);
    expect(ctx.state.vikram.state).toBe('CHASE');
    expect(ctx.log.map(([n]) => n)).toContain('vikram:spotted');
    expect(vikramSpeed(ctx.state)).toBeCloseTo(V.acts[2].speed * V.chaseMult, 6);
  });
});

describe('chase to catch', () => {
  it('a chase that reaches the player within 45 px ends with CAUGHT', () => {
    const ctx = setup();
    place(ctx, 'HALL', 800, 500);
    ctx.state.torchOn = true;
    run(ctx, 10);
    expect(ctx.state.vikram.state).toBe('CAUGHT');
    expect(ctx.state.flags.endingId).toBe('CAUGHT');
    expect(ctx.log).toContainEqual(['ending:trigger', { id: 'CAUGHT', cause: 'caught' }]);
  });

  it('noise 100 with him within 200 px and the player not hidden is CAUGHT', () => {
    const ctx = setup();
    place(ctx, 'LIVING', 450, 640);              // 190 px, torch off: not seen
    ctx.state.noise = 100;
    ctx.vikram.tick(ctx.state, DT);
    expect(ctx.state.vikram.state).toBe('CAUGHT');
  });

  it('god mode prevents the catch', () => {
    const ctx = setup();
    ctx.state.debug.godMode = true;
    place(ctx, 'HALL', 800, 780);
    run(ctx, 2);
    expect(ctx.state.vikram.state).not.toBe('CAUGHT');
  });
});

describe('door breaks line of sight', () => {
  it('player leaves the room: he follows through the door, then investigates', () => {
    const ctx = setup();
    place(ctx, 'HALL', 700, 450, 'CHASE');
    ctx.state.vikram.phase = 'run';
    ctx.state.player.room = 'KITCHEN';          // player just went through D_KITCHEN
    ctx.state.player.x = 70;
    ctx.state.player.hidden = false;
    // Player runs off out of reach in the kitchen.
    ctx.state.player.x = 760;
    run(ctx, 6);
    const v = ctx.state.vikram;
    expect(v.room).toBe('KITCHEN');
    expect(['INVESTIGATE', 'SEARCH']).toContain(v.state);
    expect(v.target).toEqual({ room: 'KITCHEN', x: 70 });
  });
});

describe('hiding', () => {
  it('HIDE needs a spot within 80 px, forces the torch off and blocks walking', () => {
    const ctx = setup();
    ctx.state.player.room = 'BEDROOM';
    ctx.state.player.x = 300;
    expect(ctx.hide.hide(ctx.state)).toBe(false);
    ctx.state.player.x = 760;
    ctx.state.torchOn = true;
    expect(ctx.hide.hide(ctx.state)).toBe(true);
    expect(ctx.state.player).toMatchObject({ hidden: true, hideSpotId: 'BEDROOM_WARDROBE' });
    expect(ctx.state.torchOn).toBe(false);
    expect(ctx.state.stats.hides).toBe(1);
  });

  it('seenHiding when he is in the room and closer than 260 px', () => {
    const ctx = setup();
    place(ctx, 'BEDROOM', 600, 780);
    ctx.hide.hide(ctx.state);
    expect(ctx.state.vikram.seenHiding).toBe(true);
    const far = setup();
    place(far, 'BEDROOM', 300, 780);
    far.hide.hide(far.state);
    expect(far.state.vikram.seenHiding).toBe(false);
  });

  it('hiding while seen during a chase: he goes straight to the spot and finds you', () => {
    const ctx = setup();
    place(ctx, 'BEDROOM', 620, 780, 'CHASE');
    ctx.state.vikram.phase = 'run';
    ctx.hide.hide(ctx.state);
    run(ctx, 5);
    expect(ctx.state.vikram.state).toBe('CAUGHT');
  });

  it('hiding unseen during a chase: he investigates the last place he saw you', () => {
    const ctx = setup();
    place(ctx, 'BEDROOM', 400, 780, 'CHASE');
    ctx.state.vikram.phase = 'run';
    ctx.state.vikram.lastSeen = { room: 'BEDROOM', x: 700 };
    ctx.hide.hide(ctx.state);
    ctx.vikram.tick(ctx.state, DT);
    expect(ctx.state.vikram.state).toBe('INVESTIGATE');
    expect(ctx.state.vikram.target).toEqual({ room: 'BEDROOM', x: 700 });
  });

  function searchWardrobe(noiseLevel, seen) {
    const ctx = setup();
    place(ctx, 'BEDROOM', 760, 790);
    ctx.state.player.x = 790;
    ctx.hide.hide(ctx.state);
    ctx.state.vikram.seenHiding = seen;
    ctx.vikram.force(ctx.state, 'SEARCH');
    // Keep noise pinned during the check.
    for (let t = 0; t < 20 && ctx.state.vikram.state === 'SEARCH'; t += DT) {
      ctx.state.noise = noiseLevel;
      ctx.vikram.tick(ctx.state, DT);
    }
    return ctx.state.vikram.state;
  }

  it('a checked hide spot is found when noise >= 40', () => {
    expect(searchWardrobe(40, false)).toBe('CAUGHT');
  });

  it('a checked hide spot is not found when quiet and unseen', () => {
    expect(searchWardrobe(39, false)).toBe('PATROL');
  });

  it('a checked hide spot is always found if he saw you hide', () => {
    expect(searchWardrobe(0, true)).toBe('CAUGHT');
  });

  it('unhiding in his sight starts a chase', () => {
    const ctx = setup();
    place(ctx, 'BEDROOM', 700, 790);
    ctx.hide.hide(ctx.state);
    ctx.state.vikram.seenHiding = false;
    ctx.vikram.tick(ctx.state, DT);
    expect(ctx.state.vikram.state).toBe('PATROL');
    ctx.hide.unhide(ctx.state);
    ctx.vikram.tick(ctx.state, DT);
    expect(ctx.state.vikram.state).toBe('CHASE');
  });
});

describe("Nani's lamp warning", () => {
  function approaching(ctx, presence = 0) {
    // He is in the Hall at 600 walking into the Kitchen (door at 420).
    Object.assign(ctx.state.vikram, { state: 'PATROL', room: 'HALL', x: 600, phase: 'walk',
      path: [{ walk: 420 }, { door: 'KITCHEN', toX: 70 }, { walk: 420 }] });
    ctx.state.player.room = 'KITCHEN';
    ctx.state.player.x = 700;
    ctx.state.presence = presence;
  }

  it('flickers once, 2.5 s before he enters the room', () => {
    const ctx = setup();
    approaching(ctx);
    const warn = createNaniWarning(ctx.bus);
    let firedAt = null;
    for (let t = 0; t < 4 && ctx.state.vikram.room === 'HALL'; t += DT) {
      warn.tick(ctx.state);
      if (firedAt === null && ctx.log.some(([n]) => n === 'nani:warn')) {
        firedAt = secondsUntilEnters(ctx.state, 'KITCHEN');
      }
      ctx.vikram.tick(ctx.state, DT);
    }
    expect(firedAt).toBeLessThanOrEqual(BALANCE.nani.warnLeadSec);
    expect(firedAt).toBeGreaterThan(BALANCE.nani.warnLeadSec - 0.1);
    expect(ctx.log.filter(([n]) => n === 'nani:warn')).toHaveLength(1);
  });

  it('Assist gives a 4 s lead', () => {
    const ctx = setup();
    approaching(ctx);
    ctx.state.settings.assist = true;
    ctx.state.vikram.x = 420 + 2.5 * vikramSpeed(ctx.state);   // ETA 3.5 s
    createNaniWarning(ctx.bus).tick(ctx.state);
    expect(ctx.log.map(([n]) => n)).toContain('nani:warn');
  });

  it('stops working at Presence 60', () => {
    const ctx = setup();
    approaching(ctx, 60);
    ctx.state.vikram.x = 430;
    createNaniWarning(ctx.bus).tick(ctx.state);
    expect(ctx.log.map(([n]) => n)).not.toContain('nani:warn');
  });
});
