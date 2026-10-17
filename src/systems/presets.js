// Debug "skip to act N" presets (docs/09 section 1). Applied to a fresh
// state right after the room is built. Pure (uses the systems it is given).

import { BALANCE } from '../config/balance.js';

const PRESETS = {
  1: { completed: 0, battery: 100 },
  2: { completed: 2, battery: 82, evidence: ['E1', 'E2'], tools: ['GLASSES', 'EARPHONES'], awayFor: 5 },
  3: { completed: 6, battery: 38, evidence: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'], tools: ['GLASSES', 'EARPHONES'] },
  4: { completed: 7, battery: 28, evidence: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'],
       tools: ['GLASSES', 'EARPHONES'] },
  5: { completed: 7, battery: 24, evidence: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'],
       tools: ['GLASSES', 'EARPHONES'], tape: true }
};

export function applyPreset(state, act, { flow, battery, messages, finalAct }) {
  const p = PRESETS[act];
  state.flags.arrivalShown = true;
  messages.send(state, 'mom1');
  flow.debugComplete(state, p.completed);
  for (const id of p.tools || []) if (!state.inventory.tools.includes(id)) state.inventory.tools.push(id);
  for (const id of p.evidence || []) if (!state.inventory.evidence.includes(id)) state.inventory.evidence.push(id);
  state.stats.evidenceCount = state.inventory.evidence.length;
  state.presence = 0;
  battery.set(state, p.battery);

  if (p.completed >= 2) {
    // He is outside, about to come back.
    const v = state.vikram;
    state.flags.vikramEntered = true;
    const away = p.awayFor ?? BALANCE.vikram.acts[Math.min(Math.max(act, 2), 4)].away;
    Object.assign(v, { state: 'AWAY', room: null, path: [], awayTimer: away });
  }
  if (p.tape && finalAct) finalAct.tryCode(state, BALANCE.puzzles.lockerCode);
  return state;
}
