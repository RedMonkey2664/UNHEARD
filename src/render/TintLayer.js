// Warm-to-cold colour grade above the darkness (docs/02 section 8): warm
// lamp at Presence 0, cold teal at 100. Updated at most every 0.25 s.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { lerp } from '../utils/math.js';

const T = BALANCE.tint;

export class TintLayer {
  constructor(scene, depth) {
    this.rect = scene.add.rectangle(480, 270, 960, 540, T.warm, T.warmAlpha)
      .setDepth(depth).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.wait = 0;
  }

  update(presence, dt) {
    this.wait -= dt;
    if (this.wait > 0) return;
    this.wait = T.updateSec;
    const t = Math.min(1, presence / BALANCE.presence.max);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(T.warm), Phaser.Display.Color.ValueToColor(T.cold), 100, t * 100);
    this.rect.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), lerp(T.warmAlpha, T.coldAlpha, t));
  }

  setVisible(v) {
    this.rect.setVisible(v);
  }
}
