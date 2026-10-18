// Code-drawn characters (docs/10 section 5). Silhouette-led, 2 to 3 tones,
// facing right (flipped in the scene). Player and Vikram are sheets with
// named frames; Nani, the cup and the Hollow are single images.

import { COLORS as C } from '../../config/constants.js';
import { circle, ellipse, glow, hGrad, line, makeTexture, poly, rgba, shade } from './canvasKit.js';

export const PLAYER = { w: 56, h: 156, frames: ['idle', 'walk0', 'walk1', 'walk2', 'walk3',
  'sneak0', 'sneak1', 'sneak2', 'sneak3'] };
export const VIKRAM = { w: 64, h: 178, frames: ['idle', 'walk0', 'walk1', 'walk2', 'walk3',
  'search0', 'search1', 'chase0', 'chase1'] };

const STRIDE = [[-7, 7], [0, 0], [7, -7], [0, 0]];
const BOB = [0, -2, 0, -2];

function leg(ctx, color, hipX, hipY, footX, footY, w) {
  ctx.strokeStyle = rgba(color, 1);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(footX, footY);
  ctx.stroke();
}

// --- player: hoodie silhouette, phone glow in hand ---------------------------

function drawPlayer(ctx, ox, pose, phase) {
  const sneak = pose === 'sneak';
  const walking = pose !== 'idle';
  const [a, b] = walking ? STRIDE[phase] : [0, 0];
  const bob = walking ? BOB[phase] : 0;
  const h = PLAYER.h;
  const cx = ox + 28;
  const hipY = sneak ? h - 44 : h - 58;
  const top = (sneak ? 40 : 14) + bob;
  const lean = sneak ? 6 : 0;

  leg(ctx, shade(C.hoodie, 0.7), cx - 4, hipY + bob, cx - 4 + a, h - 3, 9);
  leg(ctx, shade(C.hoodie, 0.85), cx + 4, hipY + bob, cx + 4 + b, h - 3, 9);
  ellipse(ctx, C.void, cx - 4 + a + 2, h - 2, 6, 2.5);
  ellipse(ctx, C.void, cx + 4 + b + 2, h - 2, 6, 2.5);

  // Torso (hoodie) with a rim on the lit side.
  poly(ctx, C.hoodie, [cx - 13 + lean, top + 26, cx + 13 + lean, top + 26, cx + 15, hipY + 4 + bob,
    cx - 14, hipY + 4 + bob]);
  hGrad(ctx, cx + 8 + lean, top + 26, 6, hipY - top - 20, [[0, C.hoodieRim, 0], [1, C.hoodieRim, 0.6]]);
  // Hood and face shadow.
  circle(ctx, C.hoodie, cx + 2 + lean, top + 14, 12);
  ellipse(ctx, C.skinDark, cx + 8 + lean, top + 16, 5, 7);
  ellipse(ctx, C.hoodieRim, cx + 11 + lean, top + 10, 2, 5, 0.5);
  // Arm bent forward holding the phone: the small glow is in hand.
  poly(ctx, shade(C.hoodie, 0.85), [cx + 6 + lean, top + 30, cx + 12 + lean, top + 30,
    cx + 20 + lean, top + 56, cx + 15 + lean, top + 60]);
  glow(ctx, cx + 20 + lean, top + 56, 12, C.phoneGlow, 0.45);
  poly(ctx, C.phoneGlow, [cx + 17 + lean, top + 50, cx + 23 + lean, top + 50, cx + 23 + lean, top + 60,
    cx + 17 + lean, top + 60]);
}

// --- Vikram: taller, neat shirt, key-ring glint ------------------------------

function drawVikram(ctx, ox, pose, phase) {
  const h = VIKRAM.h;
  const cx = ox + 30;
  const chase = pose === 'chase';
  const walking = pose === 'walk' || chase;
  const stride = walking ? STRIDE[phase % 4] : [0, 0];
  const k = chase ? 1.5 : 1;
  const bob = walking ? BOB[phase % 4] : 0;
  const lean = chase ? 9 : 0;
  const hipY = h - 70;

  leg(ctx, shade(C.trousers, 0.8), cx - 5, hipY + bob, cx - 5 + stride[0] * k, h - 3, 10);
  leg(ctx, C.trousers, cx + 5, hipY + bob, cx + 5 + stride[1] * k, h - 3, 10);
  ellipse(ctx, C.void, cx - 3 + stride[0] * k, h - 2, 7, 2.5);
  ellipse(ctx, C.void, cx + 7 + stride[1] * k, h - 2, 7, 2.5);

  const top = 12 + bob;
  // Shirt torso with collar and placket.
  poly(ctx, C.shirt, [cx - 15 + lean, top + 30, cx + 15 + lean, top + 30, cx + 14, hipY + 6 + bob,
    cx - 14, hipY + 6 + bob]);
  hGrad(ctx, cx + 9 + lean, top + 30, 6, hipY - top - 24, [[0, C.cream, 0], [1, C.cream, 0.3]]);
  line(ctx, shade(C.shirt, 0.7), 1, 1, cx + 1 + lean * 0.6, top + 32, cx + 1, hipY + bob);
  poly(ctx, shade(C.shirt, 1.25), [cx - 6 + lean, top + 30, cx + lean, top + 38, cx + 6 + lean, top + 30]);
  // Belt and a key ring that glints.
  line(ctx, C.hair, 1, 3, cx - 14, hipY + 4 + bob, cx + 14, hipY + 4 + bob);
  ctx.strokeStyle = rgba(C.brass, 1);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx + 12, hipY + 12 + bob, 4, 0, Math.PI * 2);
  ctx.stroke();
  circle(ctx, C.glassHi, cx + 14, hipY + 10 + bob, 1.4, 0.9);

  // Arms: at sides (walk), on hips (search), reaching out (chase).
  const arm = shade(C.shirt, 0.85);
  if (chase) {
    poly(ctx, arm, [cx + 8 + lean, top + 34, cx + 14 + lean, top + 34, cx + 34, top + 58, cx + 30, top + 64]);
  } else if (pose === 'search') {
    poly(ctx, arm, [cx + 10, top + 34, cx + 16, top + 34, cx + 22, top + 60, cx + 14, hipY + bob]);
    poly(ctx, arm, [cx - 10, top + 34, cx - 16, top + 34, cx - 22, top + 60, cx - 14, hipY + bob]);
  } else {
    const sw = walking ? stride[0] * 0.6 : 0;
    poly(ctx, arm, [cx + 9, top + 34, cx + 15, top + 34, cx + 14 + sw, hipY + 8, cx + 9 + sw, hipY + 8]);
  }
  // Head: hair, ear, face toward his facing (search turns the head).
  const turn = pose === 'search' ? (phase === 0 ? -1 : 1) : 1;
  circle(ctx, C.skin, cx + 2 + lean, top + 16, 11);
  ctx.fillStyle = rgba(C.hair, 1);
  ctx.beginPath();
  ctx.arc(cx + 2 + lean, top + 13, 11.5, Math.PI * (turn > 0 ? 0.9 : 0.1), Math.PI * (turn > 0 ? 2.1 : 1.1), turn < 0);
  ctx.fill();
  ellipse(ctx, C.skinDark, cx + 2 + lean - turn * 5, top + 18, 3, 4);
  ellipse(ctx, shade(C.skin, 1.25), cx + 2 + lean + turn * 7, top + 18, 2, 4, 0.6);
}

// --- Nani: small figure, white saree, grey bun, steel cup --------------------

function drawNani(ctx, w, h) {
  const cx = w / 2;
  poly(ctx, C.saree, [cx - 6, 26, cx + 8, 26, cx + 16, h - 2, cx - 16, h - 2]);
  poly(ctx, C.sareeShade, [cx - 6, 30, cx + 2, 30, cx - 4, h - 2, cx - 16, h - 2]);
  for (let i = 0; i < 4; i++) line(ctx, C.sareeShade, 0.7, 1, cx + 2 + i * 3, 50 + i * 4, cx + 6 + i * 3, h - 4);
  // Pallu over the shoulder and head.
  poly(ctx, shade(C.saree, 0.95), [cx - 9, 10, cx + 9, 10, cx + 10, 40, cx - 2, 60, cx - 10, 34]);
  circle(ctx, C.skin, cx + 2, 16, 7);
  circle(ctx, C.greyHair, cx - 5, 12, 5);
  ellipse(ctx, C.greyHair, cx + 1, 10, 7, 4);
  // Holding the steel cup at the chest.
  poly(ctx, C.skin, [cx + 4, 44, cx + 12, 44, cx + 14, 52, cx + 6, 52]);
  poly(ctx, C.steel, [cx + 9, 40, cx + 17, 40, cx + 16, 50, cx + 10, 50]);
  // Soft warm rim on the right side.
  hGrad(ctx, cx + 6, 10, 10, h - 12, [[0, C.lamp, 0], [1, C.lamp, 0.35]]);
}

function drawCup(ctx, w, h) {
  poly(ctx, C.steel, [3, 4, w - 3, 4, w - 6, h - 1, 6, h - 1]);
  hGrad(ctx, 6, 5, 6, h - 7, [[0, C.glassHi, 0], [1, C.glassHi, 0.45]]);
  ellipse(ctx, shade(C.steel, 1.25), w / 2, 4, w / 2 - 3, 3);
  ellipse(ctx, C.lamp, w / 2, 4, w / 2 - 6, 1.6, 0.5);
}

// --- the Hollow: tall, thin, over-long arms, no face -------------------------

function drawHollow(ctx, w, h) {
  const cx = w / 2;
  leg(ctx, C.hollow, cx - 3, h * 0.55, cx - 6, h - 2, 5);
  leg(ctx, C.hollow, cx + 3, h * 0.55, cx + 5, h - 2, 5);
  poly(ctx, C.hollow, [cx - 8, 34, cx + 8, 34, cx + 5, h * 0.58, cx - 5, h * 0.58]);
  ellipse(ctx, C.hollow, cx, 20, 9, 13);
  // Arms that reach well past the knees.
  poly(ctx, C.hollow, [cx - 8, 38, cx - 5, 38, cx - 15, h * 0.82, cx - 19, h * 0.84]);
  poly(ctx, C.hollow, [cx + 8, 38, cx + 5, 38, cx + 17, h * 0.8, cx + 21, h * 0.83]);
  for (const s of [-1, 1]) {
    for (let f = 0; f < 3; f++) line(ctx, C.hollow, 1, 1.2, cx + s * 17, h * 0.83, cx + s * (16 + f * 2), h * 0.88);
  }
  ctx.strokeStyle = rgba(C.cold, 0.18);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, 20, 9.5, 13.5, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// Nani's face, slightly wrong: eyes too far apart, a smile a little late.
function drawHollowFace(ctx, w, h) {
  ellipse(ctx, C.hollowFace, w / 2, h / 2, w / 2 - 1, h / 2 - 1);
  ellipse(ctx, C.hollow, w / 2 - 9, h / 2 - 3, 2.6, 1.8);
  ellipse(ctx, C.hollow, w / 2 + 9.5, h / 2 - 2.5, 2.6, 1.8);
  ctx.strokeStyle = rgba(C.hollow, 0.8);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(w / 2 + 3, h / 2 + 7, 5, 0.15 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();
}

function sheet(scene, key, spec, draw) {
  const frames = spec.frames.map((name, i) => ({ name, x: i * spec.w, y: 0, w: spec.w, h: spec.h }));
  return makeTexture(scene, key, spec.w * spec.frames.length, spec.h, (ctx) => {
    spec.frames.forEach((name, i) => {
      const pose = name.replace(/\d/g, '');
      const phase = Number(name.replace(/\D/g, '') || 0);
      draw(ctx, i * spec.w, pose, phase);
    });
  }, frames);
}

export function generateCharacters(scene) {
  const made = [];
  if (sheet(scene, 'spr_player', PLAYER, drawPlayer)) made.push('spr_player');
  if (sheet(scene, 'spr_vikram', VIKRAM, drawVikram)) made.push('spr_vikram');
  if (makeTexture(scene, 'spr_nani_far', 44, 124, drawNani)) made.push('spr_nani_far');
  if (makeTexture(scene, 'spr_nani_cup', 24, 28, drawCup)) made.push('spr_nani_cup');
  if (makeTexture(scene, 'spr_hollow', 70, 232, drawHollow)) made.push('spr_hollow');
  if (makeTexture(scene, 'spr_hollow_face', 34, 40, drawHollowFace)) made.push('spr_hollow_face');
  return made;
}
