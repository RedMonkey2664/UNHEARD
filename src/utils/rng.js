// Seedable RNG (mulberry32) so tests are repeatable. Systems never call
// Math.random directly.

export function createRng(seed = 1) {
  let a = seed >>> 0;

  function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Float in [min, max).
  function range(min, max) {
    return min + (max - min) * next();
  }

  // Integer in [min, max], inclusive.
  function int(min, max) {
    return min + Math.floor(next() * (max - min + 1));
  }

  function pick(arr) {
    return arr[Math.floor(next() * arr.length)];
  }

  // Returns a new shuffled array (Fisher-Yates).
  function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  return { next, range, int, pick, shuffle };
}
