import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/config/balance.js';
import { endingBeats, ENDINGS, EPILOGUE } from '../src/data/endings.js';
import { createEndingResolver, epilogueKey, physicalEvidenceCount, resolveEnding }
  from '../src/systems/endingResolver.js';
import { createFinalAct } from '../src/systems/finalAct.js';
import { createState } from '../src/systems/gameState.js';
import { createNoise } from '../src/systems/noise.js';
import { createPresence, createTemptation } from '../src/systems/presence.js';
import { applyPreset } from '../src/systems/presets.js';
import { connectRules } from '../src/systems/rules.js';
import { createVikramAI } from '../src/systems/vikramAI.js';
import { createRng } from '../src/utils/rng.js';
import { runFor, setupFlow } from './helpers.js';

const F = BALANCE.final;
const DT = 0.05;

// Every system wired like RoomScene, with the per-frame resolver.
function setupAll() {
  const ctx = setupFlow();
  ctx.noise = createNoise(ctx.bus);
  ctx.vikram = createVikramAI(ctx.bus, { noise: ctx.noise, rng: createRng(5) });
  ctx.presence = createPresence(ctx.bus, { noise: ctx.noise, rng: createRng(6) });
  ctx.temptation = createTemptation(ctx.bus);
  ctx.finalAct = createFinalAct(ctx.bus, { puzzles: ctx.puzzles, battery: ctx.battery, vikram: ctx.vikram });
  ctx.endings = createEndingResolver(ctx.bus);
  connectRules(ctx.bus, ctx, () => ctx.state);
  // One frame in docs/02 section 6 order.
  ctx.frame = (dt = DT) => {
    const s = ctx.state;
    s.clock.runSeconds += dt;
    if (!ctx.finalAct.inCinematic(s)) {
      ctx.flow.tick(s, dt);
      ctx.vikram.tick(s, dt);
      ctx.noise.tick(s, dt);
      ctx.presence.tick(s, dt);
      ctx.battery.tick(s, dt);
    }
    ctx.finalAct.tick(s, dt);
    ctx.endings.flush(s);
  };
  ctx.endingOf = () => ctx.log.filter(([n]) => n === 'ending:trigger').map(([, p]) => p);
  return ctx;
}

// Act 5 with the player hidden in the Bedroom wardrobe, Vikram far away.
function act5(ctx, presence = 0) {
  applyPreset(ctx.state, 5, ctx);
  const s = ctx.state;
  Object.assign(s.player, { room: 'BEDROOM', x: 790 });
  ctx.state.debug.godMode = true;           // he cannot catch us before the corner
  s.presence = presence;
  s.presenceState.armed = { flicker: presence < 30, naniHelp: presence < 45,
    whisper: presence < 60, manifest: presence < 90, doom: presence < 100 };
  s.noise = 0;
  s.torchOn = true;                          // no idle-dark accrual
  return s;
}

function connectCall(ctx) {
  const r = ctx.finalAct.call(ctx.state);
  expect(r.ok).toBe(true);
  for (let t = 0; t < F.callConnectSec + 0.2; t += DT) {
    ctx.state.noise = 0;
    ctx.frame();
  }
  expect(ctx.state.flags.callConnected).toBe(true);
}

function runToEnd(ctx, max = 120) {
  for (let t = 0; t < max && !ctx.state.flags.endingId; t += DT) ctx.frame();
}

describe('resolveEnding', () => {
  it('maps every cause', () => {
    const s = createState();
    expect(resolveEnding('temptation', s)).toBe('LATER');
    expect(resolveEnding('presence_doom', s)).toBe('LATER');
    expect(resolveEnding('caught', s)).toBe('CAUGHT');
    expect(resolveEnding('dead_air', s)).toBe('CAUGHT');
    expect(() => resolveEnding('nope', s)).toThrow();
  });

  it.each([[59, 'EAT_PROPERLY'], [60, 'STATIC'], [99, 'STATIC'], [100, 'STATIC']])(
    'police_arrived at Presence %i -> %s', (p, id) => {
      const s = createState();
      s.presence = p;
      expect(resolveEnding('police_arrived', s)).toBe(id);
    });

  it('uses niceEndingMaxPresence (59)', () => {
    expect(F.niceEndingMaxPresence).toBe(59);
  });
});

describe('test matrix (docs/06 section 9)', () => {
  it('1. PLAY #8 NOW at any time -> LATER', () => {
    const ctx = setupAll();
    ctx.flow.debugComplete(ctx.state, 4);
    ctx.temptation.press(ctx.state);
    ctx.frame();
    expect(ctx.endingOf()).toEqual([{ id: 'LATER', cause: 'temptation' }]);
  });

  it('2. Presence reaches 100 -> LATER', () => {
    const ctx = setupAll();
    ctx.presence.set(ctx.state, 100);
    ctx.frame();
    expect(ctx.endingOf()).toEqual([{ id: 'LATER', cause: 'presence_doom' }]);
  });

  it('3. Hollow manifests, player stays 5 s -> LATER', () => {
    const ctx = setupAll();
    ctx.state.torchOn = true;
    ctx.presence.set(ctx.state, 90);
    runFor(() => ctx.frame(), 5.2);
    expect(ctx.endingOf()).toEqual([{ id: 'LATER', cause: 'presence_doom' }]);
  });

  it('4. Hollow manifests, player leaves in time -> no ending, Presence 75', () => {
    const ctx = setupAll();
    ctx.state.torchOn = true;
    ctx.presence.set(ctx.state, 90);
    runFor(() => ctx.frame(), 3);
    ctx.state.player.room = 'KITCHEN';
    ctx.frame();
    expect(ctx.state.presence).toBe(75);
    runFor(() => ctx.frame(), 5);
    expect(ctx.endingOf()).toEqual([]);
  });

  it('5. Vikram catches the player (collision) -> CAUGHT', () => {
    const ctx = setupAll();
    ctx.flow.debugComplete(ctx.state, 2);
    Object.assign(ctx.state.vikram, { state: 'PATROL', room: 'HALL', x: 600, phase: 'walk', path: [{ walk: 100 }] });
    ctx.state.player.x = 560;
    runFor(() => ctx.frame(), 1);
    expect(ctx.endingOf()).toEqual([{ id: 'CAUGHT', cause: 'caught' }]);
  });

  it('6. Noise 100 with Vikram within 200 px, not hidden -> CAUGHT', () => {
    const ctx = setupAll();
    Object.assign(ctx.state.vikram, { state: 'SEARCH', room: 'HALL', x: 740, phase: 'look', stateTimer: 9 });
    ctx.state.flags.vikramEntered = true;
    ctx.state.noise = 100;
    ctx.frame();
    expect(ctx.endingOf()).toEqual([{ id: 'CAUGHT', cause: 'caught' }]);
  });

  it('7. Battery 0 and 25 s pass (call not connected) -> CAUGHT (dead_air)', () => {
    const ctx = setupAll();
    ctx.state.debug.godMode = true;
    ctx.battery.set(ctx.state, 0);
    runFor(() => ctx.frame(), 24.8);
    expect(ctx.endingOf()).toEqual([]);
    runFor(() => ctx.frame(), 0.4);
    expect(ctx.endingOf()).toEqual([{ id: 'CAUGHT', cause: 'dead_air' }]);
  });

  it('8. Battery 0 after the call connected -> no change', () => {
    const ctx = setupAll();
    const s = act5(ctx);
    connectCall(ctx);
    ctx.battery.set(s, 0);
    expect(s.flags.deadAirTimer).toBeNull();
    runFor(() => ctx.frame(), 30);
    expect(ctx.endingOf()).toEqual([]);
  });

  it('9. Full run, Presence 20 at ETA 0 -> EAT_PROPERLY', () => {
    const ctx = setupAll();
    act5(ctx, 20);
    connectCall(ctx);
    runToEnd(ctx);
    expect(ctx.endingOf()).toEqual([{ id: 'EAT_PROPERLY', cause: 'police_arrived' }]);
  });

  it('10. Full run, Presence 70 at ETA 0 -> STATIC', () => {
    const ctx = setupAll();
    act5(ctx, 70);
    ctx.state.presenceState.nextWhisperAt = 1e9;   // keep whisper noise out of it
    connectCall(ctx);
    runToEnd(ctx);
    expect(ctx.endingOf()).toEqual([{ id: 'STATIC', cause: 'police_arrived' }]);
  });

  it('11. Caught during the corner event -> not possible', () => {
    const ctx = setupAll();
    const s = act5(ctx);
    s.debug.godMode = false;
    connectCall(ctx);
    s.flags.policeEta = F.cornerAtEta + 0.01;
    ctx.frame();
    expect(s.flags.cornerActive).toBe(true);
    expect(s.player.locked).toBe(true);
    // Even an explicit catch is ignored while the corner runs.
    ctx.bus.emit('player:caught', { cause: 'caught' });
    s.noise = 100;
    runToEnd(ctx);
    expect(ctx.endingOf()).toEqual([{ id: 'EAT_PROPERLY', cause: 'police_arrived' }]);
    expect(s.vikram.state).toBe('CORNER');
  });

  it('12. LATER and CAUGHT in the same frame -> LATER', () => {
    const ctx = setupAll();
    ctx.flow.debugComplete(ctx.state, 4);
    ctx.bus.emit('player:caught', { cause: 'caught' });
    ctx.temptation.press(ctx.state);
    ctx.endings.flush(ctx.state);
    expect(ctx.endingOf()).toEqual([{ id: 'LATER', cause: 'temptation' }]);
  });

  it('13. Tape taken, battery 2.5, call never connected -> dead-air timer starts', () => {
    const ctx = setupAll();
    const s = act5(ctx);
    ctx.battery.set(s, 2.5);
    expect(ctx.finalAct.call(s).reason).toBe('callNeedsBattery');
    ctx.frame();
    expect(s.flags.deadAirTimer).toBeGreaterThan(BALANCE.battery.deadAirDoomSec - 0.1);
  });

  it('14. Epilogue by physical evidence 5, 3, 0', () => {
    const s = createState();
    s.inventory.evidence = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'];
    expect(physicalEvidenceCount(s)).toBe(5);
    expect(EPILOGUE[epilogueKey(s)]).toContain('within a week');
    s.inventory.evidence = ['E1', 'E4', 'E5', 'E3', 'E7', 'E8'];
    expect(epilogueKey(s)).toBe('3-4');
    s.inventory.evidence = ['E3', 'E7', 'E8'];
    expect(epilogueKey(s)).toBe('0-2');
  });

  it('no ending changes after ending:trigger', () => {
    const ctx = setupAll();
    ctx.flow.debugComplete(ctx.state, 4);
    ctx.temptation.press(ctx.state);
    ctx.frame();
    ctx.bus.emit('player:caught', { cause: 'caught' });
    ctx.presence.set(ctx.state, 50);
    ctx.frame();
    expect(ctx.endingOf()).toHaveLength(1);
    expect(ctx.state.presence).toBe(0);
  });
});

describe('final act rules', () => {
  it('the locker opens only after VM7 and with 0614; the tape moment locks for 8 s', () => {
    const ctx = setupAll();
    ctx.flow.debugComplete(ctx.state, 6);
    expect(ctx.finalAct.tryCode(ctx.state, '0614').ok).toBe(false);
    ctx.flow.debugComplete(ctx.state, 7);
    expect(ctx.finalAct.tryCode(ctx.state, '1234').reason).toBe('wrongCode');
    expect(ctx.finalAct.tryCode(ctx.state, '0614').ok).toBe(true);
    expect(ctx.state.inventory.evidence).toContain('E8');
    expect(ctx.state.player.locked).toBe(true);
    runFor(() => ctx.frame(), F.tapeMomentSec - 0.1);
    expect(ctx.state.act).toBe(4);
    runFor(() => ctx.frame(), 0.2);
    expect(ctx.state.act).toBe(5);
    expect(ctx.state.player.locked).toBe(false);
  });

  it('CALL needs noise < 40 and standing still; noise >= 60 drops it (+5 Presence, no battery)', () => {
    const ctx = setupAll();
    const s = act5(ctx);
    s.noise = 45;
    expect(ctx.finalAct.call(s).reason).toBe('callTooLoud');
    s.noise = 0;
    s.player.moving = true;
    expect(ctx.finalAct.call(s).reason).toBe('callTooLoud');
    s.player.moving = false;
    s.player.hidden = true;                    // calling from a hide spot: no torch drain
    s.torchOn = false;
    expect(ctx.finalAct.call(s).ok).toBe(true);
    const battery = s.battery;
    s.noise = 60;
    ctx.finalAct.tick(s, DT);
    expect(s.flags.callConnecting).toBe(false);
    expect(s.presence).toBe(5);
    expect(s.battery).toBe(battery);
    s.noise = 0;
    connectCall(ctx);
    expect(s.battery).toBeCloseTo(battery - BALANCE.battery.callCost, 6);
    expect(s.flags.policeEta).toBeCloseTo(F.policeEtaSec, 0);
  });

  it('the siren starts at ETA 20 and the corner at ETA 8', () => {
    const ctx = setupAll();
    const s = act5(ctx);
    connectCall(ctx);
    for (let t = 0; t < 80 && !ctx.log.some(([n]) => n === 'siren:start'); t += DT) ctx.frame();
    expect(s.flags.policeEta).toBeLessThanOrEqual(F.sirenAtEta);
    expect(s.flags.policeEta).toBeGreaterThan(F.sirenAtEta - 0.1);
    for (let t = 0; t < 80 && !s.flags.cornerActive; t += DT) ctx.frame();
    expect(s.flags.policeEta).toBeLessThanOrEqual(F.cornerAtEta);
    expect(s.vikram.state).toBe('CORNER');
  });

  it('HUNT: no AWAY, rooms in a shuffled order, every hide spot checked, hears at 40', () => {
    const ctx = setupAll();
    const s = act5(ctx);
    s.torchOn = false;
    s.player.hidden = true;                   // quiet and hidden in the wardrobe
    s.player.hideSpotId = 'BEDROOM_WARDROBE';
    s.vikram.seenHiding = false;
    const rooms = [];
    ctx.bus.on('vikram:state', ({ state }) => { if (state === 'SEARCH') rooms.push(s.vikram.room); });
    for (let t = 0; t < 2.5; t += DT) ctx.frame();   // re-entry
    for (let t = 0; t < 120; t += DT) {
      s.noise = 0;
      ctx.frame();
    }
    expect(rooms.length).toBeGreaterThanOrEqual(4);
    expect(s.vikram.state).not.toBe('AWAY');
    expect(new Set(rooms.slice(0, 4)).size).toBeGreaterThanOrEqual(3);
  });
});

describe('ending data', () => {
  it('has the four endings with the right numbers and variants', () => {
    expect(Object.keys(ENDINGS)).toEqual(['EAT_PROPERLY', 'STATIC', 'CAUGHT', 'LATER']);
    expect(ENDINGS.LATER.number).toBe(4);
    expect(endingBeats('CAUGHT', 'dead_air')[0].lines[1].hi).toBe('Beta? Andhera kyun hai yahan?');
    const later = endingBeats('LATER', 'temptation').reduce((t, b) => t + b.hold, 0);
    expect(later).toBe(45);
  });
});
