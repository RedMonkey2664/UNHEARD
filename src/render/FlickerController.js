// Torch flicker and blackouts driven by Presence (docs/02 section 8):
// >= 30 the radius jitters at irregular intervals; >= 60 short total
// blackouts every 20-35 s. Cosmetic, so it keeps its own rng.

import { BALANCE } from '../config/balance.js';
import { createRng } from '../utils/rng.js';

const T = BALANCE.torch;
const TH = BALANCE.presence.thresholds;

export class FlickerController {
  constructor(darkness) {
    this.darkness = darkness;
    this.rng = createRng(0xf11c);
    this.nextJitter = 0;
    this.nextBlackout = null;
    this.blackoutLeft = 0;
  }

  update(state, dt) {
    const d = this.darkness;
    if (state.presence >= TH.flicker) {
      this.nextJitter -= dt;
      if (this.nextJitter <= 0) {
        this.nextJitter = this.rng.range(...T.flickerEvery);
        d.radiusJitter = this.rng.range(-T.flickerJitter, T.flickerJitter);
      }
    } else {
      d.radiusJitter = 0;
    }

    if (state.presence >= TH.whisper) {
      if (this.nextBlackout === null) this.nextBlackout = this.rng.range(...T.blackoutEvery);
      this.nextBlackout -= dt;
      if (this.nextBlackout <= 0) {
        this.nextBlackout = this.rng.range(...T.blackoutEvery);
        this.blackoutLeft = T.blackoutSec;
      }
    } else {
      this.nextBlackout = null;
    }
    this.blackoutLeft = Math.max(0, this.blackoutLeft - dt);
    d.blackout = this.blackoutLeft > 0;
  }
}
