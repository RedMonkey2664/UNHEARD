// VM5 note reader: the note in large handwriting under a glasses-lens circle.
// JUMP SCARE 1 hooks in here in Stage 4.

import { COLORS, FONTS } from '../config/constants.js';
import { TEXTS } from '../data/texts.js';
import { Modal, MODAL } from './Modal.js';

export class NoteReader extends Modal {
  constructor(scene, { onRead, onClose }) {
    super(scene, 'A folded note', onClose);
    const paper = scene.add.rectangle(MODAL.x, MODAL.y + 6, MODAL.w - 60, 190, 0xEDE3CC, 1);
    this.lens = scene.add.circle(MODAL.x + 120, MODAL.y + 6, 80).setStrokeStyle(3, COLORS.line, 0.8);
    this.root.add([paper, this.lens]);
    this.text(MODAL.x, MODAL.y + 6, TEXTS.note.join('\n'),
      { font: FONTS.notes, size: 24, color: '#2A2420', wrap: MODAL.w - 90 });
    this.button(MODAL.x, MODAL.y + 134, 'Done reading', onRead, 180);
    this.lensTween = scene.tweens.add({ targets: this.lens, x: MODAL.x - 120, duration: 2400,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // JUMP SCARE 1: the lens reflects a silhouette behind you. Reduce flash:
  // a darker silhouette and no flash frame.
  scare(reduceFlash, sec) {
    const s = this.scene;
    this.lensTween.pause();
    const fig = s.add.rectangle(this.lens.x, this.lens.y + 10, 30, 110, 0x000000, reduceFlash ? 0.95 : 0.8);
    const head = s.add.circle(this.lens.x, this.lens.y - 55, 14, 0x000000, reduceFlash ? 0.95 : 0.8);
    this.root.add([fig, head]);
    if (!reduceFlash) {
      const flash = s.add.rectangle(MODAL.x, MODAL.y, MODAL.w, MODAL.h, 0xffffff, 0.8);
      this.root.add(flash);
      s.tweens.add({ targets: flash, alpha: 0, duration: 120 });
    }
    s.time.delayedCall(sec * 1000, () => { fig.destroy(); head.destroy(); });
  }
}
