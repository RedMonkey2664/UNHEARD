import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/config/balance.js';
import { createBattery } from '../src/systems/battery.js';
import { createEventBus } from '../src/systems/eventBus.js';
import { createState } from '../src/systems/gameState.js';

const B = BALANCE.battery;

function setup(settings) {
  const bus = createEventBus();
  const events = [];
  for (const name of ['battery:changed', 'battery:zero']) {
    bus.on(name, (p) => events.push([name, p]));
  }
  return { state: createState(settings), battery: createBattery(bus), events };
}

function run(fn, seconds, dt = 0.05) {
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) fn(dt);
}

describe('torch drain', () => {
  it('drains 0.08 per second with the torch on', () => {
    const { state, battery } = setup();
    battery.setTorch(state, true);
    run((dt) => battery.tick(state, dt), 10);
    expect(state.battery).toBeCloseTo(100 - B.torchDrainPerSec * 10, 6);
  });

  it('does not drain with the torch off or while hidden', () => {
    const { state, battery } = setup();
    run((dt) => battery.tick(state, dt), 10);
    expect(state.battery).toBe(100);
    state.torchOn = true;
    state.player.hidden = true;
    run((dt) => battery.tick(state, dt), 10);
    expect(state.battery).toBe(100);
  });

  it('is not reduced by Assist', () => {
    const { state, battery } = setup({ assist: true });
    battery.setTorch(state, true);
    run((dt) => battery.tick(state, dt), 10);
    expect(state.battery).toBeCloseTo(100 - B.torchDrainPerSec * 10, 6);
  });

  it('cannot turn the torch on while hidden or at 0', () => {
    const { state, battery } = setup();
    state.player.hidden = true;
    expect(battery.setTorch(state, true)).toBe(false);
    state.player.hidden = false;
    battery.set(state, 0);
    expect(battery.setTorch(state, true)).toBe(false);
  });
});

describe('playback drain', () => {
  function playFor(vmId, seconds, settings) {
    const ctx = setup(settings);
    ctx.state.phone.playing = true;
    ctx.state.phone.playingId = vmId;
    run((dt) => ctx.battery.tickPlayback(ctx.state, dt), seconds);
    return ctx;
  }

  it('spends the cost linearly over the duration', () => {
    const { state } = playFor(1, 7);          // VM1 is 14 s, cost 6
    expect(100 - state.battery).toBeCloseTo(3, 6);
  });

  it('VM5 totals 12, the others 6', () => {
    expect(100 - playFor(5, 20).state.battery).toBeCloseTo(B.playCostLong, 6);
    expect(100 - playFor(2, 12).state.battery).toBeCloseTo(B.playCost, 6);
  });

  it('pause stops the drain', () => {
    const { state, battery } = setup();
    state.phone.playing = true;
    state.phone.playingId = 1;
    state.phone.paused = true;
    run((dt) => battery.tickPlayback(state, dt), 5);
    expect(state.battery).toBe(100);
  });

  it('Assist multiplies playback cost by 0.8', () => {
    expect(100 - playFor(5, 20, { assist: true }).state.battery).toBeCloseTo(12 * 0.8, 6);
  });
});

describe('one-off costs', () => {
  it('wrong fix costs wrongFixCost; Assist multiplies it by costMult', () => {
    const a = setup();
    a.battery.spend(a.state, B.wrongFixCost);
    expect(a.state.battery).toBeCloseTo(100 - B.wrongFixCost, 6);
    const b = setup({ assist: true });
    b.battery.spend(b.state, B.wrongFixCost);
    expect(b.state.battery).toBeCloseTo(100 - B.wrongFixCost * BALANCE.assist.costMult, 6);
  });
});

describe('zero', () => {
  it('clamps at 0 and fires battery:zero once', () => {
    const { state, battery, events } = setup();
    battery.set(state, 0.1);
    state.torchOn = true;
    run((dt) => battery.tick(state, dt), 10);
    battery.spend(state, 4);
    expect(state.battery).toBe(0);
    expect(events.filter(([n]) => n === 'battery:zero')).toHaveLength(1);
    expect(state.torchOn).toBe(false);
  });

  it('starts the dead-air timer if the call is not connected', () => {
    const { state, battery } = setup();
    battery.spend(state, 200);
    expect(state.flags.deadAirTimer).toBe(B.deadAirDoomSec);
  });

  it('does not start the dead-air timer once the call is connected', () => {
    const { state, battery } = setup();
    state.flags.callConnected = true;
    battery.spend(state, 200);
    expect(state.flags.deadAirTimer).toBeNull();
  });
});

describe('battery:changed', () => {
  it('fires when the shown whole percent changes, not every frame', () => {
    const { state, battery, events } = setup();
    battery.setTorch(state, true);
    run((dt) => battery.tick(state, dt), 2.4 / B.torchDrainPerSec);   // 2.4 % drained
    const changed = events.filter(([n]) => n === 'battery:changed').map(([, p]) => Math.ceil(p.value));
    expect(changed).toEqual([100, 99, 98]);
  });
});
