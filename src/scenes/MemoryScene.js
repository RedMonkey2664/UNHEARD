// 20-second flashback after a voicemail (docs/07 section 11). The room's
// simulation is frozen while this runs (RoomScene skips its systems).

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { COLORS, CSS, FONTS } from '../config/constants.js';
import { TEXTS } from '../data/texts.js';
import { VOICEMAILS } from '../data/voicemails.js';
import { Button } from '../ui/Button.js';
import { textStyle } from '../ui/text.js';

const M = BALANCE.memory;
const BG = 0x120C08;

export class MemoryScene extends Phaser.Scene {
  constructor() {
    super('Memory');
  }

  init(data) {
    this.vmId = data.vmId;
    this.finished = false;
  }

  create() {
    this.add.rectangle(480, 270, 960, 540, BG);
    // Soft lamp-coloured vignette.
    this.add.image(480, 270, 'light_mask').setTint(COLORS.lamp).setAlpha(0.12).setScale(2.2);
    if (this.textures.exists('mem_' + this.vmId)) {
      this.add.image(480, 270, 'mem_' + this.vmId).setAlpha(0.3).setDisplaySize(960, 540);
    }
    this.line = this.add.text(480, 260, '', textStyle({ font: FONTS.memory, style: 'italic',
      size: 28, color: CSS.cream, wrap: 640 })).setOrigin(0.5).setAlpha(0);

    const beats = VOICEMAILS[this.vmId].memory;
    beats.forEach((text, i) => {
      this.time.delayedCall(i * M.beatHoldMs, () => this.showBeat(text));
    });
    this.time.delayedCall(beats.length * M.beatHoldMs, () => this.finish(false));
    this.time.delayedCall(M.skipAppearsAfterMs, () => this.showSkip());
    this.cameras.main.fadeIn(M.fadeMs, 0, 0, 0);
  }

  showBeat(text) {
    this.tweens.killTweensOf(this.line);
    this.line.setText(text).setAlpha(0);
    const hold = M.beatHoldMs - M.fadeMs * 2;
    this.tweens.add({ targets: this.line, alpha: 1, duration: M.fadeMs });
    this.tweens.add({ targets: this.line, alpha: 0, delay: M.fadeMs + hold, duration: M.fadeMs });
  }

  // Small, grey and delayed so it is not pressed by accident. The warning
  // shows on the first appearance in a session only.
  showSkip() {
    if (this.finished) return;
    const btn = new Button(this, 880, 500, 'SKIP', () => this.finish(true),
      { width: 96, height: 44, size: 16 });
    btn.label.setColor(CSS.dim);
    if (!this.registry.get('skipWarned')) {
      this.registry.set('skipWarned', true);
      this.add.text(880, 530, TEXTS.ui.skipWarning, textStyle({ size: 16, color: CSS.dim }))
        .setOrigin(0.5);
    }
  }

  finish(skipped) {
    if (this.finished) return;
    this.finished = true;
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.children.removeAll(true);
    this.add.rectangle(480, 270, 960, 540, 0x000000);
    // A breath of silence, then back to the room.
    this.time.delayedCall(M.endPauseMs, () => {
      const systems = this.registry.get('systems');
      systems.flow.endMemory(this.registry.get('state'), this.vmId, skipped);
      this.scene.stop();
    });
  }
}
