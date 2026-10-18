// Device profile, decided once at load. Touch devices (phones, tablets) get
// the mobile layout: bigger buttons, a taller phone panel, larger text.
// Desktop is unchanged. In tests (no window) this is the desktop profile.

function detectTouch() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  // Coarse primary pointer = finger. Laptops with touchscreens keep desktop.
  return window.matchMedia('(pointer: coarse)').matches;
}

export const DEVICE = {
  touch: detectTouch()
};

// Fullscreen and a landscape lock, on a user gesture. Both are best effort:
// iPhone Safari has neither, and the rotate overlay still covers portrait.
export function enterMobileFullscreen() {
  if (!DEVICE.touch || typeof document === 'undefined') return;
  const el = document.documentElement;
  const request = el.requestFullscreen || el.webkitRequestFullscreen;
  try {
    const p = request && !document.fullscreenElement ? request.call(el, { navigationUI: 'hide' }) : null;
    Promise.resolve(p).then(() => window.screen?.orientation?.lock?.('landscape')).catch(() => {});
  } catch {
    // Not supported: the game still runs in the browser window.
  }
}
