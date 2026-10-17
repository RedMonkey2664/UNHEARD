// VM1 radio dial: 88.0 to 108.0 in 0.1 steps, drag or step, CONFIRM.

import { BALANCE } from '../config/balance.js';
import { COLORS, CSS } from '../config/constants.js';
import { clamp, round1 } from '../utils/math.js';
import { Modal, MODAL } from './Modal.js';

const R = BALANCE.puzzles.radio;
const START = 100.0;
const BAR_W = 380;

export class RadioDial extends Modal {
  constructor(scene, { onConfirm, onClose }) {
    super(scene, 'Radio', onClose);
    this.value = START;
    this.readout = this.text(MODAL.x, MODAL.y - 70, '', { size: 44, color: CSS.cream });

    const y = MODAL.y + 4;
    this.barX = MODAL.x - BAR_W / 2;
    const bar = scene.add.rectangle(MODAL.x, y, BAR_W, 10, COLORS.line).setInteractive({ draggable: false });
    this.handle = scene.add.rectangle(0, y, 14, 36, COLORS.cream).setInteractive({ draggable: true });
    this.root.add([bar, this.handle]);
    const fromX = (x) => this.set(R.min + ((x - this.barX) / BAR_W) * (R.max - R.min));
    this.handle.on('drag', (_p, x) => fromX(x));
    bar.on('pointerdown', (p) => fromX(p.x));

    this.button(MODAL.x - 150, MODAL.y + 70, '-0.1', () => this.set(this.value - R.step), 90);
    this.button(MODAL.x + 150, MODAL.y + 70, '+0.1', () => this.set(this.value + R.step), 90);
    this.button(MODAL.x, MODAL.y + 120, 'CONFIRM', () => onConfirm(this.value), 160);
    this.set(START);
  }

  set(v) {
    this.value = round1(clamp(v, R.min, R.max));
    this.readout.setText(this.value.toFixed(1) + ' MHz');
    this.handle.setX(this.barX + ((this.value - R.min) / (R.max - R.min)) * BAR_W);
  }
}
