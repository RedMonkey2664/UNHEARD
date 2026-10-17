// Hiding (docs/03 section 7). Pure.

import { BALANCE } from '../config/balance.js';
import { ROOMS } from '../data/rooms.js';

const P = BALANCE.player;
const V = BALANCE.vikram;

// The nearest hide spot within hideRange in the player's room, or null.
export function nearestHideSpot(state) {
  const p = state.player;
  let best = null;
  for (const spot of ROOMS[p.room].hideSpots) {
    const d = Math.abs(spot.x - p.x);
    if (d <= P.hideRange && (!best || d < best.d)) best = { d, spot };
  }
  return best ? best.spot : null;
}

export function createHideSystem(bus, { battery }) {
  return {
    nearestHideSpot,

    hide(state) {
      const p = state.player;
      if (p.hidden || p.locked) return false;
      const spot = nearestHideSpot(state);
      if (!spot) return false;
      const v = state.vikram;
      p.hidden = true;
      p.hideSpotId = spot.id;
      p.moving = false;
      battery.setTorch(state, false);
      // Closer than seenHidingDist in the same room: he saw where you went.
      v.seenHiding = v.state !== 'AWAY' && v.room === p.room && Math.abs(v.x - p.x) < V.seenHidingDist;
      state.stats.hides++;
      bus.emit('player:hide', { spotId: spot.id, seen: v.seenHiding });
      return true;
    },

    // Coming out in his sight is handled by the AI's sight check next frame.
    unhide(state) {
      const p = state.player;
      if (!p.hidden) return false;
      p.hidden = false;
      p.hideSpotId = null;
      state.vikram.seenHiding = false;
      bus.emit('player:unhide', {});
      return true;
    }
  };
}
