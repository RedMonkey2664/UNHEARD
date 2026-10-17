// Cross-system rules triggered by events: which event spikes noise, what
// happens when a memory ends, and so on. Kept here (pure) rather than in
// scenes so the rules are testable. Returns an unsubscribe function.

import { BALANCE } from '../config/balance.js';

export function connectRules(bus, systems, getState) {
  const offs = [];
  const on = (name, fn) => offs.push(bus.on(name, (p) => fn(getState(), p || {})));
  const { noise, vikram, barks, presence, temptation } = systems;

  // Placeholder ending trigger until the resolver arrives in Stage 5.
  function endWith(s, id, cause) {
    if (s.flags.endingId) return;
    s.flags.endingId = id;
    s.flags.endingCause = cause;
    if (id === 'CAUGHT') s.flags.caught = true;
    bus.emit('ending:trigger', { id, cause });
  }

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
    if (completed === 4 && temptation) temptation.show(s);
  });

  // Presence (docs/03 section 5).
  if (presence) {
    on('fix:fail', (s) => presence.rise(s, 'wrongFix'));
    on('vm:play:start', (s, { replay }) => { if (replay) presence.rise(s, 'replay'); });
    on('memory:skip', (s) => presence.rise(s, 'skipMemory'));
    on('memory:end', (s, { skipped, vmId }) => {
      if (!skipped) presence.fall(s, 'memoryDone');
      if (vmId === 3) s.nani.ng3Until = s.clock.runSeconds + BALANCE.nani.ng3WindowSec;
    });
    on('call:failed', (s) => presence.rise(s, 'callFail'));
    on('presence:doom', (s) => endWith(s, 'LATER', 'presence_doom'));
  }
  on('temptation:pressed', (s) => endWith(s, 'LATER', 'temptation'));

  // Battery dead with no call: he comes in (docs/03 section 3).
  on('battery:zero', (s) => { if (!s.flags.callConnected) vikram.reenterNow(s); });

  // Barks on state changes and when he steps into the Hall.
  if (barks) {
    on('vikram:state', (s, { state: name }) => barks.onState(s, name));
    on('vikram:door', (s, { room, from }) => { if (room === 'HALL' && from === null) barks.onEnterHall(s); });
  }

  on('player:caught', (s, { cause }) => endWith(s, 'CAUGHT', cause));

  return () => offs.forEach((off) => off());
}
