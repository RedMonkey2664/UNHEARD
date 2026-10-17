// Player movement on the single floor line. Pure: the scene turns input into
// an intent ({ dir, targetX }) and this moves the player.

import { BALANCE } from '../config/balance.js';
import { clamp } from '../utils/math.js';

const P = BALANCE.player;
const W = BALANCE.world;

export function createMovement() {
  return {
    // dir: -1 / 0 / 1 from keys. targetX: walk-to point from a tap, or null.
    // Returns true when a targetX was reached this frame.
    move(state, dt, intent) {
      const p = state.player;
      if (p.locked || p.hidden) {
        p.moving = false;
        return false;
      }
      const speed = p.sneaking ? P.sneakSpeed : P.walkSpeed;
      const step = speed * dt;

      if (intent.dir) {
        p.x = clamp(p.x + intent.dir * step, W.walkMinX, W.walkMaxX);
        p.facing = intent.dir;
        p.moving = true;
        return false;
      }

      if (intent.targetX == null) {
        p.moving = false;
        return false;
      }

      const target = clamp(intent.targetX, W.walkMinX, W.walkMaxX);
      const dx = target - p.x;
      if (Math.abs(dx) <= step) {
        p.x = target;
        p.moving = false;
        return true;
      }
      p.facing = Math.sign(dx);
      p.x += p.facing * step;
      p.moving = true;
      return false;
    }
  };
}
