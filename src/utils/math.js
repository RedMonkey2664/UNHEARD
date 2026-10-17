// Small math helpers shared by systems and UI.

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Rounds to one decimal so volume steps of 0.1 do not drift (0.30000000004).
export function round1(v) {
  return Math.round(v * 10) / 10;
}
