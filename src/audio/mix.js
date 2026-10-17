// Pure mixing maths for AudioDirector (docs/07 section 8). No Phaser.

import { BALANCE } from '../config/balance.js';
import { clamp, lerp } from '../utils/math.js';

const A = BALANCE.audio;
const FS = BALANCE.footsteps;
const PR = BALANCE.presence;
const REFERENCE_SPEED = 110;  // the footstep interval is given at this speed

export function dbToGain(db) {
  return Math.pow(10, db / 20);
}

// 0.55 s at speed 110, scaled inversely with speed.
export function stepInterval(speed) {
  return FS.stepIntervalAt110 * (REFERENCE_SPEED / Math.max(1, speed));
}

// Hollow whispers: -18 dB at Presence 60, rising to -8 dB at 100.
export function whisperGain(presence) {
  const t = clamp((presence - PR.thresholds.whisper) / (PR.max - PR.thresholds.whisper), 0, 1);
  return dbToGain(lerp(A.whisperDbAt60, A.whisperDbAt100, t));
}

export function heartbeatGain(noise) {
  return clamp(noise / BALANCE.noise.max, 0, 1) * A.heartbeatMax;
}

// Warm room tone crossfades to the cold one as Presence rises.
export function ambienceGains(presence, ducked) {
  const base = dbToGain(A.ambienceDb) * (ducked ? A.duckAmbience : 1);
  const t = clamp(presence / PR.max, 0, 1);
  return { flat: base * (1 - t), cold: base * t };
}

// The dread drone enters at Act 2 and rises with each act.
export function dreadGain(act, ducked) {
  if (act < 2) return 0;
  return dbToGain(A.musicDb) * (act / 5) * (ducked ? A.duckMusic : 1);
}

export function stingerGain(reduceFlash) {
  return dbToGain(reduceFlash ? A.stingerDbReduced : A.stingerDb);
}

// Smoothly move a value toward a target over fadeSec.
export function approach(current, target, dt) {
  const step = dt / Math.max(0.001, A.fadeSec);
  if (Math.abs(target - current) <= step) return target;
  return current + Math.sign(target - current) * step;
}

// The asset key for a bark line (docs/07 section 8.1 naming).
const BARK_KEYS = { entering: 'vik_entering', patrol: 'vik_p', investigate: 'vik_i', search: 'vik_s',
  chase: 'vik_c', caught: 'vik_caught', hunt: 'vik_h', away: 'vik_a' };
export function barkKey(set, index) {
  const base = BARK_KEYS[set];
  if (set === 'entering' || set === 'caught') return base;
  return base + (index + 1);
}

// 'H3' -> 'hol_3'
export function whisperKey(id) {
  return 'hol_' + id.slice(1);
}
