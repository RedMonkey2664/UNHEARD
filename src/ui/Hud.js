// HUD: battery (top left), noise bar (top right), torch / sneak / phone /
// call buttons (docs/07 section 1, styled per docs/10 section 6). Presence is
// never shown. Graphics redraw only when the value they show changes.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { COLORS, CSS, FONTS, UI } from '../config/constants.js';
import { textStyle } from './text.js';

const LOW_BATTERY = 15;
const MID_BATTERY = 30;
const NOISE_AMBER = 40;
const BLINK_MS = 500;
const BAT_SEGMENTS = 5;
const NOISE_SEGMENTS = 12;
const NOISE_W = 132;
const PRESS_MS = 80;

const hex = (c) => '#' + c.toString(16).padStart(6, '0');

class RoundButton {
  constructor(scene, x, y, icon, onTap) {
    const r = UI.roundButton / 2;
    this.scene = scene;
    this.r = r;
    this.active = null;
    this.circle = scene.add.image(x, y, 'ui_btn_round').setDisplaySize(UI.roundButton, UI.roundButton);
    this.ring = scene.add.graphics();
    this.icon = scene.add.image(x, y, icon).setTint(COLORS.text);
    this.circle.setInteractive({ hitArea: new Phaser.Geom.Circle(32, 32, 32),
      hitAreaCallback: Phaser.Geom.Circle.Contains, useHandCursor: true });
    this.circle.on('pointerdown', () => {
      const targets = [this.circle, this.icon];
      const base = this.circle.scaleX;
      scene.tweens.killTweensOf(targets);
      this.circle.setScale(base);
      scene.tweens.add({ targets: this.icon, scale: 0.92, duration: PRESS_MS, yoyo: true, ease: 'Quart.easeOut' });
      onTap();
    });
    this.fit = this.fit.bind(this);
    scene.scale.on('resize', this.fit);
    scene.events.once('shutdown', () => scene.scale.off('resize', this.fit));
    this.fit();
    this.setActive(false);
  }

  get x() { return this.circle.x; }
  get y() { return this.circle.y; }

  // Keep at least minTapPx CSS pixels when the canvas is scaled down. The
  // hit circle is in the 64 px texture's local space.
  fit() {
    const minR = (UI.minTapPx * (this.scene.scale.displayScale.x || 1)) / 2;
    const scale = 64 / UI.roundButton;
    if (this.circle.input) this.circle.input.hitArea.radius = Math.max(this.r, minR) * scale;
  }

  setActive(on, color = COLORS.cream) {
    if (this.active === on) return;
    this.active = on;
    this.icon.setTint(on ? color : COLORS.text);
    this.ring.clear();
    if (on) {
      this.ring.lineStyle(2, color, 0.9).strokeCircle(this.x, this.y, this.r + 1);
      this.ring.fillStyle(color, 0.08).fillCircle(this.x, this.y, this.r);
    }
  }

  setDisabled(off) {
    this.icon.setAlpha(off ? 0.35 : 1);
  }

  setVisible(on) {
    this.circle.setVisible(on);
    this.icon.setVisible(on);
    this.ring.setVisible(on);
    if (on) this.circle.setInteractive(); else this.circle.disableInteractive();
  }
}

export class Hud {
  constructor(scene, handlers) {
    this.scene = scene;

    // Battery: segmented cell with a glow that turns amber, then red.
    this.batGlow = scene.add.image(36, 28, 'fx_glow').setDisplaySize(90, 46).setAlpha(0.18)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.batIcon = scene.add.graphics();
    this.batText = scene.add.text(64, 28, '', textStyle({ size: 18, align: 'left' })).setOrigin(0, 0.5);

    // Noise: segments with a tick at the investigate threshold.
    const nx = 960 - 24 - NOISE_W;
    this.noiseX = nx;
    this.noiseLabel = scene.add.text(nx - 10, 28, 'Noise', textStyle({ size: 16, color: CSS.dim }))
      .setOrigin(1, 0.5);
    this.noiseBar = scene.add.graphics();

    const y = 540 - 16 - UI.roundButton / 2;
    this.torch = new RoundButton(scene, 24 + UI.roundButton / 2, y, 'ic_torch', handlers.torch);
    this.sneak = new RoundButton(scene, 24 + UI.roundButton * 1.5 + 14, y, 'ic_sneak', handlers.sneak);
    this.phone = new RoundButton(scene, 960 - 24 - UI.roundButton / 2, y, 'ic_phone', handlers.phone);
    // CALL appears after the tape is taken; POLICE m:ss beside it once connected.
    this.call = new RoundButton(scene, 960 - 24 - UI.roundButton * 1.5 - 14, y, 'ic_call', handlers.call);
    this.callRing = scene.add.graphics();
    this.eta = scene.add.text(this.call.x - 44, y, '', textStyle({ size: 18, color: CSS.cream, align: 'right' }))
      .setOrigin(1, 0.5);
    this.setCallVisible(false);

    // Objective: a quiet banner at the top centre.
    this.banner = scene.add.image(480, 30, 'ui_banner').setAlpha(0);
    this.objective = scene.add.text(480, 30, '', textStyle({ font: FONTS.memory, style: 'italic', size: 19,
      color: CSS.cream })).setOrigin(0.5).setAlpha(0);
    this.dot = scene.add.circle(this.phone.x + 20, this.phone.y - 20, 5, COLORS.lamp).setVisible(false);

    // Faint red edge that pulses when noise >= 40 (docs/07 section 1).
    this.vignette = scene.add.rectangle(480, 270, 960 - 12, 540 - 12)
      .setStrokeStyle(12, COLORS.danger, 1).setAlpha(0);
    this.pulse = 0;

    this.blink = true;
    scene.time.addEvent({ delay: BLINK_MS, loop: true, callback: () => { this.blink = !this.blink; } });
    this.lastBattery = null;
    this.drawnBattery = null;
    this.drawnNoise = null;
  }

  showObjective(text, sec) {
    const targets = [this.objective, this.banner];
    this.scene.tweens.killTweensOf(targets);
    this.objective.setText(text).setAlpha(0).setY(34);
    this.banner.setAlpha(0).setDisplaySize(Math.max(320, this.objective.width + 140), 40);
    this.scene.tweens.add({ targets, alpha: 1, y: 30, duration: 220, ease: 'Quart.easeOut' });
    this.scene.tweens.add({ targets, alpha: 0, delay: sec * 1000 - 400, duration: 400, ease: 'Sine.easeInOut' });
  }

  spottedPulse() {
    this.scene.tweens.killTweensOf(this.vignette);
    this.vignette.setAlpha(0.6);
    this.spotted = 0.3;
  }

  setCallVisible(on) {
    this.call.setVisible(on);
  }

  updateCall(state) {
    const f = state.flags;
    const show = f.tapeTaken && f.tapeMoment === null && !f.callConnected;
    if (show !== this.call.circle.visible) this.setCallVisible(show);
    this.call.setActive(show, COLORS.green);
    const g = this.callRing;
    g.clear();
    if (f.callConnecting) {
      const t = f.callConnectTimer / BALANCE.final.callConnectSec;
      g.lineStyle(4, COLORS.green, 1).beginPath();
      g.arc(this.call.x, this.call.y, UI.roundButton / 2 + 4, -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * t, false).strokePath();
    }
    if (f.callConnected && f.policeEta !== null) {
      const sec = Math.ceil(f.policeEta);
      this.eta.setText(`POLICE ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`);
      this.eta.setX(this.phone.x - 44);
    } else {
      this.eta.setText('');
    }
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
    this.torch.setActive(state.torchOn);
    this.torch.setDisabled(state.battery <= 0);
    this.sneak.setActive(state.player.sneaking);
    this.updateCall(state);
    if (this.spotted > 0) {
      this.spotted -= 1 / 60;
      return;
    }
    this.vignette.setAlpha(state.noise >= NOISE_AMBER ? 0.12 + 0.08 * Math.sin(this.pulse) : 0);
  }

  drawBattery(pct) {
    const color = pct < LOW_BATTERY ? COLORS.danger : pct <= MID_BATTERY ? COLORS.amber : COLORS.cream;
    const visible = pct >= LOW_BATTERY || this.blink;
    const key = pct * 2 + (visible ? 1 : 0);
    if (key === this.drawnBattery) return;
    this.drawnBattery = key;
    const g = this.batIcon;
    g.clear();
    this.batGlow.setTint(color).setAlpha(pct <= MID_BATTERY ? 0.3 : 0.12);
    this.batText.setText(pct + '%').setColor(hex(color)).setVisible(visible);
    if (!visible) return;
    g.lineStyle(2, color, 1).strokeRoundedRect(18, 19, 34, 18, 4);
    g.fillStyle(color, 1).fillRoundedRect(52, 24, 3, 8, 1);
    const lit = Math.ceil((pct / 100) * BAT_SEGMENTS);
    for (let i = 0; i < BAT_SEGMENTS; i++) {
      g.fillStyle(color, i < lit ? 1 : 0.12).fillRect(21 + i * 6, 22, 5, 12);
    }
  }

  drawNoise(value) {
    const N = BALANCE.noise;
    const shown = Math.round(value);
    const loud = value >= N.investigateAt;
    // Red segments pulse at 60+, so redraw on the pulse there too.
    const key = loud ? shown + Math.round(Math.sin(this.pulse * 2) * 4) * 1000 : shown;
    if (key === this.drawnNoise) return;
    this.drawnNoise = key;
    const color = loud ? COLORS.danger : value >= NOISE_AMBER ? COLORS.amber : COLORS.cold;
    const g = this.noiseBar;
    const x = this.noiseX;
    const segW = NOISE_W / NOISE_SEGMENTS;
    const lit = Math.ceil((value / N.max) * NOISE_SEGMENTS);
    const pulseA = loud ? 0.75 + 0.25 * Math.sin(this.pulse * 2) : 1;
    g.clear();
    for (let i = 0; i < NOISE_SEGMENTS; i++) {
      g.fillStyle(i < lit ? color : COLORS.line, i < lit ? pulseA : 0.6)
        .fillRoundedRect(x + i * segW, 23, segW - 2, 10, 2);
    }
    // Tick at 60 so colour is never the only cue (docs/07 section 9).
    const tx = x + NOISE_W * (N.investigateAt / N.max) - 1;
    g.lineStyle(2, COLORS.text, 0.85).lineBetween(tx, 18, tx, 38);
    this.noiseLabel.setText(loud ? 'Noise !' : 'Noise').setColor(loud ? hex(COLORS.danger) : CSS.dim);
  }
}
