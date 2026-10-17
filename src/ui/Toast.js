// Small text above the subtitle line for 2.5 s (docs/07 section 1).

import { CSS, UI } from '../config/constants.js';
import { textStyle } from './text.js';

export class Toast {
  constructor(scene, depth) {
    this.scene = scene;
    this.text = scene.add.text(480, 412, '', textStyle({ size: 16, color: CSS.cream }))
      .setOrigin(0.5).setDepth(depth).setAlpha(0);
    this.tween = null;
  }

  show(message, sec = UI.toastSec) {
    if (this.tween) this.tween.stop();
    this.text.setText(message).setAlpha(1);
    this.tween = this.scene.tweens.add({
      targets: this.text, alpha: 0, delay: sec * 1000 - 300, duration: 300
    });
  }
}
