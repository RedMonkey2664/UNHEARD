// Vikram's spatial footsteps (docs/07 section 8.5): volume and pan from his
// real position, so the cue never lies (fair-play rule 5). Pure; the HUD
// marker uses it now and AudioDirector uses it in Stage 6.

import { BALANCE } from '../config/balance.js';
import { ROOMS } from '../data/rooms.js';
import { clamp, lerp } from '../utils/math.js';
import { isAdjacent } from './noise.js';

const F = BALANCE.footsteps;
const ROOM_POS = { LIVING: -1, KITCHEN: 0, BEDROOM: 1 };

// The Hall door x that leads to a room.
function hallDoorX(room) {
  return ROOMS.HALL.doors.find((d) => d.to === room).x;
}

// Returns { volume, pan, muffled } or null when he is silent.
export function footstepMix(state, hasFilter = true) {
  const v = state.vikram;
  const p = state.player;
  if (!v.moving || v.state === 'AWAY' || !v.room) return null;
  if (v.room === p.room) {
    const d = Math.abs(v.x - p.x);
    return {
      volume: lerp(1.0, F.sameMin, clamp(d / F.sameFalloff, 0, 1)),
      pan: clamp((v.x - p.x) / F.panSpan, -F.panMax, F.panMax),
      muffled: false
    };
  }
  if (!isAdjacent(v.room, p.room)) return null;
  let pan;
  if (p.room === 'HALL') pan = (hallDoorX(v.room) - p.x) / F.panSpan;
  else if (v.room === 'HALL') pan = (v.x - hallDoorX(p.room)) / F.panSpan;
  else pan = (ROOM_POS[v.room] - ROOM_POS[p.room]) * F.adjacentPan;
  return {
    volume: hasFilter ? F.adjacentVolume : F.adjacentVolumeNoFilter,
    pan: clamp(pan, -F.panMax, F.panMax),
    muffled: true
  };
}
