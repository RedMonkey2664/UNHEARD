// Canvas textures for the 3D view: plaster walls, floor tiles, the calendar,
// the notebook page, TV static and text labels. Code-drawn, like the 2D art.

import * as THREE from 'three';
import { COLORS } from '../config/constants.js';
import { createRng } from '../utils/rng.js';

const hex = (c) => '#' + c.toString(16).padStart(6, '0');

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(c, repeat) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 4;
  return t;
}

// Stained plaster over a darker wainscot band, per room.
export function wallTexture(seed, base) {
  const c = canvas(512, 256);
  const g = c.getContext('2d');
  const rng = createRng(seed);
  g.fillStyle = hex(base);
  g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 40; i++) {
    const x = rng.range(0, 512);
    const y = rng.range(0, 256);
    const r = rng.range(10, 60);
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(5,10,11,${rng.range(0.15, 0.4)})`);
    grd.addColorStop(1, 'rgba(5,10,11,0)');
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Wainscot band and rail along the bottom third.
  g.fillStyle = hex(COLORS.wainscot);
  g.fillRect(0, 176, 512, 80);
  g.fillStyle = hex(COLORS.rail);
  g.fillRect(0, 172, 512, 5);
  for (let i = 0; i < 3000; i++) {
    g.fillStyle = `rgba(255,255,255,${rng.range(0, 0.03)})`;
    g.fillRect(rng.range(0, 512), rng.range(0, 256), 1, 1);
  }
  return toTexture(c, [2, 1]);
}

// Old chequered stone floor.
export function floorTexture() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  const rng = createRng(77);
  const n = 4;
  const s = 256 / n;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      g.fillStyle = hex((i + j) % 2 ? COLORS.floorA : COLORS.floorB);
      g.fillRect(i * s, j * s, s, s);
    }
  }
  g.strokeStyle = hex(COLORS.grout);
  g.lineWidth = 2;
  for (let i = 0; i <= n; i++) {
    g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 256); g.stroke();
    g.beginPath(); g.moveTo(0, i * s); g.lineTo(256, i * s); g.stroke();
  }
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(0,0,0,${rng.range(0, 0.25)})`;
    g.fillRect(rng.range(0, 256), rng.range(0, 256), 2, 2);
  }
  return toTexture(c, [8, 3]);
}

// The grocer's calendar: a marigold header and 94.3 circled twice in red.
export function calendarTexture() {
  const c = canvas(256, 352);
  const g = c.getContext('2d');
  g.fillStyle = hex(COLORS.paper);
  g.fillRect(0, 0, 256, 352);
  g.fillStyle = hex(COLORS.marigold);
  g.fillRect(0, 0, 256, 90);
  g.fillStyle = '#3a2410';
  g.font = 'bold 26px serif';
  g.textAlign = 'center';
  g.fillText('SHARMA GENERAL STORE', 128, 54);
  g.fillStyle = '#2b2b2b';
  g.font = '18px sans-serif';
  for (let r = 0; r < 5; r++) {
    for (let k = 0; k < 7; k++) {
      const d = r * 7 + k + 1;
      if (d <= 31) g.fillText(String(d), 22 + k * 35, 130 + r * 34);
    }
  }
  g.font = 'bold 30px sans-serif';
  g.fillStyle = '#222';
  g.fillText('94.3', 128, 320);
  g.strokeStyle = hex(COLORS.redPencil);
  g.lineWidth = 3;
  for (const r of [44, 50]) {
    g.beginPath();
    g.ellipse(128, 310, r + 14, r - 18, 0.05, 0, Math.PI * 2);
    g.stroke();
  }
  return toTexture(c);
}

// The open recipe notebook on the counter.
export function notebookTexture() {
  const c = canvas(256, 180);
  const g = c.getContext('2d');
  g.fillStyle = hex(COLORS.paper);
  g.fillRect(0, 0, 256, 180);
  g.strokeStyle = 'rgba(70,90,140,0.35)';
  for (let y = 24; y < 180; y += 18) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
  }
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.fillRect(126, 0, 4, 180);
  g.fillStyle = '#2a2a3a';
  g.font = 'italic 15px serif';
  g.fillText('Dal - salt by feel', 10, 40);
  g.fillText('4 whistles.', 10, 76);
  g.fillText('Gas off.', 10, 94);
  return toTexture(c);
}

// TV static, redrawn a few times a second while the TV is on.
export function createStatic() {
  const c = canvas(128, 80);
  const g = c.getContext('2d');
  const tex = toTexture(c);
  const img = g.createImageData(128, 80);
  return {
    texture: tex,
    draw(face) {
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 200) | 0;
        d[i] = v * 0.8; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      if (face) {
        // The Hollow's face in the static (JS3).
        g.fillStyle = 'rgba(230,224,210,0.85)';
        g.beginPath(); g.ellipse(64, 40, 18, 25, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#030304';
        g.beginPath(); g.ellipse(57, 35, 4, 6, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(71, 35, 4, 6, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(64, 52, 5, 7, 0, 0, Math.PI * 2); g.fill();
      }
      tex.needsUpdate = true;
    }
  };
}

// A soft round glow for sprites (glints, steam, the phone hand light).
export function glowTexture() {
  const c = canvas(64, 64);
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return toTexture(c);
}

// A text label sprite (always readable: not lit, drawn on top).
export function labelSprite(text) {
  const c = canvas(512, 96);
  const g = c.getContext('2d');
  g.font = '600 40px Inter, system-ui, sans-serif';
  const w = Math.min(500, g.measureText(text).width + 40);
  g.fillStyle = 'rgba(5,7,8,0.72)';
  const x0 = 256 - w / 2;
  g.beginPath();
  g.roundRect(x0, 14, w, 66, 14);
  g.fill();
  g.fillStyle = hex(COLORS.cream);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 256, 48);
  const mat = new THREE.SpriteMaterial({ map: toTexture(c), depthTest: false, transparent: true, opacity: 0 });
  const s = new THREE.Sprite(mat);
  s.scale.set(1.0, 0.1875, 1);
  s.renderOrder = 10;
  return s;
}
