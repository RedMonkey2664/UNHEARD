// Nani's lamp warning (docs/03 section 6): when Vikram's next step will bring
// him into the player's current room, the lamp flickers once, warnLeadSec
// before he arrives. Only while Presence is below the whisper threshold. Pure.

import { BALANCE } from '../config/balance.js';
import { vikramSpeed } from './vikramAI.js';

const V = BALANCE.vikram;

// Seconds until his queued path takes him through a door into `room`, or null.
export function secondsUntilEnters(state, room) {
  const v = state.vikram;
  if (v.state === 'ENTERING') return room === 'HALL' ? v.stateTimer : null;
  if (!v.room || v.room === room) return null;
  const speed = vikramSpeed(state);
  let x = v.x;
  let t = 0;
  for (let i = 0; i < v.path.length; i++) {
    const op = v.path[i];
    if (op.walk !== undefined) {
      t += Math.abs(op.walk - x) / speed;
      x = op.walk;
    } else {
      t += V.doorTime - (i === 0 ? v.doorTimer : 0);
      if (op.door === room) return t;
      x = op.toX;
    }
  }
  return null;
}

export function createNaniWarning(bus) {
  let latched = false;   // one flicker per approach

  return {
    tick(state) {
      const room = state.player.room;
      const eta = secondsUntilEnters(state, room);
      if (eta === null) {
        latched = false;
        return;
      }
      if (state.presence >= BALANCE.presence.thresholds.whisper) return;
      const lead = state.settings.assist ? BALANCE.nani.warnLeadSecAssist : BALANCE.nani.warnLeadSec;
      if (!latched && eta <= lead) {
        latched = true;
        bus.emit('nani:warn', { room });
      }
    }
  };
}
