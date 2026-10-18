// Code-drawn room backgrounds (docs/10 sections 1 and 2): the shell plus
// static props, baked into bg_<room> textures at boot. Props sit at the
// hotspot x values from docs/04. Moving or glowing details live in
// RoomDecor instead. Seeded, so a room never changes between runs.

import { ART, COLORS as C } from '../../config/constants.js';
import { createRng } from '../../utils/rng.js';
import { circle, ellipse, fillRect, fillRRect, glow, hGrad, line, makeTexture, poly, rgba, rim, rrect,
  shade, vGrad } from './canvasKit.js';

const W = 960;
const H = 540;
const F = 430;              // floor line
const DOOR_TOP = 232;

// Where each room's tube light hangs (props get their rim on that side).
export const ROOM_LAMP_X = { HALL: 560, LIVING: 300, KITCHEN: 400, BEDROOM: 650 };

// Top edge of each drawn object, so glints and labels sit on the art (the hit
// areas themselves are unchanged, docs/04). Doors use DOOR_ANCHOR.
export const ART_ANCHOR = {
  H_UMBRELLA: 316, H_CLOCK: 264, H_CHAI: 348, H_COAT: 258, H_SHOES: 388,
  H_RADIO: 296, H_WINDOW_LIVING: 164, H_CALENDAR: 222, H_ASHTRAY: 364, H_TV: 302, H_DRAWER_L: 366,
  H_WINDOW_KITCHEN: 168, H_NOTEBOOK: 274, H_COOKER: 292, H_DRAWER_K: 366, H_LOCKER: 280,
  H_WINDOW_BEDROOM: 162, H_DESK: 286, H_NIGHTSTAND: 316, H_BED: 342, H_DRESSER: 288
};
export const DOOR_ANCHOR = 224;

// --- shell -----------------------------------------------------------------

function wall(ctx, rng, lampX) {
  vGrad(ctx, 0, 0, W, F, [[0, C.wallTop], [0.2, C.wallTop], [0.62, C.wall], [1, shade(C.wall, 0.78)]]);
  glow(ctx, lampX, 80, 340, C.bulb, 0.07, 1.5, 1);
  // Stains and peeling paint, never the same twice across rooms.
  for (let i = 0; i < 10; i++) {
    glow(ctx, rng.range(20, W - 20), rng.range(70, 380), rng.range(24, 70), C.stain, rng.range(0.2, 0.4),
      rng.range(0.6, 1.6), rng.range(0.8, 2.2));
  }
  for (let i = 0; i < 7; i++) {
    const x = rng.range(30, W - 30);
    const y = rng.range(80, 290);
    const s = rng.range(8, 22);
    const pts = [];
    for (let a = 0; a < 7; a++) {
      const ang = (a / 7) * Math.PI * 2;
      const r = s * rng.range(0.55, 1.1);
      pts.push(x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.7);
    }
    // Soft-edged: a faint plaster fill with a shadow just under it.
    ctx.save();
    ctx.translate(0, 1.5);
    poly(ctx, C.stain, pts, 0.22);
    ctx.restore();
    poly(ctx, C.plaster, pts, 0.14);
  }
  // Wainscot in the lower third, a rail, and panel seams.
  vGrad(ctx, 0, 300, W, 120, [[0, shade(C.wainscot, 1.15), 0.92], [1, C.wainscot, 0.95]]);
  fillRect(ctx, C.rail, 0, 296, W, 5);
  fillRect(ctx, shade(C.rail, 1.4), 0, 296, W, 1, 0.6);
  for (let x = 60; x < W; x += 120) fillRect(ctx, C.stain, x, 302, 1, 114, 0.4);
  // Skirting.
  fillRect(ctx, C.skirting, 0, 418, W, 12);
  fillRect(ctx, shade(C.skirting, 1.6), 0, 418, W, 1, 0.7);
  // Ceiling shadow band.
  vGrad(ctx, 0, 0, W, 60, [[0, C.ceiling], [0.55, C.ceiling, 0.85], [1, C.ceiling, 0]]);
}

function floor(ctx, lampX) {
  const vx = 480;
  const vy = 240;
  const rows = [16, 22, 30, 42];
  const xAt = (xb, y) => vx + (xb - vx) * ((y - vy) / (H - vy));
  let y0 = F;
  rows.forEach((h, r) => {
    const y1 = y0 + h;
    for (let c = -8; c < 20; c++) {
      const xb0 = -380 + c * 90;
      const xb1 = xb0 + 90;
      poly(ctx, (r + c) % 2 === 0 ? C.floorA : C.floorB,
        [xAt(xb0, y0), y0, xAt(xb1, y0), y0, xAt(xb1, y1), y1, xAt(xb0, y1), y1]);
    }
    line(ctx, C.grout, 0.9, 1, 0, y0, W, y0);
    y0 = y1;
  });
  for (let c = -8; c < 21; c++) {
    const xb = -380 + c * 90;
    line(ctx, C.grout, 0.8, 1, xAt(xb, F), F, xAt(xb, H), H);
  }
  // Darker toward the wall, lighter near the light, a streak under the lamp.
  vGrad(ctx, 0, F, W, H - F, [[0, C.void, 0.55], [1, C.void, 0]]);
  glow(ctx, lampX, F + 20, 280, C.bulb, 0.06, 1.6, 0.45);
  glow(ctx, lampX, F + 55, 70, C.bulb, 0.09, 0.45, 1.6);
}

function tubeLight(ctx, x) {
  fillRRect(ctx, C.steelDark, x - 62, 42, 124, 8, 3);
  fillRRect(ctx, C.bulb, x - 56, 45, 112, 4, 2, 0.55);
  glow(ctx, x, 50, 120, C.bulb, 0.09, 1.3, 0.55);
}

function switchboard(ctx, x, y = 246) {
  fillRRect(ctx, shade(C.paper, 0.55), x - 14, y, 28, 40, 3);
  fillRRect(ctx, shade(C.paper, 0.75), x - 12, y + 2, 24, 36, 2);
  fillRRect(ctx, C.void, x - 8, y + 8, 6, 10, 1, 0.8);
  fillRRect(ctx, C.void, x + 2, y + 8, 6, 10, 1, 0.8);
  fillRect(ctx, shade(C.paper, 0.9), x - 7, y + 9, 4, 4);
  fillRect(ctx, shade(C.paper, 0.9), x + 3, y + 13, 4, 4);
}

// A box with a lighter top, a darker base and a warm rim on the lamp side.
function box(ctx, color, x, y, w, h, r, lampX, rimA = 0.3) {
  ctx.save();
  rrect(ctx, x, y, w, h, r);
  ctx.clip();
  vGrad(ctx, x, y, w, h, [[0, shade(color, 1.2)], [1, shade(color, 0.75)]]);
  rim(ctx, C.lamp, x, y, w, h, lampX > x + w / 2 ? 1 : -1, rimA);
  ctx.restore();
}

function door(ctx, x, lampX, { front = false, plain = false } = {}) {
  const w = 74;
  box(ctx, C.woodDark, x - 46, DOOR_TOP - 8, 92, F - DOOR_TOP + 8, 2, lampX, 0.2);
  box(ctx, front ? shade(C.wood, 0.85) : C.wood, x - w / 2, DOOR_TOP, w, F - DOOR_TOP, 1, lampX);
  if (!plain) {
    fillRRect(ctx, shade(C.wood, 0.78), x - 27, DOOR_TOP + 16, 54, 72, 3);
    fillRRect(ctx, shade(C.wood, 0.78), x - 27, DOOR_TOP + 100, 54, 80, 3);
    fillRect(ctx, shade(C.wood, 1.35), x - 27, DOOR_TOP + 16, 54, 1, 0.5);
    fillRect(ctx, shade(C.wood, 1.35), x - 27, DOOR_TOP + 100, 54, 1, 0.5);
  }
  fillRRect(ctx, shade(C.brass, 0.7), x + 22, 322, 8, 22, 2);
  circle(ctx, C.brass, x + 26, 332, 3);
  if (!front) return;
  // Deadbolt, chain, peephole and a withered marigold garland.
  fillRRect(ctx, C.brass, x + 18, 300, 14, 8, 2);
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = rgba(C.steel, 0.8);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x + 14 - i * 3.5, 296 + i * 3.4, 2.2, 1.6, 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  circle(ctx, C.void, x, 270, 2.5);
  circle(ctx, C.steel, x, 270, 1.2, 0.6);
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const gx = x - 44 + t * 88;
    const gy = DOOR_TOP - 4 + Math.sin(t * Math.PI) * 18;
    circle(ctx, i % 2 ? C.marigoldDry : shade(C.marigold, 0.55), gx, gy, 4.2);
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) circle(ctx, C.marigoldDry, x + s * 44, DOOR_TOP + 2 + i * 9, 3.6);
  }
}

// A barred window onto the night (glow and headlight sweeps are in RoomDecor).
function windowFrame(ctx, x, top, w, h, lampX, { curtains = false } = {}) {
  const l = x - w / 2;
  box(ctx, C.woodDark, l - 8, top - 8, w + 16, h + 16, 2, lampX, 0.2);
  vGrad(ctx, l, top, w, h, [[0, C.night], [1, C.nightGlow]]);
  // Buildings across the lane and a far streetlight.
  fillRect(ctx, shade(C.night, 0.6), l, top + h * 0.45, w * 0.45, h * 0.55);
  fillRect(ctx, shade(C.night, 0.7), l + w * 0.55, top + h * 0.35, w * 0.45, h * 0.65);
  fillRect(ctx, C.street, l + w * 0.68, top + h * 0.5, 4, 5, 0.6);
  glow(ctx, l + w * 0.25, top + h * 0.28, 22, C.street, 0.45);
  for (let i = 1; i < 5; i++) fillRect(ctx, C.steelDark, l + (w * i) / 5 - 1.5, top, 3, h);
  fillRect(ctx, C.steelDark, l, top + h * 0.5 - 1.5, w, 3);
  fillRect(ctx, shade(C.woodDark, 1.3), l - 10, top + h + 6, w + 20, 6);
  if (curtains) {
    for (const s of [-1, 1]) {
      const cx = s < 0 ? l - 22 : l + w + 4;
      vGrad(ctx, cx, top - 14, 18, h + 40, [[0, C.fabric], [1, C.fabricDark]]);
      for (let i = 0; i < 3; i++) fillRect(ctx, C.fabricDark, cx + 4 + i * 5, top - 14, 1, h + 40, 0.6);
    }
    fillRect(ctx, C.brass, l - 26, top - 16, w + 52, 3);
  }
}

// --- rooms -------------------------------------------------------------------

function hall(ctx, rng) {
  const L = ROOM_LAMP_X.HALL;
  wall(ctx, rng, L);
  tubeLight(ctx, L);
  switchboard(ctx, 478);
  door(ctx, 130, L);
  door(ctx, 420, L);
  door(ctx, 700, L);
  door(ctx, 880, L, { front: true });

  // Umbrella stand with Nani's black umbrella and its paper tag.
  box(ctx, C.steelDark, 214, 378, 32, 52, 4, L);
  ellipse(ctx, C.steel, 230, 379, 16, 4, 0.7);
  poly(ctx, C.hair, [224, 382, 236, 382, 233, 326, 228, 326]);
  ctx.strokeStyle = rgba(C.hair, 1);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(236, 322, 7, Math.PI, Math.PI * 1.95);
  ctx.stroke();
  fillRect(ctx, C.paper, 238, 334, 10, 7, 0.85);
  line(ctx, C.paperDim, 0.8, 1, 233, 330, 239, 335);

  // Wall clock stopped at 11:42.
  circle(ctx, C.woodDark, 330, 292, 27);
  circle(ctx, C.paper, 330, 292, 22, 0.92);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    line(ctx, C.hair, 0.8, i % 3 ? 1 : 2, 330 + Math.sin(a) * 17, 292 - Math.cos(a) * 17,
      330 + Math.sin(a) * 20, 292 - Math.cos(a) * 20);
  }
  const hourA = ((11 + 42 / 60) / 12) * Math.PI * 2;
  const minA = (42 / 60) * Math.PI * 2;
  line(ctx, C.hair, 1, 3, 330, 292, 330 + Math.sin(hourA) * 11, 292 - Math.cos(hourA) * 11);
  line(ctx, C.hair, 1, 2, 330, 292, 330 + Math.sin(minA) * 17, 292 - Math.cos(minA) * 17);
  circle(ctx, C.redPencil, 330, 292, 2);

  // Low table with the steel cup of chai.
  box(ctx, C.wood, 472, 368, 96, 9, 2, L);
  fillRect(ctx, C.woodDark, 478, 377, 5, 53);
  fillRect(ctx, C.woodDark, 557, 377, 5, 53);
  fillRect(ctx, shade(C.woodDark, 0.8), 478, 408, 84, 4);
  poly(ctx, C.steel, [512, 352, 528, 352, 526, 368, 514, 368]);
  hGrad(ctx, 514, 353, 6, 14, [[0, C.glassHi, 0], [1, C.glassHi, 0.35]]);
  ellipse(ctx, shade(C.steel, 1.2), 520, 352, 8, 2);

  // Coat hooks with Nani's grey coat.
  box(ctx, C.wood, 564, 258, 74, 6, 2, L);
  for (const hx of [578, 600, 622]) circle(ctx, C.brass, hx, 268, 2.5);
  const coat = shade(C.steel, 0.52);
  poly(ctx, coat, [586, 270, 614, 270, 632, 300, 636, 404, 566, 404, 568, 300]);
  poly(ctx, shade(coat, 0.8), [572, 300, 580, 296, 576, 380, 566, 380]);
  poly(ctx, shade(coat, 0.8), [628, 300, 620, 296, 624, 380, 634, 380]);
  poly(ctx, shade(coat, 1.25), [592, 270, 600, 290, 608, 270]);
  rim(ctx, C.lamp, 566, 270, 70, 134, -1, 0.25);
  for (let i = 0; i < 3; i++) circle(ctx, shade(coat, 0.6), 600, 310 + i * 24, 2);

  // Shoe rack with her chappals.
  box(ctx, C.woodDark, 752, 398, 76, 32, 2, L);
  for (let i = 1; i < 4; i++) fillRect(ctx, C.void, 752, 398 + i * 8, 76, 1, 0.5);
  for (const cx of [778, 802]) {
    ellipse(ctx, C.clay, cx, 394, 10, 3.5);
    line(ctx, shade(C.clay, 0.6), 1, 2, cx - 4, 392, cx + 3, 395);
  }
}

function living(ctx, rng) {
  const L = ROOM_LAMP_X.LIVING;
  wall(ctx, rng, L);
  tubeLight(ctx, L);
  switchboard(ctx, 830);
  // Curtain rod (the curtain itself sways in RoomDecor).
  fillRect(ctx, C.brass, 12, 62, 120, 3);
  circle(ctx, C.brass, 12, 63, 4);
  circle(ctx, C.brass, 132, 63, 4);

  // Old radio on a shelf (its dial glows in RoomDecor).
  fillRect(ctx, C.woodDark, 144, 346, 4, 14);
  fillRect(ctx, C.woodDark, 192, 346, 4, 14);
  box(ctx, C.wood, 128, 342, 84, 6, 2, L);
  box(ctx, C.woodLight, 138, 298, 64, 44, 6, L);
  for (let i = 0; i < 6; i++) fillRect(ctx, shade(C.woodDark, 0.8), 144, 306 + i * 5, 22, 2);
  fillRRect(ctx, shade(C.dialAmber, 0.25), 172, 306, 24, 12, 2);
  circle(ctx, C.woodDark, 178, 330, 4);
  circle(ctx, C.woodDark, 192, 330, 4);

  windowFrame(ctx, 270, 172, 84, 122, L);

  // Grocer's calendar with the number circled twice in red.
  circle(ctx, C.steel, 360, 222, 2);
  box(ctx, C.paper, 335, 228, 50, 76, 2, L, 0.15);
  fillRect(ctx, shade(C.marigold, 0.8), 335, 228, 50, 22);
  for (let i = 0; i < 5; i++) circle(ctx, C.marigold, 341 + i * 10, 239, 3.5);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) fillRect(ctx, C.paperDim, 339 + c * 9, 256 + r * 11, 6, 6, 0.7);
  ctx.strokeStyle = rgba(C.redPencil, 0.9);
  ctx.lineWidth = 1.6;
  for (const rr of [6, 7.5]) {
    ctx.beginPath();
    ctx.ellipse(366, 270, rr + 2, rr, 0.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Shelf with the garlanded photo of Nani; the diya flame is in RoomDecor.
  box(ctx, C.wood, 412, 204, 76, 6, 2, L);
  box(ctx, C.woodDark, 428, 142, 44, 58, 2, L);
  vGrad(ctx, 432, 146, 36, 50, [[0, shade(C.paperDim, 0.75)], [1, shade(C.paperDim, 0.5)]]);
  circle(ctx, shade(C.paperDim, 0.35), 450, 164, 8);
  poly(ctx, shade(C.paperDim, 0.35), [436, 196, 440, 178, 460, 178, 464, 196]);
  ellipse(ctx, shade(C.saree, 0.6), 450, 172, 10, 4, 0.5);
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    circle(ctx, i % 2 ? C.marigold : shade(C.marigold, 0.75), 450 + Math.cos(a) * 26, 166 + Math.sin(a) * 30, 3.4);
  }
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) circle(ctx, C.marigold, 450 + s * 26, 168 + i * 8, 3.2);
  ellipse(ctx, C.clay, 476, 200, 7, 3.5);

  // Glass coffee table with the ashtray.
  fillRect(ctx, C.steelDark, 398, 380, 3, 50);
  fillRect(ctx, C.steelDark, 499, 380, 3, 50);
  poly(ctx, C.glass, [392, 376, 508, 376, 504, 382, 396, 382], 0.4);
  line(ctx, C.glassHi, 0.35, 1, 394, 376, 506, 376);
  ellipse(ctx, C.glass, 452, 372, 12, 4, 0.55);
  ellipse(ctx, C.void, 452, 371, 7, 2, 0.5);
  line(ctx, C.steel, 0.7, 1, 448, 371, 454, 370);

  // TV on a doily, on a low cabinet (the standby LED is in RoomDecor).
  box(ctx, C.woodDark, 486, 372, 108, 58, 3, L);
  fillRect(ctx, C.void, 539, 378, 1, 46, 0.6);
  for (let i = 0; i < 11; i++) {
    ctx.fillStyle = rgba(C.paper, 0.7);
    ctx.beginPath();
    ctx.arc(492 + i * 9, 372, 4.5, 0, Math.PI);
    ctx.fill();
  }
  fillRect(ctx, C.paper, 488, 369, 104, 3, 0.7);
  box(ctx, C.bezel, 494, 304, 92, 66, 5, L, 0.2);
  vGrad(ctx, 500, 310, 80, 50, [[0, shade(C.nightGlow, 0.35)], [1, C.void]]);
  line(ctx, C.glassHi, 0.08, 6, 506, 318, 530, 314);

  // Side table with the drawer.
  box(ctx, C.wood, 604, 368, 52, 62, 3, L);
  box(ctx, C.woodLight, 608, 376, 44, 16, 2, L);
  circle(ctx, C.brass, 630, 384, 2.5);

  // Sofa with cushions (hide spot).
  box(ctx, C.fabric, 664, 334, 136, 52, 10, L);
  box(ctx, shade(C.fabric, 0.9), 658, 378, 150, 30, 6, L);
  box(ctx, C.fabricDark, 648, 348, 22, 64, 8, L);
  box(ctx, C.fabricDark, 794, 348, 22, 64, 8, L);
  box(ctx, shade(C.fabric, 1.25), 676, 346, 50, 34, 8, L);
  box(ctx, shade(C.marigold, 0.55), 734, 348, 46, 32, 8, L);
  fillRect(ctx, C.woodDark, 664, 408, 6, 22);
  fillRect(ctx, C.woodDark, 796, 408, 6, 22);

  door(ctx, 880, L);
}

function kitchen(ctx, rng) {
  const L = ROOM_LAMP_X.KITCHEN;
  wall(ctx, rng, L);
  // Tiled backsplash behind the counter.
  for (let y = 250; y < 358; y += 18) {
    for (let x = 130; x < 610; x += 18) {
      fillRect(ctx, shade(C.tile, rng.range(0.85, 1.15)), x, y, 17, 17, 0.9);
    }
  }
  tubeLight(ctx, L);
  door(ctx, 70, L);
  switchboard(ctx, 140, 214);

  windowFrame(ctx, 190, 176, 78, 112, L);

  // Shelf with the recipe notebook.
  box(ctx, C.wood, 260, 300, 80, 6, 2, L);
  box(ctx, C.clay, 286, 276, 28, 24, 2, L);
  fillRect(ctx, C.paper, 288, 278, 24, 2, 0.5);

  // Counter, cabinets and the drawer row.
  box(ctx, shade(C.steelDark, 1.2), 126, 356, 488, 8, 2, L);
  box(ctx, C.wood, 130, 364, 480, 66, 2, L);
  for (let x = 210; x < 610; x += 80) fillRect(ctx, C.woodDark, x, 366, 2, 62);
  box(ctx, C.woodLight, 512, 368, 56, 20, 2, L);
  circle(ctx, C.brass, 540, 378, 2.5);

  // Gas stove with the pressure cooker and a kettle (pilot in RoomDecor).
  box(ctx, C.steelDark, 376, 340, 92, 16, 3, L);
  ellipse(ctx, C.void, 400, 341, 14, 3);
  ellipse(ctx, C.void, 444, 341, 14, 3);
  for (const kx of [392, 410, 432, 452]) circle(ctx, C.void, kx, 350, 2.5);
  box(ctx, C.steel, 382, 302, 38, 38, 8, L);
  ellipse(ctx, shade(C.steel, 1.25), 401, 302, 19, 4);
  fillRect(ctx, C.hair, 396, 293, 10, 8);
  fillRect(ctx, C.hair, 356, 300, 30, 4);
  ellipse(ctx, shade(C.steel, 0.9), 444, 324, 16, 15);
  ellipse(ctx, shade(C.steel, 1.3), 440, 318, 6, 5, 0.4);
  line(ctx, shade(C.steel, 0.8), 1, 4, 458, 320, 470, 310);
  ctx.strokeStyle = rgba(C.hair, 1);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(444, 306, 9, Math.PI, 0);
  ctx.stroke();

  // Steel racks with plates and ladles.
  for (const ry of [212, 252]) {
    fillRect(ctx, C.steel, 494, ry, 130, 3);
    for (let i = 0; i < 6; i++) ellipse(ctx, shade(C.steel, rng.range(0.8, 1.2)), 506 + i * 20, ry - 12, 4, 13);
  }
  for (let i = 0; i < 4; i++) {
    line(ctx, C.steel, 0.9, 2, 510 + i * 30, 256, 510 + i * 30, 284);
    circle(ctx, C.steel, 510 + i * 30, 288, 5);
  }

  // Steel locker with its dial.
  box(ctx, C.steel, 612, 282, 76, 148, 3, L);
  fillRect(ctx, shade(C.steel, 0.7), 649, 286, 1, 140);
  circle(ctx, shade(C.steel, 0.6), 668, 340, 10);
  circle(ctx, shade(C.steel, 1.2), 668, 340, 7);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    line(ctx, C.void, 0.6, 1, 668 + Math.sin(a) * 7, 340 - Math.cos(a) * 7, 668 + Math.sin(a) * 9, 340 - Math.cos(a) * 9);
  }
  fillRRect(ctx, shade(C.steel, 0.6), 640, 360, 6, 22, 2);

  // Pantry door (hide spot), slightly ajar.
  door(ctx, 780, L, { plain: true });
  fillRect(ctx, C.void, 742, DOOR_TOP + 4, 3, F - DOOR_TOP - 4, 0.8);
}

function bedroom(ctx, rng) {
  const L = ROOM_LAMP_X.BEDROOM;
  wall(ctx, rng, L);
  tubeLight(ctx, L);
  door(ctx, 70, L);
  switchboard(ctx, 125);
  windowFrame(ctx, 160, 170, 78, 118, L, { curtains: true });

  // Small framed photo: a child and Nani.
  box(ctx, C.woodDark, 284, 186, 34, 42, 2, L);
  fillRect(ctx, shade(C.paperDim, 0.6), 288, 190, 26, 34);
  circle(ctx, shade(C.paperDim, 0.35), 296, 202, 4);
  circle(ctx, shade(C.paperDim, 0.35), 306, 205, 3);
  fillRect(ctx, shade(C.paperDim, 0.35), 292, 208, 8, 14);
  fillRect(ctx, shade(C.paperDim, 0.35), 303, 210, 6, 12);

  // Desk with newspaper cuttings pinned above.
  for (let i = 0; i < 6; i++) {
    const px = 214 + (i % 3) * 26 + rng.range(-3, 3);
    const py = 290 + Math.floor(i / 3) * 26 + rng.range(-3, 3);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rng.range(-0.12, 0.12));
    fillRect(ctx, C.paperDim, 0, 0, 22, 20, 0.85);
    for (let l = 0; l < 4; l++) fillRect(ctx, C.steelDark, 2, 4 + l * 4, 18, 1, 0.6);
    circle(ctx, C.redPencil, 11, 2, 1.5);
    ctx.restore();
  }
  box(ctx, C.wood, 210, 360, 84, 8, 2, L);
  fillRect(ctx, C.woodDark, 214, 368, 5, 62);
  fillRect(ctx, C.woodDark, 285, 368, 5, 62);
  fillRect(ctx, C.paper, 230, 355, 26, 5, 0.6);

  // Nightstand with a lamp (glow in RoomDecor) and the folded note.
  box(ctx, C.woodDark, 316, 362, 50, 68, 3, L);
  fillRect(ctx, C.void, 318, 388, 46, 1, 0.5);
  fillRect(ctx, C.brass, 337, 342, 8, 20);
  poly(ctx, shade(C.paper, 0.9), [325, 342, 357, 342, 351, 318, 331, 318]);
  poly(ctx, C.paper, [346, 358, 360, 358, 358, 362, 344, 362]);

  // Bed with a hospital-corner sheet; the gap underneath is a hide spot.
  box(ctx, C.wood, 372, 300, 14, 130, 3, L);
  box(ctx, C.wood, 568, 336, 10, 94, 3, L);
  fillRect(ctx, C.void, 382, 410, 186, 20, 0.85);
  box(ctx, C.sheet, 380, 358, 192, 34, 4, L, 0.2);
  vGrad(ctx, 380, 392, 192, 20, [[0, shade(C.sheet, 0.85)], [1, shade(C.sheet, 0.65)]]);
  poly(ctx, shade(C.sheet, 0.6), [548, 392, 572, 392, 572, 412]);
  line(ctx, shade(C.sheet, 0.6), 0.6, 1, 384, 392, 548, 392);
  box(ctx, C.paper, 388, 344, 54, 18, 7, L, 0.2);

  // Dresser with bangles and a small mirror.
  box(ctx, C.wood, 588, 352, 66, 78, 3, L);
  fillRect(ctx, C.woodDark, 590, 378, 62, 1);
  fillRect(ctx, C.woodDark, 590, 404, 62, 1);
  circle(ctx, C.brass, 621, 366, 2);
  circle(ctx, C.brass, 621, 392, 2);
  fillRect(ctx, C.woodDark, 618, 330, 6, 22);
  ellipse(ctx, C.woodDark, 621, 312, 18, 22);
  ellipse(ctx, C.glass, 621, 312, 14, 18, 0.35);
  line(ctx, C.glassHi, 0.25, 2, 612, 302, 618, 296);
  ctx.lineWidth = 2;
  [[600, C.marigold], [610, C.redPencil], [638, C.brass], [646, C.cold]].forEach(([bx, col]) => {
    ctx.strokeStyle = rgba(col, 0.85);
    ctx.beginPath();
    ctx.ellipse(bx, 348, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Wardrobe (hide spot).
  box(ctx, C.wood, 736, 208, 108, 222, 3, L);
  fillRect(ctx, C.woodDark, 730, 204, 120, 8);
  fillRect(ctx, C.woodDark, 789, 214, 2, 214);
  fillRRect(ctx, C.brass, 780, 310, 4, 16, 2);
  fillRRect(ctx, C.brass, 796, 310, 4, 16, 2);
}

const ROOMS_DRAW = { HALL: hall, LIVING: living, KITCHEN: kitchen, BEDROOM: bedroom };
export const ROOM_BG = { HALL: 'bg_hall', LIVING: 'bg_living', KITCHEN: 'bg_kitchen', BEDROOM: 'bg_bedroom' };

// Builds any background that does not already exist as a PNG.
export function generateRooms(scene) {
  const made = [];
  Object.keys(ROOMS_DRAW).forEach((id, i) => {
    const rng = createRng(ART.seed + i * 7919);
    const ok = makeTexture(scene, ROOM_BG[id], W, H, (ctx) => {
      ROOMS_DRAW[id](ctx, rng);
      floor(ctx, ROOM_LAMP_X[id]);
    });
    if (ok) made.push(ROOM_BG[id]);
  });
  return made;
}
