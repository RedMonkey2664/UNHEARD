// VM2 card: tap a scrap in the tray, then a slot. The third placement
// validates automatically; a wrong order returns the scraps to the tray.

import { COLORS, CSS } from '../config/constants.js';
import { CARD_PIECES } from '../data/items.js';
import { Button } from './Button.js';
import { Modal, MODAL } from './Modal.js';

const SLOT_W = 130;

// The quoted word inside each scrap's name, e.g. "Card scrap: 'Happy'".
function scrapWord(id) {
  const m = CARD_PIECES[id].name.match(/'(.*)'/);
  return m ? m[1] : id;
}

export class CardAssembler extends Modal {
  constructor(scene, { order, onConfirm, onClose }) {
    super(scene, 'Birthday card', onClose);
    this.onConfirm = onConfirm;
    this.initial = order;           // shuffled tray order, never already solved
    this.slotsY = MODAL.y - 30;
    this.trayY = MODAL.y + 90;

    this.slots = [0, 1, 2].map((i) => {
      const x = MODAL.x + (i - 1) * (SLOT_W + 14);
      const r = scene.add.rectangle(x, this.slotsY, SLOT_W, 70, 0x000000, 0.3)
        .setStrokeStyle(1, COLORS.line).setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => this.place(i));
      this.root.add(r);
      return { x, id: null };
    });
    this.text(MODAL.x, this.trayY - 52, 'Tap a scrap, then a slot.', { size: 16, color: CSS.dim });
    this.reset();
  }

  reset() {
    if (this.scraps) this.scraps.forEach((s) => { s.btn.bg.destroy(); s.btn.label.destroy(); });
    this.slots.forEach((s) => { s.id = null; });
    this.selected = null;
    this.scraps = this.initial.map((id, i) => {
      const x = MODAL.x + (i - 1) * (SLOT_W + 14);
      const btn = new Button(this.scene, x, this.trayY, scrapWord(id), () => this.select(id),
        { width: SLOT_W, height: 52, size: 20 }).addTo(this.root);
      return { id, btn, homeX: x };
    });
  }

  select(id) {
    const scrap = this.scraps.find((s) => s.id === id);
    if (this.slots.some((s) => s.id === id)) return;
    this.selected = id;
    this.scraps.forEach((s) => s.btn.setSelected(s === scrap));
  }

  place(i) {
    if (!this.selected || this.slots[i].id) return;
    const scrap = this.scraps.find((s) => s.id === this.selected);
    this.slots[i].id = this.selected;
    scrap.btn.bg.setPosition(this.slots[i].x, this.slotsY);
    scrap.btn.label.setPosition(this.slots[i].x, this.slotsY);
    scrap.btn.setSelected(false);
    this.selected = null;
    if (this.slots.every((s) => s.id)) {
      const ok = this.onConfirm(this.slots.map((s) => s.id));
      if (!ok) this.reset();
    }
  }
}
