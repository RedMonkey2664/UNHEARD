// Small Canvas 2D helpers for the code-drawn art (docs/10). Used only at boot
// to build textures; never per frame.

export function rgba(color, a = 1) {
  return `rgba(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255},${a})`;
}

// Multiplies a colour's channels (f < 1 darker, f > 1 lighter).
export function shade(color, f) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return (c((color >> 16) & 255) << 16) | (c((color >> 8) & 255) << 8) | c(color & 255);
}

export function mix(a, b, t) {
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

export function rrect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function fillRect(ctx, color, x, y, w, h, a = 1) {
  ctx.fillStyle = rgba(color, a);
  ctx.fillRect(x, y, w, h);
}

export function fillRRect(ctx, color, x, y, w, h, r, a = 1) {
  ctx.fillStyle = rgba(color, a);
  rrect(ctx, x, y, w, h, r);
  ctx.fill();
}

export function vGrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  for (const [t, c, a = 1] of stops) g.addColorStop(t, rgba(c, a));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

export function hGrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  for (const [t, c, a = 1] of stops) g.addColorStop(t, rgba(c, a));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// Soft radial blob (glows, stains, light pools).
export function glow(ctx, x, y, r, color, a, sx = 1, sy = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

export function line(ctx, color, a, w, x1, y1, x2, y2) {
  ctx.strokeStyle = rgba(color, a);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function circle(ctx, color, x, y, r, a = 1) {
  ctx.fillStyle = rgba(color, a);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function ellipse(ctx, color, x, y, rx, ry, a = 1) {
  ctx.fillStyle = rgba(color, a);
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function poly(ctx, color, pts, a = 1) {
  ctx.fillStyle = rgba(color, a);
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fill();
}

// A warm rim on one vertical edge of a box: the side nearest the lamp.
export function rim(ctx, color, x, y, w, h, side, a = 0.35) {
  const rw = Math.max(2, Math.min(6, w * 0.12));
  const rx = side > 0 ? x + w - rw : x;
  hGrad(ctx, rx, y, rw, h, side > 0 ? [[0, color, 0], [1, color, a]] : [[0, color, a], [1, color, 0]]);
}

// Creates a canvas texture; frames: [{ name, x, y, w, h }] are added after.
export function makeTexture(scene, key, w, h, draw, frames = []) {
  if (scene.textures.exists(key)) return false;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return false;
  const ctx = tex.getContext();
  draw(ctx, w, h);
  for (const f of frames) tex.add(f.name, 0, f.x, f.y, f.w, f.h);
  tex.refresh();
  return true;
}
