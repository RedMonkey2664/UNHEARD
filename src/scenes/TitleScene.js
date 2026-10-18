// Title: name, tagline, content notes, endings-found dots, settings, how to
// play, BEGIN (which goes through How to play first).

import Phaser from 'phaser';
import { ART, COLORS, CSS, ENDING_IDS, FONTS, SUBTITLE_SIZES } from '../config/constants.js';
import { TEXTS } from '../data/texts.js';
import { Button } from '../ui/Button.js';
import { textStyle } from '../ui/text.js';
import { clamp, round1 } from '../utils/math.js';
import { createRng } from '../utils/rng.js';
import { loadEndings, saveSettings } from '../utils/storage.js';

const W = 960;
const H = 540;
const SHIMMER_MS = 90;
const TITLE_Y = 140;
const TITLE_SPACING = 14;

const TOGGLES = [
  { key: 'assist', label: 'Assist mode' },
  { key: 'reduceFlash', label: 'Reduce flash' },
  { key: 'hotspotHints', label: 'Hotspot hints' },
  { key: 'vibration', label: 'Vibration (mobile)' }
];

const VOLUMES = [
  { key: 'volMaster', label: 'Master volume' },
  { key: 'volVoice', label: 'Voice volume' },
  { key: 'volSfx', label: 'SFX volume' }
];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.settings = { ...this.registry.get('settings') };
    this.rng = createRng(1009);
    this.cameras.main.setBackgroundColor(COLORS.void);

    this.shimmer = this.add.graphics();
    this.shimmerTimer = this.time.addEvent({ delay: SHIMMER_MS, loop: true,
      callback: () => this.drawShimmer() });

    // A window onto the night behind the title, half lost in the dark.
    this.add.image(W / 2, 214, 'title_window').setAlpha(0.26);

    this.buildTitle();
    // The one orchestrated moment: the tagline arrives after the name.
    const tagline = this.add.text(W / 2, 205, TEXTS.title.tagline,
      textStyle({ font: FONTS.memory, style: 'italic', size: 20, color: CSS.dim }))
      .setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: tagline, alpha: 1, delay: 500, duration: 1200, ease: 'Sine.easeOut' });

    TEXTS.title.notes.forEach((line, i) => {
      this.add.text(W / 2, 262 + i * 24, line, textStyle({ size: 16, color: CSS.dim }))
        .setOrigin(0.5);
    });

    this.drawEndingDots(loadEndings());

    new Button(this, W / 2, 430, 'BEGIN', () => this.begin(), { width: 220, height: 56, size: 22 });
    this.viewBtn = new Button(this, W / 2, 498, '', () => this.toggleView(), { width: 300, height: 44, size: 16 });
    this.refreshViewButton();
    new Button(this, W - 90, 44, 'Settings', () => this.openSettings(), { width: 140, height: 44 });
    new Button(this, 100, 44, TEXTS.howTo.open, () => this.howToPlay(), { width: 160, height: 44 });

    this.buildSettingsPanel();
  }

  // "UNHEARD" as separate letters so one can glitch now and then.
  buildTitle() {
    const style = textStyle({ font: FONTS.memory, size: 76, color: CSS.cream });
    const letters = TEXTS.title.name.split('').map((ch) => this.add.text(0, TITLE_Y, ch, style).setOrigin(0, 0.5));
    const total = letters.reduce((sum, t) => sum + t.width, 0) + TITLE_SPACING * (letters.length - 1);
    let x = W / 2 - total / 2;
    for (const t of letters) {
      t.setX(x);
      t.homeX = x;
      x += t.width + TITLE_SPACING;
    }
    this.letters = letters;
    this.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.nextGlitch = this.rng.range(...ART.glitchEvery);
  }

  update(_t, deltaMs) {
    const dt = deltaMs / 1000;
    this.registry.get('audio')?.update(null, dt, false, true);
    if (this.reduceMotion || !this.letters) return;
    this.nextGlitch -= dt;
    if (this.nextGlitch > 0) return;
    this.nextGlitch = this.rng.range(...ART.glitchEvery);
    // One letter slips sideways and goes teal for a moment, like bad signal.
    const t = this.letters[this.rng.int(0, this.letters.length - 1)];
    t.setX(t.homeX + this.rng.range(-4, 4)).setColor(CSS.cold).setAlpha(0.75);
    this.time.delayedCall(ART.glitchMs, () => t.setX(t.homeX).setColor(CSS.cream).setAlpha(1));
  }

  drawShimmer() {
    const g = this.shimmer;
    g.clear();
    for (let i = 0; i < 70; i++) {
      g.fillStyle(COLORS.text, this.rng.range(0.03, 0.09));
      g.fillRect(this.rng.int(0, W), this.rng.int(0, H), 2, 1);
    }
  }

  drawEndingDots(found) {
    const g = this.add.graphics();
    const spacing = 28;
    const x0 = W / 2 - spacing * 1.5;
    ENDING_IDS.forEach((id, i) => {
      const x = x0 + i * spacing;
      if (found.includes(id)) {
        g.fillStyle(COLORS.cream, 1).fillCircle(x, 360, 6);
      } else {
        g.lineStyle(1.5, COLORS.line, 1).strokeCircle(x, 360, 6);
      }
    });
  }

  begin() {
    if (this.panel.visible) return;
    this.scene.start('HowToPlay', { mode: 'start' });
  }

  // 3D first person (default) or the original 2D side view.
  toggleView() {
    if (this.panel.visible) return;
    this.settings.view3d = !this.settings.view3d;
    this.commit();
    this.refreshViewButton();
  }

  refreshViewButton() {
    this.viewBtn.setText(this.settings.view3d ? TEXTS.title.view3d : TEXTS.title.view2d);
  }

  howToPlay() {
    if (this.panel.visible) return;
    this.scene.start('HowToPlay', { mode: 'view' });
  }

  // --- settings -----------------------------------------------------------

  buildSettingsPanel() {
    const panel = this.add.container(0, 0).setDepth(10);
    this.panel = panel;

    // Full-screen blocker so taps do not reach the title buttons below.
    const blocker = this.add.rectangle(W / 2, H / 2, W, H, COLORS.void, 0.92)
      .setInteractive();
    const frame = this.add.rectangle(W / 2, H / 2, 860, 490, COLORS.panel, 1)
      .setStrokeStyle(1, COLORS.line);
    const title = this.add.text(W / 2, 54, 'Settings', textStyle({ size: 24, color: CSS.cream }))
      .setOrigin(0.5);
    panel.add([blocker, frame, title]);

    this.controls = [];
    const rowY = (i) => 118 + i * 64;

    TOGGLES.forEach((t, i) => {
      this.addLabel(panel, 80, rowY(i), t.label);
      const btn = new Button(this, 420, rowY(i), '', () => {
        this.settings[t.key] = !this.settings[t.key];
        this.commit();
      }, { width: 96 }).addTo(panel);
      this.controls.push(() => btn.setText(this.settings[t.key] ? 'On' : 'Off')
        .setSelected(this.settings[t.key]));
    });

    this.addLabel(panel, 80, rowY(4), 'Subtitle size');
    SUBTITLE_SIZES.forEach((size, j) => {
      const btn = new Button(this, 356 + j * 64, rowY(4), size, () => {
        this.settings.subtitleSize = size;
        this.commit();
      }, { width: 52 }).addTo(panel);
      this.controls.push(() => btn.setSelected(this.settings.subtitleSize === size));
    });

    VOLUMES.forEach((v, i) => {
      this.addLabel(panel, 520, rowY(i), v.label);
      const value = this.add.text(800, rowY(i), '', textStyle({ size: 18 })).setOrigin(0.5);
      panel.add(value);
      const step = (d) => {
        this.settings[v.key] = round1(clamp(this.settings[v.key] + d, 0, 1));
        this.commit();
      };
      new Button(this, 736, rowY(i), '-', () => step(-0.1), { width: 52 }).addTo(panel);
      new Button(this, 864, rowY(i), '+', () => step(0.1), { width: 52 }).addTo(panel);
      this.controls.push(() => value.setText(Math.round(this.settings[v.key] * 100) + '%'));
    });

    this.addLabel(panel, 520, rowY(3), 'Subtitles are always on.', CSS.dim);

    new Button(this, W / 2, 470, 'Done', () => this.closeSettings(), { width: 180 })
      .addTo(panel);

    this.refreshControls();
    panel.setVisible(false);
    this.setPanelInput(false);
  }

  addLabel(panel, x, y, text, color = CSS.text) {
    const label = this.add.text(x, y, text, textStyle({ size: 18, color, align: 'left' }))
      .setOrigin(0, 0.5);
    panel.add(label);
  }

  // Containers do not stop input on hidden children, so toggle it explicitly.
  setPanelInput(on) {
    for (const child of this.panel.list) {
      if (!child.input) continue;
      if (on) child.setInteractive(); else child.disableInteractive();
    }
  }

  openSettings() {
    this.panel.setVisible(true);
    this.setPanelInput(true);
  }

  closeSettings() {
    this.panel.setVisible(false);
    this.setPanelInput(false);
  }

  commit() {
    saveSettings(this.settings);
    this.registry.set('settings', { ...this.settings });
    this.sound.volume = this.settings.volMaster;
    this.refreshControls();
  }

  refreshControls() {
    for (const fn of this.controls) fn();
  }
}
