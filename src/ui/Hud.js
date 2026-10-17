// HUD: battery (top left), noise bar (top right), torch / sneak / phone
// buttons (docs/07 section 1). Presence is never shown.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { COLORS, CSS, UI } from '../config/constants.js';
import { textStyle } from './text.js';

const NOISE_W = 120;
const LOW_BATTERY = 15;
const MID_BATTERY = 30;
const NOISE_AMBER = 40;
const BLINK_MS = 500;

class RoundButton {
  constructor(scene, x, y, label, onTap) {
    const r = UI.roundButton / 2;
    this.scene = scene;
    this.r = r;
    this.circle = scene.add.circle(x, y, r, COLORS.panel, 0.85).setStrokeStyle(1.5, COLORS.line);
    this.label = scene.add.text(x, y, label, textStyle({ size: 16 })).setOrigin(0.5);
    this.circle.setInteractive({ hitArea: new Phaser.Geom.Circle(r, r, r),
      hitAreaCallback: Phaser.Geom.Circle.Contains, useHandCursor: true });
    this.circle.on('pointerdown', () => {
      scene.tweens.add({ targets: [this.circle, this.label], scale: 0.92, duration: 60, yoyo: true });
      onTap();
    });
    this.fit = this.fit.bind(this);
    scene.scale.on('resize', this.fit);
    scene.events.once('shutdown', () => scene.scale.off('resize', this.fit));
    this.fit();
  }

  // Keep at least minTapPx CSS pixels when the canvas is scaled down.
  fit() {
    const minR = (UI.minTapPx * (this.scene.scale.displayScale.x || 1)) / 2;
    // Hit area is in local space, centred on (r, r) of the drawn circle.
    if (this.circle.input) this.circle.input.hitArea.radius = Math.max(this.r, minR);
  }

  setActive(on) {
    this.circle.setStrokeStyle(on ? 2.5 : 1.5, on ? COLORS.cream : COLORS.line);
    this.circle.setFillStyle(on ? COLORS.wall : COLORS.panel, 0.85);
    this.label.setColor(on ? CSS.cream : CSS.text);
  }

  setDisabled(off) {
    this.label.setAlpha(off ? 0.4 : 1);
  }
}

export class Hud {
  constructor(scene, handlers) {
    this.scene = scene;

    // Battery: drawn icon plus percent.
    this.batIcon = scene.add.graphics();
    this.batText = scene.add.text(64, 28, '', textStyle({ size: 18, align: 'left' })).setOrigin(0, 0.5);

    // Noise: thin bar with a tick at the investigate threshold.
    const nx = 960 - 24 - NOISE_W;
    this.noiseX = nx;
    this.noiseLabel = scene.add.text(nx - 8, 28, 'NOISE', textStyle({ size: 16, color: CSS.dim }))
      .setOrigin(1, 0.5);
    this.noiseBar = scene.add.graphics();

    const y = 540 - 16 - UI.roundButton / 2;
    this.torch = new RoundButton(scene, 24 + UI.roundButton / 2, y, 'Torch', handlers.torch);
    this.sneak = new RoundButton(scene, 24 + UI.roundButton * 1.5 + 14, y, 'Sneak', handlers.sneak);
    this.phone = new RoundButton(scene, 960 - 24 - UI.roundButton / 2, y, 'Phone', handlers.phone);

    this.objective = scene.add.text(480, 28, '', textStyle({ size: 18, color: CSS.cream }))
      .setOrigin(0.5).setAlpha(0);
    this.dot = scene.add.circle(this.phone.circle.x + 20, this.phone.circle.y - 20, 6, COLORS.lamp)
      .setVisible(false);

    // Faint red edge that pulses when noise >= 40 (docs/07 section 1).
    this.vignette = scene.add.rectangle(480, 270, 960 - 12, 540 - 12)
      .setStrokeStyle(12, COLORS.danger, 1).setAlpha(0);
    this.pulse = 0;

    this.blink = true;
    scene.time.addEvent({ delay: BLINK_MS, loop: true, callback: () => { this.blink = !this.blink; } });
    this.lastBattery = null;
  }

  showObjective(text, sec) {
    this.scene.tweens.killTweensOf(this.objective);
    this.objective.setText(text).setAlpha(1);
    this.scene.tweens.add({ targets: this.objective, alpha: 0, delay: sec * 1000 - 400, duration: 400 });
  }

  setPhoneDot(on) {
    this.dot.setVisible(on);
  }

  setBattery(value) {
    this.lastBattery = Math.ceil(value);
  }

  update(state) {
    this.drawBattery(this.lastBattery ?? Math.ceil(state.battery));
    this.drawNoise(state.noise);
    this.pulse += 0.06;
    this.vignette.setAlpha(state.noise >= NOISE_AMBER ? 0.12 + 0.08 * Math.sin(this.pulse) : 0);
    this.torch.setActive(state.torchOn);
    this.torch.setDisabled(state.battery <= 0);
    this.sneak.setActive(state.player.sneaking);
  }

  drawBattery(pct) {
    const color = pct < LOW_BATTERY ? COLORS.danger : pct <= MID_BATTERY ? COLORS.lamp : COLORS.cream;
    const visible = pct >= LOW_BATTERY || this.blink;
    const g = this.batIcon;
    g.clear();
    if (visible) {
      g.lineStyle(2, color, 1).strokeRect(18, 19, 34, 18);
      g.fillStyle(color, 1).fillRect(52, 24, 3, 8);
      g.fillRect(21, 22, Math.max(0, 28 * pct / 100), 12);
    }
    this.batText.setText(pct + '%').setColor('#' + color.toString(16).padStart(6, '0'))
      .setVisible(visible);
  }

  drawNoise(value) {
    const N = BALANCE.noise;
    const color = value >= N.investigateAt ? COLORS.danger : value >= NOISE_AMBER ? COLORS.lamp : COLORS.cold;
    const g = this.noiseBar;
    const x = this.noiseX;
    g.clear();
    g.fillStyle(COLORS.panel, 0.9).fillRect(x, 24, NOISE_W, 8);
    g.fillStyle(color, 1).fillRect(x, 24, NOISE_W * Math.min(1, value / N.max), 8);
    // Tick at 60 so colour is never the only cue (docs/07 section 9).
    const tx = x + NOISE_W * (N.investigateAt / N.max);
    g.lineStyle(2, COLORS.text, 0.8).lineBetween(tx, 20, tx, 36);
    this.noiseLabel.setText(value >= N.investigateAt ? 'NOISE !' : 'NOISE');
  }
}
