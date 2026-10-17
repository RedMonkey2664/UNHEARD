// Portrait phones get a full-screen "Rotate your phone" overlay and the game
// pauses (docs/02 section 2). Coarse pointer keeps narrow desktop windows out.

const QUERY = '(orientation: portrait) and (pointer: coarse)';

export function watchOrientation(game, overlay) {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const mq = window.matchMedia(QUERY);
  let paused = false;

  function apply() {
    const portrait = mq.matches;
    overlay.classList.toggle('show', portrait);
    if (portrait && !paused) {
      paused = true;
      game.pause();
      game.sound?.pauseAll();
    } else if (!portrait && paused) {
      paused = false;
      game.resume();
      game.sound?.resumeAll();
    }
  }

  if (mq.addEventListener) mq.addEventListener('change', apply);
  else mq.addListener(apply);
  window.addEventListener('resize', apply);
  apply();
}
