// Final act, "The Long Minute" (docs/06 section 1): the locker, the tape
// moment, the call, the police ETA, the corner event, and the dead-air timer.
// Pure.

import { BALANCE } from '../config/balance.js';
import { completedCount, deriveAct } from './gameState.js';

const F = BALANCE.final;
const B = BALANCE.battery;
const N = BALANCE.noise;
const LOCKER_NEEDS = 7;

export function createFinalAct(bus, { puzzles, battery, vikram }) {
  function giveTape(state) {
    if (state.inventory.evidence.includes('E8')) return;
    state.inventory.evidence.push('E8');
    state.stats.evidenceCount = state.inventory.evidence.length;
    bus.emit('evidence:added', { id: 'E8' });
  }

  function startAct5(state) {
    state.flags.tapeMoment = null;
    state.player.locked = false;
    const prev = state.act;
    state.act = deriveAct(state);
    if (state.act !== prev) bus.emit('act:changed', { act: state.act, prev });
    if (vikram) vikram.startHunt(state);
    bus.emit('final:start', {});
  }

  function failCall(state) {
    state.flags.callConnecting = false;
    state.flags.callConnectTimer = 0;
    bus.emit('call:failed', {});
  }

  function connectCall(state) {
    const f = state.flags;
    f.callConnecting = false;
    f.callConnectTimer = 0;
    battery.spend(state, B.callCost);
    f.callConnected = true;
    f.policeEta = F.policeEtaSec;
    // A dead battery no longer matters once the call is up.
    f.deadAirTimer = null;
    bus.emit('call:connected', {});
  }

  function startCorner(state) {
    state.flags.cornerActive = true;
    state.player.locked = true;
    state.player.moving = false;
    if (vikram) vikram.startCorner(state);
    bus.emit('corner:start', {});
  }

  function policeArrive(state) {
    state.flags.policeEta = 0;
    bus.emit('police:arrive', {});
  }

  const api = {
    lockerUsable(state) {
      return completedCount(state) >= LOCKER_NEEDS && !state.flags.lockerOpened;
    },

    // Wrong code: noise spike (rules), no battery cost. Right code: the tape
    // moment (8 s, player locked, Vikram frozen), then Act 5.
    tryCode(state, code) {
      if (!api.lockerUsable(state)) return { ok: false, reason: 'notYet' };
      if (!puzzles.checkLocker(code)) {
        bus.emit('locker:wrong', {});
        return { ok: false, reason: 'wrongCode' };
      }
      state.flags.lockerOpened = true;
      state.flags.tapeTaken = true;
      giveTape(state);
      state.flags.tapeMoment = F.tapeMomentSec;
      state.player.locked = true;
      state.player.moving = false;
      bus.emit('tape:start', {});
      return { ok: true };
    },

    // Debug and presets: skip the 8 s cinematic.
    skipTapeMoment(state) {
      if (state.flags.tapeMoment !== null) startAct5(state);
    },

    inCinematic(state) {
      return state.flags.tapeMoment !== null;
    },

    // docs/06 section 1.4: battery >= 3, noise < 40, standing still or hidden.
    canCall(state) {
      const f = state.flags;
      if (!f.tapeTaken || f.tapeMoment !== null || f.callConnected || f.callConnecting) return 'notYet';
      if (state.battery < B.callMinBattery) return 'callNeedsBattery';
      if (state.noise >= N.callStartMax) return 'callTooLoud';
      if (state.player.moving && !state.player.hidden) return 'callTooLoud';
      return null;
    },

    call(state) {
      const reason = api.canCall(state);
      if (reason) return { ok: false, reason };
      state.flags.callConnecting = true;
      state.flags.callConnectTimer = 0;
      bus.emit('call:connecting', {});
      return { ok: true };
    },

    tick(state, dt) {
      const f = state.flags;
      if (f.endingId) return;

      if (f.tapeMoment !== null) {
        f.tapeMoment -= dt;
        if (f.tapeMoment <= 0) startAct5(state);
        return;
      }

      // Tape taken, battery too low to call, no call: same dead-air timer.
      if (f.tapeTaken && !f.callConnected && !f.callConnecting && state.battery < B.callMinBattery &&
          f.deadAirTimer === null) {
        f.deadAirTimer = B.deadAirDoomSec;
      }
      if (f.deadAirTimer !== null && !f.cornerActive && !f.callConnected) {
        f.deadAirTimer = Math.max(0, f.deadAirTimer - dt);
        if (f.deadAirTimer === 0) {
          f.deadAirTimer = null;
          bus.emit('player:caught', { cause: 'dead_air' });
          return;
        }
      }

      if (f.callConnecting) {
        if (state.noise >= N.callFailAt) {
          failCall(state);
          return;
        }
        f.callConnectTimer += dt;
        if (f.callConnectTimer >= F.callConnectSec) connectCall(state);
        return;
      }

      if (f.callConnected && f.policeEta > 0) {
        f.policeEta = Math.max(0, f.policeEta - dt);
        if (!f.sirenStarted && f.policeEta <= F.sirenAtEta) {
          f.sirenStarted = true;
          bus.emit('siren:start', {});
        }
        if (!f.cornerActive && f.policeEta <= F.cornerAtEta) startCorner(state);
        if (f.policeEta === 0) policeArrive(state);
      }
    },

    // Corner event: he reached the player first (the ETA may still be > 0).
    cornerReached(state) {
      if (state.flags.cornerActive && !state.flags.endingId) policeArrive(state);
    }
  };
  return api;
}
