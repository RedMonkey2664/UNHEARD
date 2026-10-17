// Shared test setup: a fresh state, bus, every system, and an event log.

import { createBattery } from '../src/systems/battery.js';
import { createEventBus } from '../src/systems/eventBus.js';
import { createFixPuzzles } from '../src/systems/fixPuzzles.js';
import { createState } from '../src/systems/gameState.js';
import { createMessages } from '../src/systems/messages.js';
import { createVoicemailFlow } from '../src/systems/voicemailFlow.js';

export function setupFlow(settings) {
  const bus = createEventBus();
  const log = [];
  const realEmit = bus.emit;
  bus.emit = (name, payload) => {
    log.push([name, payload]);
    realEmit(name, payload);
  };
  const battery = createBattery(bus);
  const puzzles = createFixPuzzles();
  const messages = createMessages(bus);
  const flow = createVoicemailFlow(bus, { battery, puzzles, messages });
  const state = createState(settings);
  const names = () => log.map(([n]) => n);
  return { bus, log, names, battery, puzzles, messages, flow, state };
}

export function runFor(fn, seconds, dt = 0.05) {
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) fn(dt);
}

// The input that fixes each VM, so tests can walk the chain.
export const SOLUTIONS = {
  1: 94.3,
  2: ['CARD_A', 'CARD_B', 'CARD_C'],
  3: ['KITCHEN', 'BEDROOM', 'LIVING'],
  4: 4,
  5: null,
  6: 'EARPHONES'
};
