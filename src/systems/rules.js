// Cross-system rules triggered by events: which event spikes noise, what
// happens when a memory ends, and so on. Kept here (pure) rather than in
// scenes so the rules are testable. Returns an unsubscribe function.

import { BALANCE } from '../config/balance.js';
import { createEndingResolver } from './endingResolver.js';

export function connectRules(bus, systems, getState) {
  const offs = [];
  const on = (name, fn) => offs.push(bus.on(name, (p) => fn(getState(), p || {})));
  const { noise, vikram, barks, presence, temptation, finalAct } = systems;
  // In the game the resolver is flushed once per frame (frame step 10);
  // without one (unit tests) causes resolve immediately.
  const endings = systems.endings || createEndingResolver(bus, { deferred: false });
  const end = (s, cause) => endings.request(s, cause);

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
    on('presence:doom', (s) => end(s, 'presence_doom'));
  }
  on('temptation:pressed', (s) => end(s, 'temptation'));
  on('police:arrive', (s) => end(s, 'police_arrived'));
  if (finalAct) on('corner:reached', (s) => finalAct.cornerReached(s));

  // Battery dead with no call: he comes in (docs/03 section 3).
  on('battery:zero', (s) => { if (!s.flags.callConnected) vikram.reenterNow(s); });

  // Barks on state changes and when he steps into the Hall.
  if (barks) {
    on('vikram:state', (s, { state: name }) => barks.onState(s, name));
    on('vikram:door', (s, { room, from }) => { if (room === 'HALL' && from === null) barks.onEnterHall(s); });
  }

  on('player:caught', (s, { cause }) => end(s, cause));

  return () => offs.forEach((off) => off());
}
