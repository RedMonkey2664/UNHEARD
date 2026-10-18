// Small message above the subtitle line for 2.5 s (docs/07 section 1), on a
// soft pill so it reads over any part of the room.

import { COLORS, CSS, UI } from '../config/constants.js';
import { textStyle } from './text.js';

const X = 480;
const Y = 412;
const PAD_X = 14;
const H = 28;
const IN_MS = 160;
const OUT_MS = 300;

export class Toast {
  constructor(scene, depth) {
    this.scene = scene;
    this.pill = scene.add.graphics().setDepth(depth).setAlpha(0);
    this.text = scene.add.text(X, Y, '', textStyle({ size: 16, color: CSS.cream }))
      .setOrigin(0.5).setDepth(depth).setAlpha(0);
  }

  show(message, sec = UI.toastSec) {
    const targets = [this.text, this.pill];
    this.scene.tweens.killTweensOf(targets);
    this.text.setText(message).setY(Y + 4);
    const w = this.text.width + PAD_X * 2;
    this.pill.clear().fillStyle(COLORS.void, 0.72).fillRoundedRect(X - w / 2, Y - H / 2, w, H, H / 2)
      .lineStyle(1, COLORS.lamp, 0.35).strokeRoundedRect(X - w / 2, Y - H / 2, w, H, H / 2).setY(4);
    for (const t of targets) t.setAlpha(0);
    this.scene.tweens.add({ targets: this.text, alpha: 1, y: Y, duration: IN_MS, ease: 'Quart.easeOut' });
    this.scene.tweens.add({ targets: this.pill, alpha: 1, y: 0, duration: IN_MS, ease: 'Quart.easeOut' });
    this.scene.tweens.add({ targets, alpha: 0, delay: sec * 1000 - OUT_MS, duration: OUT_MS, ease: 'Sine.easeInOut' });
  }
}
