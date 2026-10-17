// Bottom-centre subtitle line over a soft dark strip (docs/07 section 1).
// Speaker colour from docs/05 section 1. Max 2 lines.

import { SPEAKER_CSS, UI } from '../config/constants.js';
import { textStyle } from '../ui/text.js';

const X = 480;
const Y = 462;
const PAD = 10;

export class Subtitles {
  constructor(scene, depth) {
    this.scene = scene;
    this.strip = scene.add.rectangle(X, Y, 10, 10, 0x000000, 0.7).setDepth(depth).setVisible(false);
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
    this.strip.setSize(this.text.width + PAD * 2, this.text.height + PAD).setVisible(true);
    if (this.timer) this.timer.remove();
    this.timer = this.scene.time.delayedCall(sec * 1000, () => this.hide());
  }

  hide() {
    this.text.setVisible(false);
    this.strip.setVisible(false);
    this.timer = null;
  }
}
