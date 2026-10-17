// The world: rooms, player, Vikram. Stage 0: empty.

import Phaser from 'phaser';
import { COLORS, CSS } from '../config/constants.js';
import { textStyle } from '../ui/text.js';

export class RoomScene extends Phaser.Scene {
  constructor() {
    super('Room');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.void);
    this.state = this.registry.get('state');

    if (import.meta.env.DEV) {
      this.add.text(480, 270, 'RoomScene (empty until Stage 1)',
        textStyle({ size: 16, color: CSS.dim })).setOrigin(0.5);
    }
  }
}
