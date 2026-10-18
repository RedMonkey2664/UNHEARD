// Code-drawn button: a rounded glass skin (redrawn only when its state
// changes), an invisible rectangle as the hit area, and a label. The hit area
// grows when the canvas is scaled down, so it is never smaller than
// UI.minTapPx CSS pixels (docs/02 section 2).

import { COLORS, CSS, UI } from '../config/constants.js';
import { textStyle } from './text.js';

const RADIUS = 10;
const PRESS_SCALE = 0.97;
const PRESS_IN_MS = 80;
const PRESS_OUT_MS = 140;

export class Button {
  constructor(scene, x, y, label, onTap, opts = {}) {
    this.scene = scene;
    this.w = opts.width || 160;
    this.h = opts.height || UI.minTapPx;
    this.onTap = onTap;
    this.selected = false;
    this.enabled = true;
    this.hover = false;
    this.colors = { fill: COLORS.panel, stroke: COLORS.line, text: CSS.text };

    this.skin = scene.add.graphics({ x, y });
    this.bg = scene.add.rectangle(x, y, this.w, this.h, COLORS.panel, 0.001);
    this.label = scene.add.text(x, y, label,
      textStyle({ size: opts.size || 18, color: CSS.text })).setOrigin(0.5);

    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerdown', () => {
      // Press: a quick, small dip so the tap feels heard.
      const targets = [this.skin, this.label];
      scene.tweens.killTweensOf(targets);
      scene.tweens.add({ targets, scale: PRESS_SCALE, duration: PRESS_IN_MS, ease: 'Quart.easeOut',
        onComplete: () => scene.tweens.add({ targets, scale: 1, duration: PRESS_OUT_MS, ease: 'Quart.easeOut' }) });
      if (this.onTap) this.onTap(this);
    });
    this.bg.on('pointerover', () => { this.hover = true; this.refresh(); });
    this.bg.on('pointerout', () => { this.hover = false; this.refresh(); });

    this.fitHitArea = this.fitHitArea.bind(this);
    scene.scale.on('resize', this.fitHitArea);
    scene.events.once('shutdown', () => scene.scale.off('resize', this.fitHitArea));
    this.bg.once('destroy', () => scene.scale.off('resize', this.fitHitArea));
    this.fitHitArea();
    this.refresh();
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

  draw() {
    const g = this.skin;
    const { w, h } = this;
    const r = Math.min(RADIUS, h / 2);
    const lit = this.selected || this.hover;
    g.clear();
    g.fillStyle(this.colors.fill, 0.9).fillRoundedRect(-w / 2, -h / 2, w, h, r);
    // A faint top highlight gives the glass a surface.
    g.fillStyle(COLORS.glassHi, lit ? 0.07 : 0.04).fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h / 2 - 2,
      { tl: r - 2, tr: r - 2, bl: 0, br: 0 });
    g.lineStyle(this.selected ? 1.5 : 1, this.selected ? COLORS.cream : this.colors.stroke, lit ? 1 : 0.9)
      .strokeRoundedRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, r);
  }

  setText(text) {
    this.label.setText(text);
    return this;
  }

  // Custom tones for special buttons (CALL, PLAY #8 NOW). Palette tokens only.
  setColors({ fill, stroke, text }) {
    if (fill !== undefined) this.colors.fill = fill;
    if (stroke !== undefined) this.colors.stroke = stroke;
    if (text !== undefined) this.colors.text = text;
    return this.refresh();
  }

  // Disabled buttons still take taps (callers may explain why), but look dim.
  setEnabled(on) {
    this.enabled = on;
    this.label.setAlpha(on ? 1 : 0.4);
    this.skin.setAlpha(on ? 1 : 0.55);
    return this;
  }

  setSelected(on) {
    if (this.selected === on) return this;
    this.selected = on;
    return this.refresh();
  }

  refresh() {
    this.draw();
    this.label.setColor(this.selected ? CSS.cream : this.colors.text);
    return this;
  }

  setPosition(x, y) {
    this.skin.setPosition(x, y);
    this.bg.setPosition(x, y);
    this.label.setPosition(x, y);
    return this;
  }

  setVisible(v) {
    this.skin.setVisible(v);
    this.bg.setVisible(v);
    this.label.setVisible(v);
    if (v) this.bg.setInteractive(); else this.bg.disableInteractive();
    return this;
  }

  parts() {
    return [this.skin, this.bg, this.label];
  }

  addTo(container) {
    container.add(this.parts());
    return this;
  }

  destroy() {
    for (const p of this.parts()) p.destroy();
  }
}
