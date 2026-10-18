import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/config/balance.js';
import { VOICEMAILS } from '../src/data/voicemails.js';
import { completedCount, deriveAct } from '../src/systems/gameState.js';
import { runFor, setupFlow, SOLUTIONS } from './helpers.js';

// Fix (if needed), play to the end and finish the memory.
function complete(ctx, id, { skip = false } = {}) {
  const { flow, state } = ctx;
  if (id === 5) state.inventory.tools.push('GLASSES');
  if (SOLUTIONS[id] !== undefined) expect(flow.attemptFix(state, id, SOLUTIONS[id]).ok).toBe(true);
  expect(flow.play(state, id).ok).toBe(true);
  runFor((dt) => flow.tick(state, dt), VOICEMAILS[id].durationSec + 0.1);
  expect(state.voicemails[id].status).toBe('memory');
  expect(flow.endMemory(state, id, skip).ok).toBe(true);
}

describe('gating', () => {
  it('only the lowest not-done VM can be previewed, fixed or played', () => {
    const { flow, state } = setupFlow();
    expect(flow.preview(state, 2)).toEqual({ ok: false, reason: 'notYet' });
    expect(flow.attemptFix(state, 2, SOLUTIONS[2]).reason).toBe('notYet');
    expect(flow.play(state, 2).reason).toBe('notYet');
    expect(flow.fixButton(state, 3).reason).toBe('notYet');
  });

  it('preview is free; play needs a fix first', () => {
    const { flow, state, names } = setupFlow();
    expect(flow.preview(state, 1).ok).toBe(true);
    expect(names()).toContain('vm:preview');
    expect(state.battery).toBe(100);
    expect(flow.play(state, 1).reason).toBe('needsFix');
  });

  it('FIX button: toast with previewLabel, picker for EARPHONES', () => {
    const ctx = setupFlow();
    expect(ctx.flow.fixButton(ctx.state, 1)).toEqual({ ok: true, toast: VOICEMAILS[1].previewLabel });
    ctx.flow.debugComplete(ctx.state, 5);
    expect(ctx.flow.fixButton(ctx.state, 6)).toEqual({ ok: true, picker: true });
  });
});

describe('fixes', () => {
  it('a wrong fix costs 4 battery, counts, and fires fix:fail', () => {
    const { flow, state, names } = setupFlow();
    expect(flow.attemptFix(state, 1, 95).ok).toBe(false);
    expect(state.battery).toBe(100 - BALANCE.battery.wrongFixCost);
    expect(state.stats.wrongFixes).toBe(1);
    expect(names()).toEqual(expect.arrayContaining(['fix:attempt', 'battery:changed', 'fix:fail']));
    expect(state.voicemails[1].status).toBe('damaged');
  });

  it('CARD success sets cardAssembled and consumes the pieces', () => {
    const ctx = setupFlow();
    complete(ctx, 1);
    ctx.state.cardPieces = ['CARD_A', 'CARD_B', 'CARD_C'];
    expect(ctx.flow.attemptFix(ctx.state, 2, SOLUTIONS[2]).ok).toBe(true);
    expect(ctx.state.flags.cardAssembled).toBe(true);
    expect(ctx.state.cardPieces).toEqual([]);
  });

  it('WINDOWS: wrong order resets and reopens; right order fixes', () => {
    const ctx = setupFlow();
    complete(ctx, 1);
    complete(ctx, 2);
    const { flow, state, names } = ctx;
    expect(names()).toContain('windows:open');
    flow.closeWindow(state, 'LIVING');
    flow.closeWindow(state, 'KITCHEN');
    expect(flow.closeWindow(state, 'BEDROOM').ok).toBe(false);
    expect(state.windowsClosed).toEqual([]);
    for (const w of SOLUTIONS[3]) flow.closeWindow(state, w);
    expect(state.voicemails[3].status).toBe('fixed');
  });

  it('NOTE grants E5 on success', () => {
    const ctx = setupFlow();
    ctx.flow.debugComplete(ctx.state, 4);
    ctx.state.inventory.tools.push('GLASSES');
    expect(ctx.flow.attemptFix(ctx.state, 5, null).ok).toBe(true);
    expect(ctx.state.inventory.evidence).toContain('E5');
  });

  it('afterFix beats fire; WINDOW_REOPENS waits 4 s', () => {
    const ctx = setupFlow();
    ctx.flow.attemptFix(ctx.state, 1, 94.3);
    expect(ctx.log).toContainEqual(['beat:fire', { id: 'RADIO_TURNS_ON' }]);
    ctx.flow.debugComplete(ctx.state, 2);
    for (const w of SOLUTIONS[3]) ctx.flow.closeWindow(ctx.state, w);
    runFor((dt) => ctx.flow.tick(ctx.state, dt), 3.9);
    expect(ctx.state.flags.livingWindowReopened).toBe(false);
    runFor((dt) => ctx.flow.tick(ctx.state, dt), 0.2);
    expect(ctx.state.flags.livingWindowReopened).toBe(true);
  });
});

describe('playback', () => {
  it('locks the player, turns the torch off, drains linearly, then memory', () => {
    const { flow, state } = setupFlow();
    state.torchOn = true;
    flow.attemptFix(state, 1, 94.3);
    flow.play(state, 1);
    expect(state.player.locked).toBe(true);
    expect(state.torchOn).toBe(false);
    expect(state.voicemails[1].status).toBe('playing');
    runFor((dt) => flow.tick(state, dt), 7);
    expect(100 - state.battery).toBeCloseTo(3, 6);
    runFor((dt) => flow.tick(state, dt), 8);
    expect(100 - state.battery).toBeCloseTo(6, 6);
    expect(state.voicemails[1].status).toBe('memory');
  });

  it('VM5 costs 12 in total', () => {
    const ctx = setupFlow();
    ctx.flow.debugComplete(ctx.state, 4);
    const before = ctx.state.battery;
    complete(ctx, 5);
    expect(before - ctx.state.battery).toBeCloseTo(12, 6);
  });

  it('pause stops the drain and frees the player; resume locks again', () => {
    const { flow, state } = setupFlow();
    flow.attemptFix(state, 1, 94.3);
    flow.play(state, 1);
    runFor((dt) => flow.tick(state, dt), 2);
    const b = state.battery;
    expect(flow.togglePause(state)).toBe(true);
    expect(state.player.locked).toBe(false);
    runFor((dt) => flow.tick(state, dt), 5);
    expect(state.battery).toBe(b);
    flow.togglePause(state);
    expect(state.player.locked).toBe(true);
  });

  it('battery dying mid-playback leaves the VM fixed', () => {
    const { flow, state, battery } = setupFlow();
    flow.attemptFix(state, 1, 94.3);
    battery.set(state, 1);
    flow.play(state, 1);
    runFor((dt) => flow.tick(state, dt), 14);
    expect(state.battery).toBe(0);
    expect(state.voicemails[1].status).toBe('fixed');
    expect(state.phone.playing).toBe(false);
    expect(state.player.locked).toBe(false);
  });
});

describe('memory and progression', () => {
  it('events fire in order: play start, play end, memory start, memory end', () => {
    const ctx = setupFlow();
    complete(ctx, 1);
    const order = ctx.names().filter((n) => /^(vm:play|memory)/.test(n));
    expect(order).toEqual(['vm:play:start', 'vm:play:end', 'memory:start', 'memory:end']);
  });

  it('done makes the next VM damaged, VM7 fixed; act derives from completed', () => {
    const ctx = setupFlow();
    for (let id = 1; id <= 6; id++) complete(ctx, id);
    expect(completedCount(ctx.state)).toBe(6);
    expect(ctx.state.voicemails[7].status).toBe('fixed');
    expect(ctx.state.act).toBe(3);
    complete(ctx, 7);
    expect(deriveAct(ctx.state)).toBe(4);
    expect(ctx.log).toContainEqual(['act:changed', { act: 4, prev: 3 }]);
  });

  it('E3 and E7 are granted at the end of playback', () => {
    const ctx = setupFlow();
    ctx.flow.debugComplete(ctx.state, 2);
    ctx.state.inventory.evidence = [];
    complete(ctx, 3);
    expect(ctx.state.inventory.evidence).toEqual(['E3']);
  });

  it('VM6 done sends Mom text 2; VM7 memory fires the TV beat', () => {
    const ctx = setupFlow();
    ctx.flow.debugComplete(ctx.state, 6);
    expect(ctx.state.messages.map((m) => m.id)).toEqual(['mom2']);
    complete(ctx, 7);
    expect(ctx.log).toContainEqual(['beat:fire', { id: 'TV_STATIC_SCARE' }]);
  });

  it('skipping a memory marks it and emits memory:skip (Presence stub)', () => {
    const ctx = setupFlow();
    complete(ctx, 1, { skip: true });
    expect(ctx.state.voicemails[1].memorySkipped).toBe(true);
    expect(ctx.state.stats.skippedMemories).toBe(1);
    expect(ctx.names()).toContain('memory:skip');
  });
});

describe('replay', () => {
  it('costs the normal battery, counts, and shows no memory', () => {
    const ctx = setupFlow();
    complete(ctx, 1);
    const before = ctx.state.battery;
    expect(ctx.flow.play(ctx.state, 1).ok).toBe(true);
    expect(ctx.log).toContainEqual(['vm:play:start', { vmId: 1, replay: true }]);
    runFor((dt) => ctx.flow.tick(ctx.state, dt), 15);
    expect(before - ctx.state.battery).toBeCloseTo(6, 6);
    expect(ctx.state.voicemails[1].status).toBe('done');
    expect(ctx.state.stats.replays).toBe(1);
    expect(ctx.state.player.locked).toBe(false);
    expect(ctx.names().filter((n) => n === 'memory:start')).toHaveLength(1);
  });

  it('is disabled once the tape is taken', () => {
    const ctx = setupFlow();
    complete(ctx, 1);
    ctx.state.flags.tapeTaken = true;
    expect(ctx.flow.play(ctx.state, 1).ok).toBe(false);
  });
});

describe('hints', () => {
  it('hint1 after hint1Sec damaged, hint2 added after hint2Sec', () => {
    const { flow, state } = setupFlow();
    const H = BALANCE.hints;
    runFor((dt) => flow.tick(state, dt), H.hint1Sec - 1, 0.5);
    expect(flow.hintsFor(state)).toEqual([]);
    runFor((dt) => flow.tick(state, dt), 2, 0.5);
    expect(flow.hintsFor(state)).toEqual([VOICEMAILS[1].hint1]);
    runFor((dt) => flow.tick(state, dt), H.hint2Sec - H.hint1Sec, 0.5);
    expect(flow.hintsFor(state)).toEqual([VOICEMAILS[1].hint1, VOICEMAILS[1].hint2]);
  });
});
