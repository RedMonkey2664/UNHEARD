// Generates the app icons in public/icons (run: node scripts/make-icons.mjs).
// Code-drawn in the game palette: a dark room, a cream listening ring and a
// small lamp. No dependencies: writes PNGs with node's zlib.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const VOID = [5, 7, 8];
const WALL = [31, 58, 58];
const CREAM = [243, 221, 177];
const LAMP = [242, 179, 90];

function crc32(b) {
  let crc = 0xffffffff;
  for (let n = 0; n < b.length; n++) {
    let c = (crc ^ b[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function png(size, pixel) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x / size, y / size);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// scale < 1 keeps the art inside the safe zone of maskable icons.
function icon(scale) {
  return (u, v) => {
    const dx = (u - 0.5) / scale;
    const dy = (v - 0.5) / scale;
    const d = Math.hypot(dx, dy);
    let c = mix(WALL, VOID, smooth(0.05, 0.75, Math.hypot(u - 0.5, v - 0.45)));
    // Warm glow around the lamp.
    c = mix(c, LAMP, 0.35 * (1 - smooth(0.0, 0.3, d)));
    // The listening ring, with a gap at the bottom like a cut call.
    const ring = 1 - smooth(0.018, 0.035, Math.abs(d - 0.3));
    const gap = Math.abs(Math.atan2(dx, dy)) < 0.42 ? 0 : 1;
    c = mix(c, CREAM, ring * gap);
    // The lamp: a small bright dot.
    c = mix(c, LAMP, 1 - smooth(0.05, 0.075, d));
    return c;
  };
}

const out = path.resolve('public', 'icons');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon-192.png'), png(192, icon(1)));
fs.writeFileSync(path.join(out, 'icon-512.png'), png(512, icon(1)));
fs.writeFileSync(path.join(out, 'icon-maskable-512.png'), png(512, icon(0.78)));
console.log('icons written to', out);
