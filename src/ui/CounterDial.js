// VM4 cooker whistle counter: 0 to 9 with plus and minus, CONFIRM.

import { BALANCE } from '../config/balance.js';
import { CSS } from '../config/constants.js';
import { clamp } from '../utils/math.js';
import { Modal, MODAL } from './Modal.js';

const C = BALANCE.puzzles.cooker;

export class CounterDial extends Modal {
  constructor(scene, { onConfirm, onClose }) {
    super(scene, 'Whistle counter', onClose);
    this.value = C.min;
    this.readout = this.text(MODAL.x, MODAL.y - 20, '', { size: 72, color: CSS.cream });
    this.steam = this.text(MODAL.x, MODAL.y - 86, '~', { size: 28, color: CSS.dim });
    scene.tweens.add({ targets: this.steam, y: MODAL.y - 100, alpha: 0.2, duration: 900,
      yoyo: true, repeat: -1 });
    this.button(MODAL.x - 120, MODAL.y - 20, '-', () => this.set(this.value - 1), 64, 26);
    this.button(MODAL.x + 120, MODAL.y - 20, '+', () => this.set(this.value + 1), 64, 26);
    this.button(MODAL.x, MODAL.y + 100, 'CONFIRM', () => onConfirm(this.value), 160);
    this.set(C.min);
  }

  set(v) {
    this.value = clamp(v, C.min, C.max);
    this.readout.setText(String(this.value));
  }
}
