// Full-screen darkness with the torch circle erased (docs/02 section 8).
// Two code paths behind one interface: RenderTexture erase with a soft
// gradient, or (if that fails on a device) a hard-edged inverted geometry mask.

import { BALANCE } from '../config/balance.js';
import { COLORS } from '../config/constants.js';

const T = BALANCE.torch;
const W = BALANCE.world.width;
const H = BALANCE.world.height;
const MASK_SIZE = 512;  // light_mask texture size (BootScene)

export class DarknessLayer {
  constructor(scene, depth) {
    this.radiusJitter = 0;  // FlickerController sets these
    this.blackout = false;
    try {
      this.rt = scene.add.renderTexture(0, 0, W, H).setOrigin(0, 0).setDepth(depth);
      this.light = scene.make.image({ key: 'light_mask', add: false });
    } catch {
      this.rt = null;
    }
    if (!this.rt) {
      this.rect = scene.add.rectangle(W / 2, H / 2, W, H, COLORS.void, T.darknessAlpha)
        .setDepth(depth);
      this.shape = scene.make.graphics({ add: false });
      const mask = this.shape.createGeometryMask();
      mask.setInvertAlpha(true);
      this.rect.setMask(mask);
    }
  }

  // x, y: light centre. torchOn picks the full torch or the dim glow.
  draw(x, y, torchOn) {
    const lit = this.blackout ? 0 : (torchOn ? T.radius : T.dimGlowRadius) + this.radiusJitter;
    const radius = Math.max(0, lit);
    const alpha = torchOn ? 1 : T.dimGlowAlpha;

    if (this.rt) {
      this.rt.clear();
      this.rt.fill(COLORS.void, this.blackout ? 1 : T.darknessAlpha);
      if (radius === 0) return;
      this.light.setPosition(x, y).setScale((radius * 2) / MASK_SIZE).setAlpha(alpha);
      this.rt.erase(this.light);
      return;
    }
    // A hard mask cannot be partial, so the dim glow is just a smaller hole.
    this.shape.clear();
    this.shape.fillStyle(0xffffff, 1);
    this.shape.fillCircle(x, y, torchOn ? radius : radius * alpha);
  }

  setVisible(v) {
    (this.rt || this.rect).setVisible(v);
  }
}
