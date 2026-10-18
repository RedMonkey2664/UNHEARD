// UI textures (docs/10 section 6): glass round buttons, line icons, the
// phone device and the objective banner. Icons are white so they can be
// tinted with the palette.

import { COLORS as C, PHONE_LAYOUT } from '../../config/constants.js';
import { DEVICE } from '../../utils/device.js';
import { circle, ellipse, fillRRect, glow, hGrad, line, makeTexture, poly, rgba, rrect, vGrad } from './canvasKit.js';

const PL = DEVICE.touch ? PHONE_LAYOUT.touch : PHONE_LAYOUT.desk;
export const PHONE_DEVICE = { w: PL.w + 20, h: PL.h + 20, bezel: 10, radius: 30, screenRadius: 22 };

function stroke(ctx, w = 2.2) {
  ctx.strokeStyle = rgba(C.glassHi, 1);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

export function generateUi(scene) {
  // Round glass button: dark body, soft top highlight, thin rim.
  makeTexture(scene, 'ui_btn_round', 64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 26, 4, 32, 32, 32);
    g.addColorStop(0, rgba(C.line, 0.95));
    g.addColorStop(1, rgba(C.panel, 0.95));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    ellipse(ctx, C.glassHi, 32, 16, 17, 8, 0.08);
    ctx.strokeStyle = rgba(C.glassHi, 0.16);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(32, 32, 29.5, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Torch: a small flashlight with a beam.
  makeTexture(scene, 'ic_torch', 32, 32, (ctx) => {
    stroke(ctx);
    rrect(ctx, 5, 13, 13, 8, 2);
    ctx.stroke();
    poly(ctx, C.glassHi, [18, 11, 23, 9, 23, 25, 18, 23], 0.95);
    line(ctx, C.glassHi, 0.6, 1.6, 26, 12, 30, 9);
    line(ctx, C.glassHi, 0.6, 1.6, 26, 17, 30, 17);
    line(ctx, C.glassHi, 0.6, 1.6, 26, 22, 30, 25);
  });

  // Sneak: two footprints.
  makeTexture(scene, 'ic_sneak', 32, 32, (ctx) => {
    ellipse(ctx, C.glassHi, 11, 19, 4, 6.5);
    circle(ctx, C.glassHi, 11, 27, 2.6);
    ellipse(ctx, C.glassHi, 21, 9, 4, 6.5);
    circle(ctx, C.glassHi, 21, 17, 2.6);
  });

  // Phone: a handset with a screen.
  makeTexture(scene, 'ic_phone', 32, 32, (ctx) => {
    stroke(ctx);
    rrect(ctx, 9, 3, 14, 26, 3);
    ctx.stroke();
    line(ctx, C.glassHi, 1, 2, 14, 25, 18, 25);
  });

  // Call: a receiver.
  makeTexture(scene, 'ic_call', 32, 32, (ctx) => {
    stroke(ctx, 3.2);
    ctx.beginPath();
    ctx.arc(16, 18, 10, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    fillRRect(ctx, C.glassHi, 3, 16, 8, 6, 2);
    fillRRect(ctx, C.glassHi, 21, 16, 8, 6, 2);
  });

  // The phone itself: bezel, rounded screen, notch.
  const P = PHONE_DEVICE;
  makeTexture(scene, 'ui_phone', P.w, P.h, (ctx) => {
    fillRRect(ctx, C.bezel, 0, 0, P.w, P.h, P.radius);
    ctx.strokeStyle = rgba(C.line, 1);
    ctx.lineWidth = 1.5;
    rrect(ctx, 0.75, 0.75, P.w - 1.5, P.h - 1.5, P.radius);
    ctx.stroke();
    ctx.save();
    rrect(ctx, P.bezel, P.bezel, P.w - P.bezel * 2, P.h - P.bezel * 2, P.screenRadius);
    ctx.clip();
    vGrad(ctx, 0, 0, P.w, P.h, [[0, C.panel], [1, C.void]]);
    glow(ctx, P.w * 0.3, 20, 160, C.cold, 0.05, 1.4, 0.6);
    ctx.restore();
    fillRRect(ctx, C.bezel, P.w / 2 - 34, P.bezel, 68, 16, 8);
    circle(ctx, C.line, P.w / 2 + 20, P.bezel + 8, 3);
    fillRRect(ctx, C.line, P.w - 3, 90, 3, 40, 1.5);
  });

  // Title backdrop: a barred window onto the night.
  makeTexture(scene, 'title_window', 260, 330, (ctx, w, h) => {
    glow(ctx, w / 2, h / 2, 170, C.nightGlow, 0.25, 1, 1.2);
    fillRRect(ctx, C.bezel, 40, 30, 180, 250, 3);
    vGrad(ctx, 48, 38, 164, 234, [[0, C.night], [1, C.nightGlow]]);
    glow(ctx, 92, 92, 46, C.street, 0.35);
    fillRRect(ctx, C.void, 48, 170, 70, 102, 0, 0.7);
    fillRRect(ctx, C.void, 140, 140, 72, 132, 0, 0.6);
    for (let i = 1; i < 5; i++) fillRRect(ctx, C.bezel, 48 + i * 33 - 2, 38, 4, 234, 1);
    fillRRect(ctx, C.bezel, 48, 152, 164, 4, 1);
    fillRRect(ctx, C.bezel, 30, 280, 200, 10, 2);
  });

  // Objective banner: a dark band that fades out at both ends.
  makeTexture(scene, 'ui_banner', 520, 40, (ctx, w, h) => {
    hGrad(ctx, 0, 0, w, h, [[0, C.void, 0], [0.2, C.void, 0.72], [0.8, C.void, 0.72], [1, C.void, 0]]);
    hGrad(ctx, 0, 0, w, 1, [[0, C.lamp, 0], [0.5, C.lamp, 0.45], [1, C.lamp, 0]]);
    hGrad(ctx, 0, h - 1, w, 1, [[0, C.lamp, 0], [0.5, C.lamp, 0.45], [1, C.lamp, 0]]);
  });
}
