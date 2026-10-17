// Nani's glimpses (docs/04 section 6), as placeholder shapes until art:
// a small warm figure (N) in a doorway or a window, and a steaming cup.
// Never scary; soft warm rim.

import { COLORS, CSS } from '../config/constants.js';
import { textStyle } from '../ui/text.js';

const FIG_W = 24;
const FIG_H = 110;

export class NaniGlimpse {
  constructor(scene, depth) {
    this.scene = scene;
    this.figure = scene.add.rectangle(0, 0, FIG_W, FIG_H, COLORS.cream, 0.35)
      .setOrigin(0.5, 1).setStrokeStyle(2, COLORS.lamp, 0.6).setDepth(depth).setVisible(false);
    this.letter = scene.add.text(0, 0, 'N', textStyle({ size: 16, color: CSS.void }))
      .setOrigin(0.5).setDepth(depth).setVisible(false);
    this.cup = scene.add.rectangle(0, 0, 26, 30, COLORS.lamp, 0.85).setOrigin(0.5, 1)
      .setDepth(depth).setVisible(false);
    this.steam = scene.add.text(0, 0, '~', textStyle({ size: 20, color: CSS.cream }))
      .setOrigin(0.5).setDepth(depth).setVisible(false);
    scene.tweens.add({ targets: this.steam, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
  }

  // A figure that fades in, holds, and fades out.
  showFigure(x, floorY, sec, alpha = 0.35) {
    const s = this.scene;
    s.tweens.killTweensOf([this.figure, this.letter]);
    this.figure.setPosition(x, floorY).setVisible(true).setAlpha(0);
    this.letter.setPosition(x, floorY - FIG_H / 2).setVisible(true).setAlpha(0);
    s.tweens.add({ targets: [this.figure, this.letter], alpha, duration: 600,
      hold: Math.max(0, sec * 1000 - 1200), yoyo: true,
      onComplete: () => { this.figure.setVisible(false); this.letter.setVisible(false); } });
  }

  showCup(x, floorY) {
    this.cup.setPosition(x, floorY).setVisible(true);
    this.steam.setPosition(x, floorY - 44).setVisible(true);
  }

  hideCup() {
    this.cup.setVisible(false);
    this.steam.setVisible(false);
  }
}
