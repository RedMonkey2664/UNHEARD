// VM6 item picker: tools in inventory, tap to choose, then CONFIRM.

import { CSS } from '../config/constants.js';
import { TEXTS } from '../data/texts.js';
import { TOOLS } from '../data/items.js';
import { Button } from './Button.js';
import { Modal, MODAL } from './Modal.js';

export class ItemPicker extends Modal {
  constructor(scene, { tools, onConfirm, onClose }) {
    super(scene, 'Use an item', onClose);
    this.choice = null;
    if (!tools.length) {
      this.text(MODAL.x, MODAL.y, TEXTS.toasts.noItem, { size: 20, color: CSS.dim });
      return;
    }
    this.buttons = tools.map((id, i) => {
      const x = MODAL.x + (i - (tools.length - 1) / 2) * 190;
      const b = new Button(scene, x, MODAL.y - 10, TOOLS[id].name, () => this.pick(id),
        { width: 170, height: 80, size: 18 }).addTo(this.root);
      // Item icon (64 x 64) above the name when the art exists.
      if (scene.textures.exists(TOOLS[id].icon)) {
        this.root.add(scene.add.image(x, MODAL.y - 90, TOOLS[id].icon).setDisplaySize(64, 64));
      }
      return { id, b };
    });
    this.confirm = this.button(MODAL.x, MODAL.y + 110, 'CONFIRM', () => {
      if (this.choice) onConfirm(this.choice);
    }, 160);
  }

  pick(id) {
    this.choice = id;
    this.buttons.forEach(({ id: bid, b }) => b.setSelected(bid === id));
  }
}
