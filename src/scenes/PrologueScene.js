// Scripted opening (docs/05 section 7): prologue lines on black, fade into
// the Hall, Mom's first text auto-opened for 6 s, then hints, objective and
// control. The player is locked until it ends.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { CSS } from '../config/constants.js';
import { DEVICE } from '../utils/device.js';
import { TEXTS } from '../data/texts.js';
import { bus } from '../systems/eventBus.js';
import { textStyle } from '../ui/text.js';

const P = BALANCE.prologue;
const FADE_MS = 600;
const HALL_FADE_MS = 1000;

export class PrologueScene extends Phaser.Scene {
  constructor() {
    super('Prologue');
  }

  create() {
    const state = this.registry.get('state');
    const systems = this.registry.get('systems');
    state.player.locked = true;

    this.black = this.add.rectangle(480, 270, 960, 540, 0x000000);
    this.line = this.add.text(480, 270, '', textStyle({ size: 22, color: CSS.cream, wrap: 700 }))
      .setOrigin(0.5).setAlpha(0);

    const lines = TEXTS.prologue;
    lines.forEach((text, i) => this.time.delayedCall(i * P.lineSec * 1000, () => this.show(text)));
    const linesEnd = lines.length * P.lineSec * 1000;

    this.time.delayedCall(linesEnd, () => {
      this.tweens.add({ targets: [this.black, this.line], alpha: 0, duration: HALL_FADE_MS });
    });
    const momAt = linesEnd + HALL_FADE_MS + P.momTextAtSec * 1000;
    this.time.delayedCall(momAt, () => {
      systems.messages.send(state, 'mom1');
      bus.emit('ui:phone:show', { tab: 'MESSAGES', sec: P.momTextHoldSec });
    });
    const handOver = momAt + P.momTextHoldSec * 1000 + 500;
    this.time.delayedCall(handOver, () => {
      const hint = !this.registry.get('view3d') ? TEXTS.hints.start
        : (DEVICE.touch ? TEXTS.hints.start3d : TEXTS.hints.start3dKeys);
      bus.emit('ui:toast', { text: hint, sec: P.hintSec });
      bus.emit('ui:objective', {});
      state.flags.arrivalShown = true;
      state.player.locked = false;
    });
    this.time.delayedCall(handOver + P.hintSec * 1000, () => {
      bus.emit('ui:toast', { text: TEXTS.hints.phone, sec: P.hintSec });
      this.scene.stop();
    });
  }

  show(text) {
    this.tweens.killTweensOf(this.line);
    this.line.setText(text).setAlpha(0);
    this.tweens.add({ targets: this.line, alpha: 1, duration: FADE_MS });
    this.tweens.add({ targets: this.line, alpha: 0, delay: P.lineSec * 1000 - FADE_MS, duration: FADE_MS });
  }
}
