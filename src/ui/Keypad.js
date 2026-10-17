// Locker keypad: 4 digits, clear, enter. Wrong code shakes and flashes red
// (neither with Reduce flash on).

import { COLORS, CSS } from '../config/constants.js';
import { Modal, MODAL } from './Modal.js';

const DIGITS = 4;

export class Keypad extends Modal {
  constructor(scene, { onEnter, onClose, reduceFlash }) {
    super(scene, 'Steel locker', onClose);
    this.code = '';
    this.reduceFlash = reduceFlash;
    this.onEnter = onEnter;
    this.display = this.text(MODAL.x - 130, MODAL.y - 40, '', { size: 40, color: CSS.cream });
    this.flash = scene.add.rectangle(MODAL.x, MODAL.y, MODAL.w, MODAL.h, COLORS.danger, 0);
    this.root.add(this.flash);

    // 3x4 pad on the right half; sized to keep 44 px targets.
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];
    keys.forEach((k, i) => {
      const x = MODAL.x + 50 + (i % 3) * 64;
      const y = MODAL.y - 90 + Math.floor(i / 3) * 56;
      this.button(x, y, k, () => this.press(k), 56, 20);
    });
    this.render();
  }

  press(k) {
    if (k === 'C') this.code = '';
    else if (k === 'OK') return this.enter();
    else if (this.code.length < DIGITS) this.code += k;
    this.render();
    return null;
  }

  enter() {
    if (this.code.length < DIGITS) return;
    const ok = this.onEnter(this.code);
    if (!ok) {
      this.code = '';
      this.render();
      this.shake(this.reduceFlash);
      if (!this.reduceFlash) {
        this.flash.setAlpha(0.35);
        this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: 300 });
      }
    }
  }

  render() {
    this.display.setText(this.code.padEnd(DIGITS, '_').split('').join(' '));
  }
}
