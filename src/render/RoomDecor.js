// Everything in a room that moves or glows (docs/10 sections 1 and 3): fan,
// curtain sway, steam, emissive details, window glow and headlight sweeps,
// rain on open windows, TV static, dust motes, grain, vignette, and the warm
// torch wash. Objects are built on room change; update() allocates nothing.

import Phaser from 'phaser';
import { ART, COLORS } from '../config/constants.js';
import { TV_STATIC_FRAMES } from './art/fxArt.js';
import { createRng } from '../utils/rng.js';

const W = 960;
const H = 540;
const TV_FPS = 12;
const RADIO_ON_BOOST = 2.4;

// Window rectangles must match roomArt.js.
const WINDOWS = {
  LIVING: { id: 'H_WINDOW_LIVING', x: 270, top: 172, w: 84, h: 122 },
  KITCHEN: { id: 'H_WINDOW_KITCHEN', x: 190, top: 176, w: 78, h: 112 },
  BEDROOM: { id: 'H_WINDOW_BEDROOM', x: 160, top: 170, w: 78, h: 118 }
};

// Tiny lights that stay faintly visible in the dark. r: glow radius px.
const EMISSIVES = {
  HALL: [],
  LIVING: [
    { id: 'radio', x: 184, y: 312, color: COLORS.dialAmber, r: 26, core: 3 },
    { id: 'tvLed', x: 580, y: 364, color: COLORS.ledRed, r: 12, core: 1.6 },
    { id: 'diya', x: 476, y: 194, color: COLORS.diya, r: 30, core: 2.5, flame: true },
    { id: 'photo', x: 450, y: 172, color: COLORS.lamp, r: 78, core: 0, soft: 0.42 }
  ],
  KITCHEN: [{ id: 'pilot', x: 420, y: 352, color: COLORS.pilotBlue, r: 14, core: 1.8 }],
  BEDROOM: [{ id: 'lamp', x: 341, y: 334, color: COLORS.bulb, r: 54, core: 4 }]
};

const FANS = { LIVING: 480, BEDROOM: 480 };

export class RoomDecor {
  constructor(scene, depth) {
    this.scene = scene;
    this.depth = depth;
    this.rng = createRng(ART.seed ^ 0xdec0);
    this.items = [];
    this.t = 0;
    this.grainWait = 0;
    this.radioBoost = 0;
    this.tvFrame = 0;
    this.reduceMotion = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const add = scene.add;
    this.warm = add.image(0, 0, 'light_mask').setTint(COLORS.torchWarm).setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(depth.warm).setAlpha(0);
    this.motes = [];
    for (let i = 0; i < ART.dustCount; i++) {
      this.motes.push({
        img: add.image(0, 0, 'fx_mote').setDepth(depth.dust).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0),
        ox: this.rng.range(-1, 1), oy: this.rng.range(-1, 1),
        vx: this.rng.range(-1, 1), vy: this.rng.range(-1, 1), s: this.rng.range(0.4, 1)
      });
    }
    // Edge vignette: a WebGL shader when available (smooth, no banding),
    // otherwise the dithered texture.
    const postFX = scene.cameras.main.postFX;
    this.vfx = postFX ? postFX.addVignette(0.5, 0.5, ART.vignetteRadius, ART.vignetteStrength) : null;
    this.vignette = add.image(W / 2, H / 2, 'fx_vignette').setDisplaySize(W, H)
      .setDepth(depth.vignette).setAlpha(ART.vignetteAlpha).setVisible(!this.vfx);
    this.hidden = false;
    this.preview = false;
    this.grain = add.tileSprite(W / 2, H / 2, W, H, 'fx_grain').setDepth(depth.grain)
      .setAlpha(ART.grainAlpha);
    // The phone in the player's hand: always faintly lit, so you never lose
    // yourself in the dark.
    this.handGlow = add.image(0, 0, 'fx_glow').setTint(COLORS.phoneGlow).setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(depth.emissive).setDisplaySize(26, 26).setAlpha(0);
  }

  // --- per room ----------------------------------------------------------------

  clear() {
    for (const o of this.items) o.destroy();
    this.items = [];
    this.emissives = [];
    this.fan = null;
    this.curtain = null;
    this.win = null;
    this.steam = [];
    this.tv = null;
  }

  keep(obj) {
    this.items.push(obj);
    return obj;
  }

  build(roomId) {
    this.clear();
    const s = this.scene;
    const D = this.depth;

    for (const e of EMISSIVES[roomId]) {
      const halo = this.keep(s.add.image(e.x, e.y, 'fx_glow').setTint(e.color)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(D.emissive).setDisplaySize(e.r * 2, e.r * 2));
      const core = e.core ? this.keep(s.add.image(e.x, e.y, 'fx_mote').setTint(e.color)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(D.emissive).setDisplaySize(e.core * 3, e.core * 3)) : null;
      this.emissives.push({ ...e, halo, core, phase: this.rng.range(0, 6) });
    }

    if (FANS[roomId] !== undefined) {
      const x = FANS[roomId];
      this.keep(s.add.image(x, 22, 'fx_fan_rod').setDepth(D.props));
      const c = this.keep(s.add.container(x, 44).setDepth(D.props).setScale(1, 0.2));
      c.add(s.add.image(0, 0, 'fx_fan'));
      this.fan = c.list[0];
    }

    if (roomId === 'LIVING') {
      this.curtain = this.keep(s.add.image(70, 62, 'prop_curtain').setOrigin(0.5, 0).setDepth(D.props));
      // A real ov_tv_static overlay (RoomScene) replaces the generated static.
      if (!s.textures.exists('ov_tv_static')) {
        this.tv = this.keep(s.add.image(540, 335, 'fx_tvstatic_0').setDepth(D.emissive)
          .setDisplaySize(80, 48).setAlpha(0.55).setVisible(false));
        this.tvGlow = this.keep(s.add.image(540, 335, 'fx_glow').setTint(COLORS.cold)
          .setBlendMode(Phaser.BlendModes.ADD).setDepth(D.emissive).setDisplaySize(160, 120).setVisible(false));
      }
    }

    if (roomId === 'HALL') {
      for (let i = 0; i < ART.steamCount; i++) {
        this.steam.push({ img: this.keep(s.add.image(520, 350, 'fx_steam').setDepth(D.props).setAlpha(0)),
          t: i / ART.steamCount });
      }
    }

    const w = WINDOWS[roomId];
    if (w) {
      const cx = w.x;
      const cy = w.top + w.h / 2;
      const pngOverlay = s.textures.exists('ov_window_open_' + roomId.toLowerCase());
      this.win = {
        ...w,
        street: this.keep(s.add.image(w.x - w.w / 4, w.top + w.h * 0.28, 'fx_glow').setTint(COLORS.street)
          .setBlendMode(Phaser.BlendModes.ADD).setDepth(D.emissive).setDisplaySize(70, 70)),
        pane: this.keep(s.add.image(cx, cy, 'fx_glow').setTint(COLORS.nightGlow)
          .setBlendMode(Phaser.BlendModes.ADD).setDepth(D.emissive).setDisplaySize(w.w * 1.6, w.h * 1.4)),
        sweep: this.keep(s.add.image(cx, cy, 'fx_sweep').setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(D.emissive).setDisplaySize(26, w.h).setAlpha(0)),
        open: pngOverlay ? null : this.keep(s.add.image(cx, cy, 'fx_window_open').setDepth(D.props)
          .setDisplaySize(w.w + 30, w.h + 14).setVisible(false)),
        rain: this.keep(s.add.tileSprite(cx, cy, w.w, w.h, 'fx_rain').setDepth(D.props)
          .setAlpha(0.7).setVisible(false)),
        nextSweep: this.rng.range(...ART.sweepEvery),
        sweepT: -1
      };
    }
  }

  radioOn(sec) {
    this.radioBoost = sec;
  }

  // --- frame ---------------------------------------------------------------------

  // light: { x, y, on, radius }. view: { windowOpen, tvOn, steam, preview, reduceFlash }
  update(dt, light, view) {
    this.t += dt;
    const t = this.t;
    const calm = view.reduceFlash || this.reduceMotion;

    // Film grain at grainFps.
    this.grainWait -= dt;
    if (this.grainWait <= 0) {
      this.grainWait = 1 / ART.grainFps;
      this.grain.tilePositionX = this.rng.int(0, 255);
      this.grain.tilePositionY = this.rng.int(0, 255);
    }

    this.handGlow.setVisible(view.hand.visible).setPosition(view.hand.x, view.hand.y)
      .setAlpha(ART.emissiveAlpha * 0.8);

    // Warm-white wash over the lit circle, and dust motes inside it.
    const r = light.radius;
    this.warm.setVisible(light.on && !view.preview).setPosition(light.x, light.y)
      .setScale((r * 2) / 512).setAlpha(ART.torchWarmAlpha);
    for (const m of this.motes) {
      m.ox += (m.vx * ART.dustSpeed * dt) / r;
      m.oy += (m.vy * ART.dustSpeed * dt) / r - (ART.dustSpeed * 0.3 * dt) / r;
      if (m.ox * m.ox + m.oy * m.oy > 1) {
        m.ox = -m.ox * 0.9;
        m.oy = -m.oy * 0.9;
      }
      const d = Math.sqrt(m.ox * m.ox + m.oy * m.oy);
      m.img.setPosition(light.x + m.ox * r * 0.8, light.y + m.oy * r * 0.8)
        .setAlpha(light.on ? (1 - d) * 0.5 * m.s : 0).setScale(m.s);
    }

    // Emissives: steady, the diya breathing gently (never spiking).
    this.radioBoost = Math.max(0, this.radioBoost - dt);
    for (const e of this.emissives) {
      let a = ART.emissiveAlpha * (e.soft ?? 1);
      if (e.flame && !calm) a *= 0.85 + 0.15 * Math.sin(t * 3.1 + e.phase) * Math.sin(t * 1.7);
      if (e.id === 'radio' && this.radioBoost > 0) a *= RADIO_ON_BOOST;
      e.halo.setAlpha(Math.min(1, a));
      if (e.core) e.core.setAlpha(Math.min(1, a * 2.2));
    }

    if (this.fan) this.fan.rotation += ART.fanSpeed * dt;
    if (this.curtain) this.curtain.rotation = calm ? 0 : Math.sin(t * 0.7) * ART.curtainSway;

    for (const p of this.steam) {
      p.t = (p.t + dt * 0.35) % 1;
      p.img.setVisible(view.steam).setPosition(520 + Math.sin((p.t + t * 0.2) * 6) * 4, 348 - p.t * 46)
        .setAlpha((1 - p.t) * 0.35 * Math.min(1, p.t * 6)).setScale(0.6 + p.t * 0.9);
    }

    if (this.tv) {
      const on = view.tvOn;
      this.tv.setVisible(on);
      this.tvGlow.setVisible(on).setAlpha(0.18);
      if (on) {
        const f = Math.floor(t * TV_FPS) % TV_STATIC_FRAMES;
        if (f !== this.tvFrame) {
          this.tvFrame = f;
          this.tv.setTexture('fx_tvstatic_' + f).setDisplaySize(80, 48);
        }
      }
    }

    const w = this.win;
    if (w) {
      const open = view.windowOpen(w.id);
      w.street.setAlpha(ART.emissiveAlpha * 0.45);
      w.pane.setAlpha(ART.emissiveAlpha * 0.25);
      if (w.open) w.open.setVisible(open);
      w.rain.setVisible(open);
      if (open) w.rain.tilePositionY -= ART.rainSpeed * dt;
      // A passing car's headlights sweep across the glass now and then.
      if (w.sweepT < 0) {
        w.nextSweep -= dt;
        if (w.nextSweep <= 0) w.sweepT = 0;
      } else {
        w.sweepT += dt / ART.sweepSec;
        const k = w.sweepT;
        w.sweep.setX(w.x - w.w / 2 + k * w.w).setAlpha(Math.sin(Math.PI * Math.min(1, k)) * 0.35);
        if (k >= 1) {
          w.sweepT = -1;
          w.sweep.setAlpha(0);
          w.nextSweep = this.rng.range(...ART.sweepEvery);
        }
      }
    }
  }

  setPreview(on) {
    if (on === this.preview) return;
    this.preview = on;
    if (this.vfx) this.vfx.active = !on;
    else this.vignette.setVisible(!on);
  }

  // Hiding closes the vignette in. Returns false if the caller must draw it.
  setHidden(on) {
    if (!this.vfx) return false;
    if (on !== this.hidden) {
      this.hidden = on;
      this.vfx.radius = on ? ART.hiddenRadius : ART.vignetteRadius;
      this.vfx.strength = on ? ART.hiddenStrength : ART.vignetteStrength;
    }
    return true;
  }
}
