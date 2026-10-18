// Base for the small puzzle modals over the room (docs/07 section 4).
// The panel swallows taps on itself only, so the room stays playable.

import { COLORS, CSS } from '../config/constants.js';
import { Button } from './Button.js';
import { textStyle } from './text.js';

export const MODAL = { x: 480, y: 240, w: 480, h: 330 };

export class Modal {
  constructor(scene, title, onClose) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(30);
    // Rounded panel with a hairline rim; an invisible rectangle takes the taps.
    const skin = scene.add.graphics();
    const l = MODAL.x - MODAL.w / 2;
    const t0 = MODAL.y - MODAL.h / 2;
    skin.fillStyle(COLORS.void, 0.45).fillRoundedRect(l + 4, t0 + 8, MODAL.w, MODAL.h, 18);
    skin.fillStyle(COLORS.panel, 0.97).fillRoundedRect(l, t0, MODAL.w, MODAL.h, 18);
    skin.fillStyle(COLORS.glassHi, 0.03).fillRoundedRect(l + 2, t0 + 2, MODAL.w - 4, 50, { tl: 16, tr: 16, bl: 0, br: 0 });
    skin.lineStyle(1, COLORS.line, 1).strokeRoundedRect(l + 0.5, t0 + 0.5, MODAL.w - 1, MODAL.h - 1, 18);
    const panel = scene.add.rectangle(MODAL.x, MODAL.y, MODAL.w, MODAL.h, COLORS.panel, 0.001).setInteractive();
    this.root.add(skin);
    const t = scene.add.text(MODAL.x - MODAL.w / 2 + 20, MODAL.y - MODAL.h / 2 + 26, title,
      textStyle({ size: 20, color: CSS.cream, align: 'left' })).setOrigin(0, 0.5);
    this.root.add([panel, t]);
    this.panel = panel;
    this.button(MODAL.x + MODAL.w / 2 - 60, MODAL.y - MODAL.h / 2 + 26, 'Close', onClose, 92);
    // Enter: a short fade and lift. Modals stay centred, no scale from a point.
    this.root.setAlpha(0).setY(6);
    scene.tweens.add({ targets: this.root, alpha: 1, y: 0, duration: 180, ease: 'Quart.easeOut' });
  }

  button(x, y, label, fn, width = 120, size = 18) {
    return new Button(this.scene, x, y, label, fn, { width, height: 44, size }).addTo(this.root);
  }

  text(x, y, str, opts = {}) {
    const t = this.scene.add.text(x, y, str, textStyle(opts)).setOrigin(0.5);
    this.root.add(t);
    return t;
  }

  // Wrong answer feedback: a short shake, skipped with Reduce flash.
  shake(reduceFlash) {
    if (reduceFlash) return;
    this.scene.tweens.add({ targets: this.root, x: 6, duration: 40, yoyo: true, repeat: 2,
      onComplete: () => this.root.setX(0) });
  }

  destroy() {
    this.root.destroy(true);
  }
}
