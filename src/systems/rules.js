// Cross-system rules triggered by events: which event spikes noise, what
// happens when a memory ends, and so on. Kept here (pure) rather than in
// scenes so the rules are testable. Returns an unsubscribe function.

export function connectRules(bus, systems, getState) {
  const offs = [];
  const on = (name, fn) => offs.push(bus.on(name, (p) => fn(getState(), p || {})));
  const { noise, vikram } = systems;

  // Noise spikes (docs/03 section 4).
  on('hotspot:interact', (s) => noise.spike(s, 'interact'));
  on('room:enter', (s, p) => { if (!p.teleport) noise.spike(s, 'door'); });
  on('fix:fail', (s) => noise.spike(s, 'wrongFix'));
  on('locker:wrong', (s) => noise.spike(s, 'wrongCode'));

  // Completed-count events fire once, on memory:end (docs/03 section 2).
  on('memory:end', (s, { completed }) => {
    if (completed === 1 && !s.flags.foreshadowDone) {
      s.flags.foreshadowDone = true;
      bus.emit('beat:fire', { id: 'FORESHADOW' });
    }
    if (completed === 2 && !s.flags.vikramEntered) vikram.enter(s);
  });

  return () => offs.forEach((off) => off());
}
