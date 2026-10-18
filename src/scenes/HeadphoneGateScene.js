// "Tap to begin. Wear headphones." The tap is the user gesture that unlocks
// browser audio (docs/09 section 7: never remove this gate).

import Phaser from 'phaser';
import { COLORS, CSS } from '../config/constants.js';
import { TEXTS } from '../data/texts.js';
import { createState } from '../systems/gameState.js';
import { textStyle } from '../ui/text.js';
import { enterMobileFullscreen } from '../utils/device.js';

export class HeadphoneGateScene extends Phaser.Scene {
  constructor() {
    super('HeadphoneGate');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.void);
    const text = this.add.text(480, 270, TEXTS.title.gate,
      textStyle({ size: 24, color: CSS.cream })).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: text, alpha: 1, duration: 800 });

    this.started = false;
    // Ignore the tap that brought us here from the title's BEGIN button.
    this.time.delayedCall(250, () => {
      this.input.once('pointerdown', () => this.begin());
      this.input.keyboard?.once('keydown', () => this.begin());
    });
  }

  begin() {
    if (this.started) return;
    this.started = true;
    // The same tap goes fullscreen and locks landscape on phones.
    enterMobileFullscreen();
    this.unlockAudio();
    this.registry.set('state', createState(this.registry.get('settings')));
    this.scene.start('Room');
  }

  unlockAudio() {
    const sound = this.sound;
    try {
      if (sound.locked && sound.unlock) sound.unlock();
      if (sound.context && sound.context.state === 'suspended') {
        sound.context.resume().catch(() => {});
      }
    } catch {
      // Audio is optional; the game is playable in silence.
    }
  }
}
