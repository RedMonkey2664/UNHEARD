// Small effect textures (docs/10 section 3), made once at boot.

import { ART, COLORS as C } from '../../config/constants.js';
import { createRng } from '../../utils/rng.js';
import { circle, ellipse, fillRect, glow, hGrad, line, makeTexture, poly, rgba, shade, vGrad } from './canvasKit.js';

export const TV_STATIC_FRAMES = 3;

export function generateFx(scene) {
  const rng = createRng(ART.seed ^ 0xfeed);

  makeTexture(scene, 'fx_glow', 64, 64, (ctx) => glow(ctx, 32, 32, 32, C.glassHi, 1));
  makeTexture(scene, 'fx_mote', 8, 8, (ctx) => glow(ctx, 4, 4, 4, C.glassHi, 0.9));
  makeTexture(scene, 'fx_steam', 18, 18, (ctx) => glow(ctx, 9, 9, 9, C.glassHi, 0.55));

  // A four-point glint: the hotspot hint.
  makeTexture(scene, 'fx_glint', 24, 24, (ctx) => {
    glow(ctx, 12, 12, 10, C.cream, 0.5);
    poly(ctx, C.cream, [12, 1, 13.4, 10.6, 23, 12, 13.4, 13.4, 12, 23, 10.6, 13.4, 1, 12, 10.6, 10.6], 0.9);
    circle(ctx, C.glassHi, 12, 12, 1.6);
  });

  // Film grain tile; the scene jitters its position at grainFps.
  makeTexture(scene, 'fx_grain', 256, 256, (ctx) => {
    for (let i = 0; i < 5200; i++) {
      const v = rng.next() > 0.5 ? C.glassHi : C.void;
      fillRect(ctx, v, rng.range(0, 256), rng.range(0, 256), rng.range(0.6, 1.4), rng.range(0.6, 1.4),
        rng.range(0.15, 0.5));
    }
  });

  // Edge vignette, full size: a small one scaled up shows banding.
  makeTexture(scene, 'fx_vignette', 960, 540, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.32, w / 2, h / 2, w * 0.62);
    g.addColorStop(0, rgba(C.void, 0));
    g.addColorStop(1, rgba(C.void, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Dither the alpha: an 8-bit near-black gradient bands visibly otherwise.
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] > 0) d[i] = Math.max(0, Math.min(255, d[i] + rng.int(-3, 3)));
    }
    ctx.putImageData(img, 0, 0);
  });

  // Ceiling fan blades seen from below (squashed in the scene for perspective).
  makeTexture(scene, 'fx_fan', 150, 150, (ctx) => {
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(75, 75);
      ctx.rotate((i / 3) * Math.PI * 2);
      poly(ctx, C.woodDark, [-7, -8, 7, -8, 11, -70, -11, -70]);
      poly(ctx, shade(C.woodDark, 1.3), [-7, -8, 0, -8, 0, -70, -11, -70]);
      ctx.restore();
    }
    circle(ctx, C.steelDark, 75, 75, 12);
    circle(ctx, C.steel, 75, 75, 5);
  });
  makeTexture(scene, 'fx_fan_rod', 8, 40, (ctx) => fillRect(ctx, C.steelDark, 2, 0, 4, 40));

  // Rain streaks, tiled and scrolled over an open window.
  makeTexture(scene, 'fx_rain', 64, 128, (ctx) => {
    for (let i = 0; i < 26; i++) {
      const x = rng.range(0, 64);
      const y = rng.range(0, 128);
      line(ctx, C.glass, rng.range(0.3, 0.7), 1, x, y, x - 4, y + rng.range(10, 20));
    }
  });

  // A headlight sweep: a soft vertical band of light.
  makeTexture(scene, 'fx_sweep', 40, 128, (ctx, w, h) => {
    hGrad(ctx, 0, 0, w, h, [[0, C.headlight, 0], [0.5, C.headlight, 0.55], [1, C.headlight, 0]]);
  });

  // An open window: shutters swung inward, the dark night beyond.
  makeTexture(scene, 'fx_window_open', 120, 140, (ctx) => {
    vGrad(ctx, 18, 10, 84, 122, [[0, shade(C.night, 0.7)], [1, C.night]]);
    poly(ctx, C.woodDark, [2, 6, 22, 14, 22, 128, 2, 136]);
    poly(ctx, shade(C.woodDark, 1.25), [118, 6, 98, 14, 98, 128, 118, 136]);
    poly(ctx, C.glass, [5, 12, 19, 18, 19, 124, 5, 130], 0.25);
    poly(ctx, C.glass, [115, 12, 101, 18, 101, 124, 115, 130], 0.25);
  });

  // TV static frames.
  for (let f = 0; f < TV_STATIC_FRAMES; f++) {
    makeTexture(scene, 'fx_tvstatic_' + f, 80, 48, (ctx) => {
      fillRect(ctx, C.void, 0, 0, 80, 48);
      for (let i = 0; i < 900; i++) {
        fillRect(ctx, C.glassHi, rng.int(0, 79), rng.int(0, 47), 1, 1, rng.range(0.1, 0.8));
      }
    });
  }

  // The jute curtain (Living hide spot), swayed in the scene.
  makeTexture(scene, 'prop_curtain', 112, 362, (ctx, w, h) => {
    vGrad(ctx, 0, 0, w, h, [[0, shade(C.jute, 0.85)], [1, shade(C.jute, 0.6)]]);
    for (let x = 0; x < w; x += 14) {
      hGrad(ctx, x, 0, 14, h, [[0, C.void, 0.28], [0.5, C.glassHi, 0.05], [1, C.void, 0.28]]);
    }
    for (let i = 0; i < 160; i++) fillRect(ctx, shade(C.jute, 0.5), rng.int(0, w), rng.int(0, h), 2, 1, 0.4);
    hGrad(ctx, w - 8, 0, 8, h, [[0, C.lamp, 0], [1, C.lamp, 0.3]]);
    for (let i = 0; i < 6; i++) ellipse(ctx, C.brass, 8 + i * 19, 3, 4, 3);
  });
}
