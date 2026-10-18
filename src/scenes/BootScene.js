// Preloads whatever assets exist and builds generated textures. Missing files
// are expected: the game must run with zero art and zero audio.

import Phaser from 'phaser';
import { AUDIO, IMAGES } from '../data/assets.js';
import { COLORS } from '../config/constants.js';
import { generateArt } from '../render/art/generateArt.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const existing = new Set(this.registry.get('assetFiles') || []);
    const missing = new Set();

    for (const { key, url } of IMAGES) {
      if (existing.has(url)) this.load.image(key, url);
      else missing.add(key);
    }
    for (const { key, urls } of AUDIO) {
      const present = urls.filter((u) => existing.has(u));
      if (present.length) this.load.audio(key, present);
      else missing.add(key);
    }

    // A file that exists but fails to load or decode is treated as missing.
    this.load.on('loaderror', (file) => {
      missing.add(file.key);
      console.info('[assets] could not load', file.key);
    });

    this.registry.set('missingAssets', missing);
    this.showProgress();
  }

  // A thin bar while the sound loads (about 6 MB), so a phone on mobile data
  // never looks frozen.
  showProgress() {
    const W = this.scale.width;
    const H = this.scale.height;
    const barW = 240;
    const track = this.add.rectangle(W / 2, H / 2, barW, 2, COLORS.line);
    const bar = this.add.rectangle(W / 2 - barW / 2, H / 2, 0, 2, COLORS.cream).setOrigin(0, 0.5);
    this.load.on('progress', (p) => bar.setSize(barW * p, 2));
    this.load.once('complete', () => { track.destroy(); bar.destroy(); });
  }

  create() {
    this.makeLightMask();
    // Code-drawn art for every key that did not load as a file (docs/10).
    this.registry.set('generatedArt', generateArt(this));
    this.scene.start('Title');
  }

  // Radial gradient used by the DarknessLayer to erase the torch circle: a
  // soft falloff so the torch reads as warm light, not a cut-out (docs/10).
  makeLightMask() {
    if (this.textures.exists('light_mask')) return;
    const size = 512;
    const tex = this.textures.createCanvas('light_mask', size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }
}
