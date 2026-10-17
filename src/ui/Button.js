// Code-drawn button. Its hit area grows when the canvas is scaled down, so it
// is never smaller than UI.minTapPx CSS pixels (docs/02 section 2).

import { COLORS, CSS, UI } from '../config/constants.js';
import { textStyle } from './text.js';

export class Button {
  constructor(scene, x, y, label, onTap, opts = {}) {
    this.scene = scene;
    this.w = opts.width || 160;
    this.h = opts.height || UI.minTapPx;
    this.onTap = onTap;
    this.selected = false;
    this.enabled = true;

    this.bg = scene.add.rectangle(x, y, this.w, this.h, COLORS.panel, 0.9)
      .setStrokeStyle(1, COLORS.line);
    this.label = scene.add.text(x, y, label,
      textStyle({ size: opts.size || 18, color: CSS.text })).setOrigin(0.5);

    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerdown', () => {
      this.scene.tweens.add({ targets: [this.bg, this.label], scale: 0.96,
        duration: 60, yoyo: true });
      if (this.onTap) this.onTap(this);
    });
    this.bg.on('pointerover', () => this.refresh(true));
    this.bg.on('pointerout', () => this.refresh(false));

    this.fitHitArea = this.fitHitArea.bind(this);
    scene.scale.on('resize', this.fitHitArea);
    scene.events.once('shutdown', () => scene.scale.off('resize', this.fitHitArea));
    this.bg.once('destroy', () => scene.scale.off('resize', this.fitHitArea));
    this.fitHitArea();
    this.refresh(false);
  }

  // displayScale is logical px per CSS px; below 1.0 scale we pad the hit area.
  fitHitArea() {
    const ratio = this.scene.scale.displayScale.x || 1;
    const minLogical = UI.minTapPx * ratio;
    const padX = Math.max(0, (minLogical - this.w) / 2);
    const padY = Math.max(0, (minLogical - this.h) / 2);
    if (this.bg.input) {
      this.bg.input.hitArea.setTo(-padX, -padY, this.w + padX * 2, this.h + padY * 2);
    }
  }

  setText(text) {
    this.label.setText(text);
    return this;
  }

  // Disabled buttons still take taps (callers may explain why), but look dim.
  setEnabled(on) {
    this.enabled = on;
    this.label.setAlpha(on ? 1 : 0.4);
    this.bg.setAlpha(on ? 1 : 0.6);
    return this;
  }

  setSelected(on) {
    this.selected = on;
    this.refresh(false);
    return this;
  }

  refresh(hover) {
    const lit = this.selected || hover;
    this.bg.setStrokeStyle(lit ? 2 : 1, this.selected ? COLORS.cream : COLORS.line);
    this.label.setColor(this.selected ? CSS.cream : CSS.text);
  }

  setVisible(v) {
    this.bg.setVisible(v);
    this.label.setVisible(v);
    if (v) this.bg.setInteractive(); else this.bg.disableInteractive();
    return this;
  }

  addTo(container) {
    container.add([this.bg, this.label]);
    return this;
  }
}
