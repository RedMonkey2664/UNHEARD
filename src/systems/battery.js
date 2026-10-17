// Battery: torch drain, one-off costs, playback drain, zero handling
// (docs/03 section 3). Pure: state and dt in, events out.

import { BALANCE } from '../config/balance.js';
import { VOICEMAILS } from '../data/voicemails.js';
import { clamp } from '../utils/math.js';

const B = BALANCE.battery;
const LONG_VM = 5;  // the only voicemail that uses playCostLong

export function createBattery(bus) {
  // HUD shows whole percent, so only announce when that number moves.
  let lastShown = null;

  function announce(state) {
    const shown = Math.ceil(state.battery);
    if (shown !== lastShown) {
      lastShown = shown;
      bus.emit('battery:changed', { value: state.battery });
    }
  }

  // Every change goes through here so the zero transition fires exactly once.
  function apply(state, next) {
    const prev = state.battery;
    state.battery = clamp(next, 0, B.start);
    announce(state);
    if (prev > 0 && state.battery === 0) onZero(state);
  }

  function onZero(state) {
    state.torchOn = false;
    if (!state.flags.callConnected && state.flags.deadAirTimer === null) {
      state.flags.deadAirTimer = B.deadAirDoomSec;
    }
    bus.emit('battery:zero', {});
  }

  function playCost(vmId) {
    return vmId === LONG_VM ? B.playCostLong : B.playCost;
  }

  function costMult(state) {
    return state.settings.assist ? BALANCE.assist.costMult : 1;
  }

  return {
    // Torch drain. Assist does not reduce it (docs/03 section 13).
    tick(state, dt) {
      if (state.torchOn && !state.player.hidden && state.battery > 0) {
        apply(state, state.battery - B.torchDrainPerSec * dt);
      }
    },

    // Instant costs: wrong fix, call connect. Assist applies.
    spend(state, amount) {
      apply(state, state.battery - amount * costMult(state));
    },

    playCost,

    // Playback cost spread linearly over the voicemail's duration. Called by
    // voicemailFlow every frame; does nothing while paused.
    tickPlayback(state, dt) {
      const { playing, paused, playingId } = state.phone;
      if (!playing || paused || playingId == null || state.battery <= 0) return;
      const vm = VOICEMAILS[playingId];
      const perSec = (playCost(playingId) * costMult(state)) / vm.durationSec;
      apply(state, state.battery - perSec * dt);
    },

    // Returns whether the torch is now on. Forced off when hidden or dead.
    setTorch(state, on) {
      state.torchOn = Boolean(on) && state.battery > 0 && !state.player.hidden;
      return state.torchOn;
    },

    // Debug and presets only.
    set(state, value) {
      lastShown = null;
      apply(state, value);
    }
  };
}
