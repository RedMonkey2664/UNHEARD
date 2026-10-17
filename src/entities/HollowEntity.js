// The Hollow (docs/04 section 6) as placeholder shapes: a tall thin dark
// shape at the edge of the light (Presence >= 60), and the manifestation in
// the torch light wearing a pale, slightly wrong face.

import { COLORS, CSS } from '../config/constants.js';
import { textStyle } from '../ui/text.js';

const W = 26;
const H = 210;

export class HollowEntity {
  constructor(scene, depth) {
    this.scene = scene;
    this.shape = scene.add.rectangle(0, 0, W, H, 0x000000, 0.92).setOrigin(0.5, 1)
      .setStrokeStyle(1, COLORS.cold, 0.35).setDepth(depth).setVisible(false);
    this.face = scene.add.ellipse(0, 0, 30, 38, 0xE6E0D2, 0.9).setDepth(depth).setVisible(false);
    this.letter = scene.add.text(0, 0, 'H', textStyle({ size: 16, color: CSS.cold }))
      .setOrigin(0.5).setDepth(depth).setVisible(false);
  }

  // A brief glimpse; the caller picks a new place each time.
  glimpse(x, floorY, sec) {
    const s = this.scene;
    s.tweens.killTweensOf(this.shape);
    this.shape.setPosition(x, floorY).setAlpha(0).setVisible(true);
    s.tweens.add({ targets: this.shape, alpha: 0.92, duration: 120, hold: sec * 1000 - 240,
      yoyo: true, onComplete: () => this.shape.setVisible(false) });
  }

  // Steps into the light. withFace is the full jump scare (first time only).
  manifest(x, floorY, withFace) {
    this.scene.tweens.killTweensOf(this.shape);
    this.shape.setPosition(x, floorY).setAlpha(0.95).setVisible(true);
    this.letter.setPosition(x, floorY - H / 2).setVisible(true);
    this.face.setPosition(x, floorY - H + 22).setVisible(withFace);
  }

  hide() {
    this.shape.setVisible(false);
    this.face.setVisible(false);
    this.letter.setVisible(false);
  }
}
