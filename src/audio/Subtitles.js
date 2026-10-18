// Bottom-centre subtitle line over a soft dark strip (docs/07 section 1).
// Speaker colour from docs/05 section 1. Max 2 lines.

import { COLORS, SPEAKER_CSS, UI } from '../config/constants.js';
import { textStyle } from '../ui/text.js';

const X = 480;
const Y = 462;
const PAD = 12;
const RADIUS = 10;

export class Subtitles {
  constructor(scene, depth) {
    this.scene = scene;
    // A soft rounded strip, 70 percent dark (docs/07 section 1).
    this.strip = scene.add.graphics().setDepth(depth).setVisible(false);
    this.text = scene.add.text(X, Y, '', textStyle({ wrap: UI.subtitleWrap }))
      .setOrigin(0.5).setDepth(depth).setVisible(false);
    this.timer = null;
  }

  show(who, line, sec, sizeKey = 'M') {
    const size = UI.subtitlePx[sizeKey] || UI.subtitlePx.M;
    this.text.setStyle(textStyle({ size, wrap: UI.subtitleWrap,
      color: SPEAKER_CSS[who] || SPEAKER_CSS.YOU,
      style: who === 'SFX' ? 'italic' : 'normal' }));
    this.text.setMaxLines(2).setText(line).setVisible(true);
    // The Hollow's lines jitter slightly (docs/05 section 1).
    this.scene.tweens.killTweensOf(this.text);
    this.text.setX(X);
    if (who === 'HOLLOW') {
      this.scene.tweens.add({ targets: this.text, x: X + 1.5, duration: 45, yoyo: true, repeat: -1 });
    }
    const w = this.text.width + PAD * 2;
    const h = this.text.height + PAD;
    this.strip.clear().fillStyle(COLORS.void, 0.7).fillRoundedRect(X - w / 2, Y - h / 2, w, h, RADIUS)
      .lineStyle(1, COLORS.line, 0.6).strokeRoundedRect(X - w / 2, Y - h / 2, w, h, RADIUS).setVisible(true);
    if (this.timer) this.timer.remove();
    this.timer = null;
    // sec null: stays until replaced or hidden (voicemail lines).
    if (sec != null) this.timer = this.scene.time.delayedCall(sec * 1000, () => this.hide());
  }

  hide() {
    if (this.timer) this.timer.remove();
    this.text.setVisible(false);
    this.strip.setVisible(false);
    this.timer = null;
  }
}
