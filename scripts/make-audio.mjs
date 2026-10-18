// Generates the game's sound effects, ambience, music and voicemail beds as
// WAV files in public/assets/audio (run: node scripts/make-audio.mjs).
// Synthesised in code, deterministic (seeded), no dependencies. Spoken lines
// (Nani, Vikram, Mom, police, the operator, "later") are NOT generated: they
// stay as subtitles until real recordings are dropped in with the same keys.
import fs from 'node:fs';
import path from 'node:path';

const HI = 22050;     // effects, ambience, music
const LINE = 8000;    // phone-line audio: voicemail beds, previews, whispers

// --- tiny DSP kit -----------------------------------------------------------

let seed = 0x1a2b3c;
function rnd() {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const white = () => rnd() * 2 - 1;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const make = (sec, sr) => new Float32Array(Math.max(1, Math.round(sec * sr)));

function biquad(type, f, q, sr) {
  const w = TAU * f / sr;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  let b0, b1, b2;
  if (type === 'lp') { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0; }
  else if (type === 'hp') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0; }
  else { b0 = alpha; b1 = 0; b2 = -alpha; }
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

function filter(buf, type, f, q, sr) {
  const fl = biquad(type, f, q, sr);
  for (let i = 0; i < buf.length; i++) buf[i] = fl(buf[i]);
  return buf;
}

function pinkNoise() {
  let b0 = 0, b1 = 0, b2 = 0;
  return () => {
    const w = white();
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    return (b0 + b1 + b2 + w * 0.1848) * 0.2;
  };
}

// Adds fn(t, i) * gain into buf from start (seconds) for dur seconds.
function add(buf, sr, start, dur, fn, gain = 1) {
  const s = Math.round(start * sr);
  const n = Math.round(dur * sr);
  for (let i = 0; i < n && s + i < buf.length; i++) {
    if (s + i >= 0) buf[s + i] += fn(i / sr, i) * gain;
  }
  return buf;
}

const decay = (t, k) => Math.exp(-t * k);
const attackDecay = (t, a, k) => (t < a ? t / a : Math.exp(-(t - a) * k));
const swell = (t, dur) => Math.sin(Math.PI * clamp(t / dur, 0, 1));

// A filtered noise burst (clicks, thuds, rustles).
function burst(buf, sr, start, dur, { type = 'bp', f = 1000, q = 1, k = 30, gain = 1, a = 0.002 } = {}) {
  const fl = biquad(type, f, q, sr);
  return add(buf, sr, start, dur, (t) => fl(white()) * attackDecay(t, a, k), gain);
}

// A low body thump (footsteps, doors, falls).
function thump(buf, sr, start, { f0 = 90, f1 = 45, k = 18, dur = 0.35, gain = 1 } = {}) {
  let ph = 0;
  return add(buf, sr, start, dur, (t) => {
    const f = f1 + (f0 - f1) * Math.exp(-t * 12);
    ph += TAU * f / sr;
    return Math.sin(ph) * decay(t, k);
  }, gain);
}

// A metallic ping (keys, steel, the locker).
function ping(buf, sr, start, f, { k = 25, gain = 0.4 } = {}) {
  return add(buf, sr, start, 0.4, (t) =>
    (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2.76 * t)) * decay(t, k), gain);
}

function tone(buf, sr, start, dur, f, { gain = 0.3, a = 0.01, r = 0.05, harm = 0 } = {}) {
  return add(buf, sr, start, dur, (t) => {
    const env = Math.min(1, t / a, (dur - t) / r);
    let v = Math.sin(TAU * f * t);
    if (harm) v += harm * Math.sin(TAU * 2 * f * t) + harm * 0.5 * Math.sin(TAU * 3 * f * t);
    return v * Math.max(0, env);
  }, gain);
}

// Seamless loop: crossfades the extra tail into the head.
function loopify(buf, sr, fadeSec) {
  const f = Math.round(fadeSec * sr);
  const n = buf.length - f;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = buf[i];
  for (let i = 0; i < f; i++) {
    const t = i / f;
    out[i] = buf[i] * t + buf[n + i] * (1 - t);
  }
  return out;
}

function normalize(buf, peakDb = -1) {
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? Math.pow(10, peakDb / 20) / peak : 1;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
  return buf;
}

// Short fades at both ends so nothing clicks.
function edges(buf, sr, sec = 0.005) {
  const n = Math.min(Math.round(sec * sr), buf.length >> 1);
  for (let i = 0; i < n; i++) {
    buf[i] *= i / n;
    buf[buf.length - 1 - i] *= i / n;
  }
  return buf;
}

const written = [];
function write(folder, key, buf, sr, { peakDb = -1, loop = false } = {}) {
  normalize(buf, peakDb);
  if (!loop) edges(buf, sr);
  const dir = path.resolve('public', 'assets', 'audio', folder);
  fs.mkdirSync(dir, { recursive: true });
  const data = Buffer.alloc(44 + buf.length * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + buf.length * 2, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(sr, 24); data.writeUInt32LE(sr * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(buf.length * 2, 40);
  for (let i = 0; i < buf.length; i++) data.writeInt16LE(Math.round(clamp(buf[i], -1, 1) * 32767), 44 + i * 2);
  fs.writeFileSync(path.join(dir, key + '.wav'), data);
  written.push([folder + '/' + key + '.wav', data.length]);
}

// --- footsteps ---------------------------------------------------------------

for (let v = 1; v <= 4; v++) {
  const b = make(0.28, HI);
  thump(b, HI, 0, { f0: 110 + v * 6, f1: 55, k: 26, dur: 0.25 });
  burst(b, HI, 0.004, 0.08, { f: 1700 + v * 150, q: 1.4, k: 55, gain: 0.55 });
  burst(b, HI, 0.05 + v * 0.004, 0.06, { f: 2600, q: 2, k: 70, gain: 0.18 });     // heel then toe
  write('sfx', `sfx_step_vik_0${v}`, b, HI, { peakDb: -3 });

  const p = make(0.22, HI);
  thump(p, HI, 0, { f0: 140 + v * 8, f1: 80, k: 34, dur: 0.18, gain: 0.6 });
  burst(p, HI, 0.003, 0.07, { f: 2400 + v * 120, q: 1.2, k: 70, gain: 0.35 });
  write('sfx', `sfx_step_player_0${v}`, p, HI, { peakDb: -6 });
}

// --- doors, keys, the house ---------------------------------------------------

{
  // Key ring jingles, the key slides in, turns, the bolt clunks.
  const b = make(2.6, HI);
  for (let i = 0; i < 9; i++) ping(b, HI, 0.05 + rnd() * 0.7, 2200 + rnd() * 2600, { k: 30, gain: 0.25 });
  burst(b, HI, 1.0, 0.35, { f: 3500, q: 0.8, k: 6, gain: 0.25 });                   // slide in
  burst(b, HI, 1.6, 0.25, { f: 1200, q: 1.5, k: 9, gain: 0.35 });                   // turn
  thump(b, HI, 2.05, { f0: 160, f1: 90, k: 22, dur: 0.3, gain: 0.7 });
  burst(b, HI, 2.05, 0.06, { f: 2000, q: 2, k: 60, gain: 0.6 });
  write('sfx', 'sfx_key_lock', b, HI, { peakDb: -4 });
}

function creak(b, sr, start, dur, f0, f1, gain) {
  let ph = 0;
  const bp = biquad('bp', 900, 4, sr);
  add(b, sr, start, dur, (t) => {
    const f = f0 + (f1 - f0) * (t / dur) + Math.sin(t * 37) * 6;
    ph += TAU * f / sr;
    const saw = ((ph / TAU) % 1) * 2 - 1;
    // Stick-slip: the creak stutters.
    const grain = 0.6 + 0.4 * Math.sin(t * TAU * 22) * Math.sin(t * TAU * 7);
    return bp(saw * grain) * swell(t, dur);
  }, gain);
}

{
  const b = make(1.1, HI);
  creak(b, HI, 0, 1.0, 110, 170, 1);
  burst(b, HI, 0.02, 0.05, { f: 2200, q: 2, k: 70, gain: 0.4 });
  write('sfx', 'sfx_door_open', b, HI, { peakDb: -5 });
}
{
  const b = make(0.8, HI);
  thump(b, HI, 0.02, { f0: 120, f1: 55, k: 14, dur: 0.6 });
  burst(b, HI, 0.06, 0.06, { f: 2500, q: 2, k: 80, gain: 0.5 });                   // latch
  write('sfx', 'sfx_door_close', b, HI, { peakDb: -4 });
}
{
  const b = make(1.4, HI);
  thump(b, HI, 0, { f0: 90, f1: 40, k: 7, dur: 1.2, gain: 1 });
  burst(b, HI, 0, 0.5, { type: 'lp', f: 900, q: 0.7, k: 9, gain: 0.8 });
  for (let i = 0; i < 6; i++) ping(b, HI, 0.08 + i * 0.07, 1500 + rnd() * 900, { k: 20, gain: 0.12 }); // rattle
  write('sfx', 'sfx_door_slam', b, HI, { peakDb: -2 });
}
{
  const b = make(2.2, HI);
  for (const s of [0, 0.35, 0.7, 1.4, 1.7]) {
    thump(b, HI, s, { f0: 100, f1: 55, k: 16, dur: 0.4 });
    burst(b, HI, s, 0.12, { type: 'lp', f: 1200, q: 0.7, k: 25, gain: 0.5 });
  }
  write('sfx', 'sfx_pounding', b, HI, { peakDb: -2 });
}
{
  const b = make(0.35, HI);
  burst(b, HI, 0, 0.3, { f: 3000, q: 0.6, k: 9, gain: 0.5, a: 0.03 });
  burst(b, HI, 0.1, 0.2, { f: 1800, q: 0.8, k: 14, gain: 0.3 });
  write('sfx', 'sfx_pickup', b, HI, { peakDb: -8 });
}
{
  const b = make(0.16, HI);
  burst(b, HI, 0, 0.12, { f: 2800, q: 3, k: 80, gain: 1 });
  thump(b, HI, 0, { f0: 300, f1: 200, k: 60, dur: 0.1, gain: 0.3 });
  write('sfx', 'sfx_interact', b, HI, { peakDb: -10 });
}
{
  const b = make(0.45, HI);
  add(b, HI, 0, 0.42, (t) => {
    const sq = Math.sign(Math.sin(TAU * 110 * t)) * 0.6 + Math.sin(TAU * 220 * t) * 0.3;
    return sq * (0.6 + 0.4 * Math.sin(TAU * 18 * t)) * Math.min(1, (0.42 - t) / 0.08);
  });
  filter(b, 'lp', 1800, 0.7, HI);
  write('sfx', 'sfx_wrong', b, HI, { peakDb: -8 });
}
{
  // Static clearing into a clean tone.
  const b = make(0.7, HI);
  burst(b, HI, 0, 0.35, { f: 4000, q: 0.5, k: 10, gain: 0.25 });
  tone(b, HI, 0.12, 0.55, 660, { gain: 0.25, a: 0.08, r: 0.3 });
  tone(b, HI, 0.18, 0.5, 990, { gain: 0.12, a: 0.08, r: 0.3 });
  write('sfx', 'sfx_fix_ok', b, HI, { peakDb: -8 });
}
{
  // Phone vibration: two buzzes.
  const b = make(0.9, HI);
  for (const s of [0, 0.45]) {
    add(b, HI, s, 0.32, (t) => Math.sign(Math.sin(TAU * 172 * t)) * (0.7 + 0.3 * Math.sin(TAU * 31 * t)) *
      Math.min(1, t / 0.01, (0.32 - t) / 0.02), 0.5);
  }
  filter(b, 'lp', 1400, 0.7, HI);
  write('sfx', 'sfx_phone_buzz', b, HI, { peakDb: -6 });
}
{
  const b = make(0.06, HI);
  burst(b, HI, 0, 0.05, { f: 3500, q: 2, k: 120 });
  write('sfx', 'sfx_phone_tap', b, HI, { peakDb: -14 });
}
{
  const b = make(0.55, HI);
  tone(b, HI, 0, 0.18, 880, { gain: 0.3, harm: 0.1 });
  tone(b, HI, 0.25, 0.22, 660, { gain: 0.3, harm: 0.1 });
  write('sfx', 'sfx_battery_low', b, HI, { peakDb: -10 });
}
{
  const b = make(1.1, HI);
  creak(b, HI, 0, 0.7, 150, 210, 0.7);
  const lp = biquad('bp', 600, 0.5, HI);
  add(b, HI, 0.2, 0.9, (t) => lp(white()) * swell(t, 0.9), 0.5);                  // air rushing in
  write('sfx', 'sfx_window_open', b, HI, { peakDb: -6 });
}
{
  // A lamp flickering: mains buzz with pops.
  const b = make(0.45, HI);
  add(b, HI, 0, 0.45, (t) => (Math.sin(TAU * 100 * t) * 0.5 + Math.sign(Math.sin(TAU * 50 * t)) * 0.2) *
    (rnd() < 0.002 ? 3 : 1) * (0.5 + 0.5 * Math.sin(TAU * 9 * t)));
  for (let i = 0; i < 5; i++) burst(b, HI, rnd() * 0.4, 0.02, { f: 3000, q: 1, k: 200, gain: 0.8 });
  write('sfx', 'sfx_flicker', b, HI, { peakDb: -10 });
}
{
  // Nani's soft tick.
  const b = make(0.16, HI);
  burst(b, HI, 0, 0.1, { f: 1600, q: 5, k: 90, gain: 1 });
  ping(b, HI, 0, 1200, { k: 50, gain: 0.2 });
  write('sfx', 'sfx_lamp_tick', b, HI, { peakDb: -12 });
}
{
  const b = make(0.35, HI);
  burst(b, HI, 0, 0.05, { f: 1500, q: 2, k: 90 });
  burst(b, HI, 0.08, 0.05, { f: 900, q: 2, k: 90, gain: 0.8 });
  add(b, HI, 0.1, 0.25, (t) => Math.sin(TAU * 60 * t) * decay(t, 8), 0.2);
  write('sfx', 'sfx_tape_click', b, HI, { peakDb: -6 });
}
{
  // Held breath: a sharp inhale.
  const b = make(1.2, HI);
  const bp = biquad('bp', 1800, 0.9, HI);
  add(b, HI, 0, 0.6, (t) => bp(white()) * swell(t, 0.6) * (t / 0.6));
  write('sfx', 'sfx_breath_hold', b, HI, { peakDb: -12 });
}
{
  // Burners catching: a soft whump.
  const b = make(1.1, HI);
  thump(b, HI, 0, { f0: 180, f1: 50, k: 6, dur: 0.9 });
  burst(b, HI, 0, 0.9, { type: 'lp', f: 700, q: 0.7, k: 4, gain: 0.6, a: 0.04 });
  write('sfx', 'sfx_gas_whump', b, HI, { peakDb: -3 });
}
{
  // A long fall down the stairs: thuds that slow and stop.
  const b = make(3.8, HI);
  let t = 0;
  for (let i = 0; i < 9; i++) {
    thump(b, HI, t, { f0: 100 - i * 4, f1: 45, k: 12, dur: 0.4, gain: 1 - i * 0.05 });
    burst(b, HI, t, 0.15, { type: 'lp', f: 1500, q: 0.7, k: 20, gain: 0.5 });
    t += 0.18 + i * 0.05;
  }
  thump(b, HI, t + 0.3, { f0: 80, f1: 38, k: 5, dur: 0.9, gain: 1.2 });
  write('sfx', 'sfx_fall_stairs', b, HI, { peakDb: -2 });
}
{
  // Cooker whistle: steam through a weighted valve.
  const b = make(1.3, HI);
  const bp = biquad('bp', 2900, 14, HI);
  let ph = 0;
  add(b, HI, 0, 1.25, (t) => {
    const f = 2900 + Math.sin(TAU * 6 * t) * 40;
    ph += TAU * f / HI;
    const env = swell(t, 1.25) * clamp(t * 6, 0, 1);
    return (bp(white()) * 4 + Math.sin(ph) * 0.25) * env;
  });
  write('sfx', 'sfx_cooker_whistle', b, HI, { peakDb: -8 });
}
{
  // A faint radio tune (an original phrase), thin and far away.
  const b = make(3.2, HI);
  const notes = [392, 440, 494, 440, 392, 330, 392, 294];
  notes.forEach((f, i) => tone(b, HI, i * 0.36, 0.34, f, { gain: 0.3, a: 0.02, r: 0.12, harm: 0.25 }));
  const p = pinkNoise();
  add(b, HI, 0, 3.2, () => p(), 0.08);
  filter(b, 'bp', 1200, 0.6, HI);
  add(b, HI, 2.9, 0.3, () => 0, 1);
  write('sfx', 'sfx_radio_tune', b, HI, { peakDb: -10 });
}

// Stingers: three different shocks.
{
  const b = make(1.6, HI);
  for (const f of [880, 932, 1046, 1108]) {
    add(b, HI, 0, 1.5, (t) => (((f * t) % 1) * 2 - 1) * attackDecay(t, 0.01, 3.2), 0.2);
  }
  burst(b, HI, 0, 0.3, { f: 3000, q: 0.5, k: 12, gain: 0.6 });
  filter(b, 'lp', 4500, 0.7, HI);
  write('sfx', 'sfx_stinger_1', b, HI, { peakDb: -1 });
}
{
  const b = make(2.0, HI);
  thump(b, HI, 0, { f0: 70, f1: 30, k: 2.5, dur: 1.9, gain: 1 });
  for (const f of [1320, 1397, 1480]) {
    let ph = 0;
    add(b, HI, 0.02, 1.4, (t) => { ph += TAU * (f + t * 200) / HI; return Math.sin(ph) * attackDecay(t, 0.02, 2.5); }, 0.18);
  }
  burst(b, HI, 0, 0.5, { f: 2000, q: 0.4, k: 8, gain: 0.5 });
  write('sfx', 'sfx_stinger_2', b, HI, { peakDb: -1 });
}
{
  const b = make(1.4, HI);
  add(b, HI, 0, 1.3, (t) => white() * attackDecay(t, 0.005, 3), 0.7);
  for (const f of [220, 233, 311]) add(b, HI, 0, 1.3, (t) => Math.sin(TAU * f * t) * attackDecay(t, 0.01, 2.2), 0.25);
  filter(b, 'lp', 5000, 0.7, HI);
  write('sfx', 'sfx_stinger_3', b, HI, { peakDb: -1 });
}

// --- loops ------------------------------------------------------------------------

{
  const b = make(2.25, HI);
  const bp = biquad('bp', 1500, 0.6, HI);
  add(b, HI, 0, 2.25, (t) => bp(white()) * (0.6 + 0.4 * Math.sin(TAU * 0.9 * t)) + (rnd() < 0.003 ? white() * 2 : 0));
  write('sfx', 'sfx_radio_static', loopify(b, HI, 0.25), HI, { peakDb: -10, loop: true });
}
{
  const b = make(2.25, HI);
  add(b, HI, 0, 2.25, (t) => white() * (0.85 + 0.15 * Math.sin(TAU * 13 * t)));
  filter(b, 'lp', 6000, 0.7, HI);
  write('sfx', 'sfx_tv_static', loopify(b, HI, 0.25), HI, { peakDb: -10, loop: true });
}
{
  // Rain: pink noise and drops.
  const b = make(4.4, HI);
  const p = pinkNoise();
  add(b, HI, 0, 4.4, () => p(), 1);
  filter(b, 'lp', 5000, 0.7, HI);
  for (let i = 0; i < 220; i++) burst(b, HI, rnd() * 4.3, 0.03, { f: 2000 + rnd() * 3000, q: 3, k: 160, gain: 0.25 + rnd() * 0.3 });
  write('sfx', 'sfx_rain_loop', loopify(b, HI, 0.4), HI, { peakDb: -6, loop: true });
}
{
  // Heartbeat: lub-dub, once a second.
  const b = make(1.0, HI);
  thump(b, HI, 0.02, { f0: 70, f1: 45, k: 16, dur: 0.3, gain: 1 });
  thump(b, HI, 0.27, { f0: 60, f1: 40, k: 20, dur: 0.3, gain: 0.7 });
  filter(b, 'lp', 300, 0.7, HI);
  write('sfx', 'sfx_heartbeat_loop', b, HI, { peakDb: -4, loop: true });
}
{
  // A siren far away, rising and falling (generic, not any real service).
  const b = make(4.4, HI);
  let ph = 0;
  add(b, HI, 0, 4.4, (t) => {
    const f = 760 + 360 * Math.sin(TAU * t / 4);
    ph += TAU * f / HI;
    return Math.sin(ph) + 0.3 * Math.sin(2 * ph);
  });
  filter(b, 'lp', 1600, 0.7, HI);
  write('sfx', 'sfx_siren_loop', loopify(b, HI, 0.4), HI, { peakDb: -10, loop: true });
}

// Ambience: the flat at night, and the same room with the warmth gone.
{
  const sec = 8.5;
  const b = make(sec, HI);
  add(b, HI, 0, sec, (t) => Math.sin(TAU * 50 * t) * 0.3 + Math.sin(TAU * 100 * t) * 0.15);    // fridge hum
  const fan = biquad('lp', 500, 0.7, HI);
  add(b, HI, 0, sec, (t) => fan(white()) * (0.7 + 0.3 * Math.sin(TAU * 3.5 * t)), 0.9);       // ceiling fan
  const p = pinkNoise();
  const far = biquad('lp', 250, 0.7, HI);
  add(b, HI, 0, sec, (t) => far(p()) * (0.6 + 0.4 * Math.sin(TAU * t / 8.5)), 1.4);           // far traffic
  write('amb', 'amb_flat_loop', loopify(b, HI, 0.5), HI, { peakDb: -6, loop: true });
}
{
  const sec = 8.5;
  const b = make(sec, HI);
  add(b, HI, 0, sec, (t) => Math.sin(TAU * 50 * t) * 0.12);
  const wind = biquad('bp', 700, 2, HI);
  let f = 700;
  add(b, HI, 0, sec, (t) => {
    f = 600 + 300 * Math.sin(TAU * t / 8.5) + 80 * Math.sin(TAU * t / 2.1);
    return wind(white()) * (0.5 + 0.5 * Math.sin(TAU * t / 4.25)) * (f / 900);
  }, 1);
  add(b, HI, 0, sec, (t) => Math.sin(TAU * 41 * t) * Math.sin(TAU * 41.7 * t) * 0.15);       // a wrong beating
  write('amb', 'amb_cold_loop', loopify(b, HI, 0.5), HI, { peakDb: -6, loop: true });
}

// Music: a harmonium-like memory loop, and the dread drone.
function harmonium(b, sr, start, dur, f, gain) {
  add(b, sr, start, dur, (t) => {
    const env = Math.min(1, t / 1.2, (dur - t) / 1.2);
    const trem = 1 + 0.06 * Math.sin(TAU * 5.2 * t);
    let v = 0;
    for (let h = 1; h <= 7; h++) {
      v += (Math.sin(TAU * f * h * t) + Math.sin(TAU * f * 1.0015 * h * t)) / (h * 1.4);
    }
    return v * Math.max(0, env) * trem;
  }, gain);
}
{
  const sec = 21;
  const b = make(sec, HI);
  harmonium(b, HI, 0, sec, 146.83, 0.22);                       // D3 drone
  harmonium(b, HI, 0, sec, 220.0, 0.14);                        // A3
  [349.23, 329.63, 293.66, 261.63].forEach((f, i) => harmonium(b, HI, i * 5 - 0.6, 6.2, f, 0.12));
  harmonium(b, HI, 19.4, 1.8, 349.23, 0.12);                    // leads back into the first chord
  filter(b, 'lp', 2400, 0.7, HI);
  write('music', 'music_memory_loop', loopify(b, HI, 1.0), HI, { peakDb: -4, loop: true });
}
{
  const sec = 12.6;
  const b = make(sec, HI);
  add(b, HI, 0, sec, (t) => Math.sin(TAU * 55 * t) + 0.6 * Math.sin(TAU * 55.4 * t) + 0.3 * Math.sin(TAU * 82.5 * t), 0.5);
  const p = pinkNoise();
  const lp = biquad('lp', 180, 0.7, HI);
  add(b, HI, 0, sec, (t) => lp(p()) * (0.5 + 0.5 * Math.sin(TAU * t / 6.3)), 2);
  write('music', 'music_dread_loop', loopify(b, HI, 0.6), HI, { peakDb: -6, loop: true });
}

// The eerie bed: a dissonant pad that breathes, a sub hum, and faint ghostly
// tones like a music box in another flat. Low and slow; it sits under
// everything.
{
  const sec = 34;
  const b = make(sec, HI);
  add(b, HI, 0, sec, (t) => Math.sin(TAU * 55 * t) * (0.8 + 0.2 * Math.sin(TAU * t / 17)), 0.35);  // sub hum
  // Pad: A2 against B-flat 2 (a minor second), slowly filtered open and shut.
  const pad = make(sec, HI);
  for (const [f, g] of [[110, 1], [116.54, 0.8], [164.81, 0.5], [220.4, 0.35]]) {
    add(pad, HI, 0, sec, (t) => {
      let v = 0;
      for (let h = 1; h <= 6; h++) v += Math.sin(TAU * f * h * t + h) / h;
      return v;
    }, g);
  }
  // A two-pole lowpass whose cutoff drifts (state kept, so no zipper clicks).
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < pad.length; i++) {
    const t = i / HI;
    const fc = 320 + 380 * (0.5 + 0.5 * Math.sin(TAU * t / 17));
    const k = 1 - Math.exp(-TAU * fc / HI);
    y1 += k * (pad[i] - y1);
    y2 += k * (y1 - y2);
    b[i] += y2 * 0.18 * (0.75 + 0.25 * Math.sin(TAU * t / 8.5));
  }
  // Breath: a filtered swell every 8.5 s.
  const bp = biquad('bp', 420, 1.2, HI);
  add(b, HI, 0, sec, (t) => bp(white()) * Math.pow(Math.max(0, Math.sin(TAU * t / 8.5)), 3), 0.5);
  // Ghost tones: sparse, high, a little out of tune.
  [[2.1, 880], [6.8, 932.3], [11.5, 1318.5], [15.2, 880], [19.9, 1244.5], [24.6, 932.3], [29.3, 1174.7]]
    .forEach(([s0, f]) => add(b, HI, s0, 4, (t) => Math.sin(TAU * f * t * (1 + 0.003 * Math.sin(TAU * 4.5 * t))) *
      Math.min(1, t / 0.4) * Math.exp(-t * 0.9), 0.05));
  filter(b, 'lp', 3500, 0.7, HI);
  write('music', 'music_eerie_loop', loopify(b, HI, 2.0), HI, { peakDb: -3, loop: true });
}

// --- voicemail beds (phone line, 8 kHz) ------------------------------------------
// The voice itself is in the subtitles; these carry the line and the scene.

function lineBed(sec) {
  const b = make(sec, LINE);
  const p = pinkNoise();
  add(b, LINE, 0, sec, (t) => p() * 0.35 + Math.sin(TAU * 50 * t) * 0.04);
  filter(b, 'bp', 1500, 0.5, LINE);
  burst(b, LINE, 0, 0.06, { f: 1200, q: 1, k: 80, gain: 0.8 });                      // line opens
  return b;
}

{
  const b = lineBed(14);
  burst(b, LINE, 0.05, 0.25, { f: 1800, q: 4, k: 18, gain: 1.5 });                 // steel cup set down
  write('voice', 'vm1', b, LINE, { peakDb: -10 });
}
{
  const b = lineBed(12);
  tone(b, LINE, 5.0, 0.35, 1000, { gain: 0.5 });                                    // the call cuts out
  for (let i = 0; i < 4; i++) burst(b, LINE, 5.4 + i * 0.12, 0.05, { f: 1500, q: 1, k: 90, gain: 0.7 });
  write('voice', 'vm2', b, LINE, { peakDb: -10 });
}
{
  const b = lineBed(15);
  const p = pinkNoise();
  add(b, LINE, 0, 15, () => p(), 0.9);                                             // rain, traffic
  for (let i = 0; i < 160; i++) burst(b, LINE, rnd() * 15, 0.03, { f: 2500, q: 2, k: 150, gain: 0.3 });
  tone(b, LINE, 1.0, 1.4, 523, { gain: 0.08 });                                     // a far announcement chime
  tone(b, LINE, 1.5, 1.4, 392, { gain: 0.08 });
  write('voice', 'vm3', b, LINE, { peakDb: -8 });
}
{
  const b = lineBed(14);
  const bp = biquad('bp', 2600, 3, LINE);
  add(b, LINE, 0, 6, (t) => bp(white()) * (0.4 + 0.2 * Math.sin(TAU * 0.5 * t)), 0.6);  // cooker hissing
  tone(b, LINE, 0.5, 13, 330, { gain: 0.04, harm: 0.3 });                               // radio low
  write('voice', 'vm4', b, LINE, { peakDb: -10 });
}
{
  const b = lineBed(20);
  const bp = biquad('bp', 900, 1, LINE);
  for (let s = 0.4; s < 20; s += 3.6) add(b, LINE, s, 1.6, (t) => bp(white()) * swell(t, 1.6), 0.35);  // her breathing
  write('voice', 'vm5', b, LINE, { peakDb: -12 });
}
{
  const b = lineBed(12);
  for (let s = 0.2; s < 12; s += 1.15) tone(b, LINE, s, 0.12, 1000, { gain: 0.35 });    // a monitor, slow
  write('voice', 'vm6', b, LINE, { peakDb: -10 });
}
{
  const b = lineBed(11);
  const babble = biquad('bp', 700, 1.2, LINE);
  add(b, LINE, 0, 11, (t) => babble(white()) * (0.5 + 0.5 * Math.abs(Math.sin(TAU * 2.3 * t))), 0.7);  // TV serial
  for (let i = 0; i < 5; i++) ping(b, LINE, 4.0 + i * 0.07, 2200 + rnd() * 1200, { k: 30, gain: 0.25 });  // keys
  burst(b, LINE, 4.6, 0.3, { f: 1100, q: 1.5, k: 10, gain: 0.8 });                    // the door
  thump(b, LINE, 9.5, { f0: 110, f1: 50, k: 8, dur: 0.8, gain: 1.6 });                // the sharp sound
  burst(b, LINE, 9.5, 0.2, { type: 'lp', f: 1500, q: 0.7, k: 15, gain: 0.8 });
  write('voice', 'vm7', b, LINE, { peakDb: -6 });
}
{
  // VM8 is the clear one: a quiet line, a little room.
  const b = make(8, LINE);
  const p = pinkNoise();
  add(b, LINE, 0, 8, () => p(), 0.12);
  filter(b, 'lp', 2200, 0.7, LINE);
  write('voice', 'vm8', b, LINE, { peakDb: -18 });
}

// Damaged previews: the first 3 seconds of each, as broken as the damage.
{
  const b = make(3, LINE);
  add(b, LINE, 0, 3, () => white() * (rnd() < 0.02 ? 3 : 0.6));
  filter(b, 'bp', 1500, 0.5, LINE);
  write('voice', 'vm1_damaged', b, LINE, { peakDb: -8 });
}
{
  const b = lineBed(3);
  for (let s = 0; s < 3; s += 0.18) add(b, LINE, s, 0.08, () => white() * 0.8);        // skipping
  write('voice', 'vm2_damaged', b, LINE, { peakDb: -8 });
}
{
  const b = make(3, LINE);
  const p = pinkNoise();
  add(b, LINE, 0, 3, () => p(), 1.5);
  write('voice', 'vm3_damaged', b, LINE, { peakDb: -6 });
}
{
  const b = lineBed(3);
  tone(b, LINE, 0.1, 2.8, 2900, { gain: 0.5, a: 0.3 });                                // whistle over the voice
  write('voice', 'vm4_damaged', b, LINE, { peakDb: -8 });
}
{
  const b = lineBed(3);
  filter(b, 'lp', 300, 0.7, LINE);                                                     // muffled
  write('voice', 'vm5_damaged', b, LINE, { peakDb: -14 });
}
{
  const b = make(3, LINE);
  for (let s = 0.3; s < 3; s += 1.15) tone(b, LINE, s, 0.1, 1000, { gain: 0.15 });      // almost silence
  write('voice', 'vm6_damaged', b, LINE, { peakDb: -20 });
}

// The tape: hiss, wow and flutter.
{
  const b = make(8, LINE);
  const p = pinkNoise();
  add(b, LINE, 0, 8, (t) => p() * 0.5 + Math.sin(TAU * 60 * t * (1 + 0.01 * Math.sin(TAU * 0.7 * t))) * 0.08);
  filter(b, 'bp', 1800, 0.5, LINE);
  burst(b, LINE, 0, 0.05, { f: 1000, q: 1, k: 80, gain: 1 });
  write('voice', 'tape_clip', b, LINE, { peakDb: -10 });
}

// The Hollow's whispers: wordless, breathy syllables with a second, lower
// voice underneath. The words are in the subtitles.
const VOWELS = [[700, 1200], [400, 2000], [300, 2300], [500, 900], [600, 1700]];
for (let w = 1; w <= 8; w++) {
  const sec = 3.2;
  const b = make(sec, LINE);
  const syll = 3 + (w % 4);
  for (let s = 0; s < syll; s++) {
    const start = 0.2 + s * (2.6 / syll) + rnd() * 0.05;
    const dur = 2.6 / syll * 0.8;
    const [f1, f2] = VOWELS[(w + s) % VOWELS.length];
    const a = biquad('bp', f1, 5, LINE);
    const c = biquad('bp', f2, 6, LINE);
    const low = biquad('bp', f1 * 0.7, 5, LINE);
    add(b, LINE, start, dur, (t) => {
      const n = white();
      return (a(n) + c(n) * 0.7) * swell(t, dur) + low(white()) * swell(t, dur) * 0.4;
    }, 1);
  }
  write('voice', `hol_${w}`, b, LINE, { peakDb: -6 });
}

const total = written.reduce((s, [, n]) => s + n, 0);
console.log(`${written.length} files, ${(total / 1024 / 1024).toFixed(2)} MB`);
