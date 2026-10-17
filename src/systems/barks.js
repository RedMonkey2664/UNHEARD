// Vikram's barks (docs/05 texts.barks): one line at a time, never within
// barkCooldown seconds of the last one, and only when the player could hear
// him. Lines in a set rotate in order, so there is no randomness. Pure.

import { BALANCE } from '../config/balance.js';
import { TEXTS } from '../data/texts.js';
import { proximity } from './noise.js';

const V = BALANCE.vikram;

// Which set a new state speaks from.
const STATE_SETS = { INVESTIGATE: 'investigate', SEARCH: 'search', CHASE: 'chase' };

export function createBarks(bus) {
  let cooldown = 0;
  const next = {};

  // 'away' is heard faintly through the front door; everything else needs
  // him in the player's room or one door away.
  function audible(state, set) {
    if (set === 'away') {
      const p = state.player;
      return p.room === 'HALL' && Math.abs(p.x - V.enterX) <= V.awayBarkRange;
    }
    return proximity(state) > 0;
  }

  function say(state, set) {
    if (cooldown > 0 || !audible(state, set)) return false;
    const lines = TEXTS.barks[set];
    const index = (next[set] || 0) % lines.length;
    next[set] = index + 1;
    cooldown = V.barkCooldown;
    bus.emit('vikram:bark', { set, index, text: lines[index] });
    return true;
  }

  return {
    say,

    tick(state, dt) {
      cooldown = Math.max(0, cooldown - dt);
      const v = state.vikram;
      if (v.state === 'AWAY' && state.flags.vikramEntered) say(state, 'away');
      // He talks while he stands and checks a room.
      if (v.state === 'PATROL' && v.phase === 'dwell') say(state, state.flags.tapeTaken ? 'hunt' : 'patrol');
    },

    onState(state, name) {
      if (STATE_SETS[name]) say(state, STATE_SETS[name]);
    },

    onEnterHall(state) {
      say(state, 'entering');
    }
  };
}
