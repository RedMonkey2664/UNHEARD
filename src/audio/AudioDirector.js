// The one place sound is played (docs/02 section 9, docs/07 section 8).
// Channels: voice, sfx, ambience, music, hollow, footsteps. If a file is
// missing, play() uses the fallback duration from data/assets.js and still
// emits audio:start / audio:end, so the game runs in silence.

import { BALANCE } from '../config/balance.js';
import { fallbackDuration } from '../data/assets.js';
import { VOICEMAILS } from '../data/voicemails.js';
import { footstepMix } from '../systems/footsteps.js';
import { vikramSpeed } from '../systems/vikramAI.js';
import { checkWhen } from '../systems/interaction.js';
import { clamp } from '../utils/math.js';
import { ambienceGains, approach, barkKey, dbToGain, dreadGain, heartbeatGain, stepInterval,
  stingerGain, whisperGain, whisperKey } from './mix.js';

const A = BALANCE.audio;
const P = BALANCE.player;
const VOICE_CHANNELS = ['voice'];
const STEP_KEYS = 4;          // sfx_step_*_01..04
const WHISTLES = 4;           // "four whistles" (docs/05 section 3)
const FORESHADOW_STEPS = 6;
// The player hears through doors without a low-pass filter (Phaser has no
// built-in one), so adjacent footsteps use the no-filter level.
const HAS_FILTER = false;

export class AudioDirector {
  constructor(game, bus) {
    this.game = game;
    this.bus = bus;
    this.loops = {};
    this.voice = null;
    this.voiceCount = 0;
    this.vikStepTimer = 0;
    this.playerStepTimer = 0;
    this.stepIndex = 0;
    this.lowBatteryTimer = 0;
    this.memory = false;
    this.inRoom = false;
    this.radio = { open: false, value: 0 };
    this.offs = [];
    this.bind();
  }

  state() {
    return this.game.registry.get('state');
  }

  settings() {
    return this.state()?.settings || this.game.registry.get('settings');
  }

  has(key) {
    return Boolean(key) && this.game.cache.audio.exists(key);
  }

  channelGain(channel) {
    const s = this.settings();
    if (channel === 'voice') return this.game.registry.get('muteVoices') ? 0 : s.volVoice;
    return s.volSfx;
  }

  // Returns the Phaser sound, or null when the file is missing.
  play(key, { channel = 'sfx', gain = 1, pan = 0, onEnd = null } = {}) {
    this.bus.emit('audio:start', { key, channel });
    const isVoice = VOICE_CHANNELS.includes(channel);
    const finish = () => {
      if (isVoice) this.voiceCount = Math.max(0, this.voiceCount - 1);
      this.bus.emit('audio:end', { key, channel });
      if (onEnd) onEnd();
    };
    if (isVoice) this.voiceCount++;
    if (!this.has(key)) {
      setTimeout(finish, fallbackDuration(key) * 1000);
      return null;
    }
    const snd = this.game.sound.add(key);
    snd.play({ volume: clamp(gain * this.channelGain(channel), 0, 1) });
    if (pan && snd.setPan) snd.setPan(clamp(pan, -1, 1));
    snd.once('complete', () => { snd.destroy(); finish(); });
    snd.once('stop', () => { snd.destroy(); finish(); });
    return snd;
  }

  stingers() {
    return stingerGain(this.settings().reduceFlash);
  }

  // Persistent loops fade toward a target each frame.
  setLoop(key, target, channel = 'sfx') {
    let l = this.loops[key];
    if (!l) {
      if (!this.has(key)) return;
      const snd = this.game.sound.add(key, { loop: true, volume: 0 });
      snd.play();
      l = this.loops[key] = { snd, current: 0, target: 0, channel };
    }
    l.target = target;
  }

  stopLoops() {
    for (const l of Object.values(this.loops)) l.target = 0;
  }

  // Immediate silence (the ending scene owns the sound from here).
  silenceLoops() {
    for (const l of Object.values(this.loops)) {
      l.target = 0;
      l.current = 0;
      l.snd.setVolume(0);
    }
  }

  // --- events -------------------------------------------------------------

  bind() {
    const on = (name, fn) => this.offs.push(this.bus.on(name, (p) => fn(p || {}, this.state())));
    const sfx = (key, gain = 1) => this.play(key, { gain });

    on('hotspot:interact', () => sfx('sfx_interact'));
    on('item:added', () => sfx('sfx_pickup'));
    on('evidence:added', () => sfx('sfx_pickup'));
    on('fix:fail', () => sfx('sfx_wrong'));
    on('fix:success', () => sfx('sfx_fix_ok'));
    on('room:enter', (p) => { if (!p.teleport) sfx('sfx_door_open'); });
    on('message:received', () => sfx('sfx_phone_buzz'));
    on('locker:wrong', () => sfx('sfx_wrong'));

    on('vm:preview', ({ vmId }) => {
      const key = this.has(`vm${vmId}_damaged`) ? `vm${vmId}_damaged` : VOICEMAILS[vmId].audio;
      const snd = this.play(key, { channel: 'voice', gain: dbToGain(A.voicemailDb) });
      if (snd) setTimeout(() => snd.isPlaying && snd.stop(), BALANCE.vm.previewSec * 1000);
    });
    on('vm:play:start', ({ vmId }, s) => {
      this.stopVoice();
      this.voice = this.play(VOICEMAILS[vmId].audio, { channel: 'voice', gain: dbToGain(A.voicemailDb) });
      // At Presence >= 60 the Hollow is mixed under the voicemail.
      if (s && s.presence >= BALANCE.presence.thresholds.whisper) {
        this.play(whisperKey('H1'), { channel: 'hollow', gain: whisperGain(s.presence) });
      }
    });
    on('vm:play:pause', ({ paused }) => {
      if (!this.voice) return;
      if (paused) this.voice.pause(); else this.voice.resume();
    });
    on('vm:play:end', () => this.stopVoice());

    on('beat:fire', ({ id }, s) => {
      if (id === 'RADIO_TURNS_ON') sfx('sfx_radio_tune');
      if (id === 'WINDOW_REOPENS') sfx('sfx_window_open');
      if (id === 'PHANTOM_WHISTLES') {
        for (let i = 0; i < WHISTLES; i++) {
          setTimeout(() => sfx('sfx_cooker_whistle', A.smallSfxGain), i * A.whistleGapMs);
        }
      }
      if (id === 'REFLECTION_SCARE') sfx('sfx_stinger_1', this.stingers());
      if (id === 'TV_STATIC_SCARE') {
        sfx('sfx_tv_static');
        if (s && s.player.room === 'LIVING') sfx('sfx_stinger_3', this.stingers());
      }
      if (id === 'FORESHADOW') {
        // Footsteps far away on the stairs: they climb, stop, go away.
        for (let i = 0; i < FORESHADOW_STEPS; i++) {
          setTimeout(() => sfx(`sfx_step_vik_0${(i % STEP_KEYS) + 1}`, A.foreshadowGain), i * A.foreshadowStepMs);
        }
      }
    });
    on('windows:open', () => sfx('sfx_window_open'));

    on('vikram:keyInLock', () => sfx('sfx_key_lock'));
    on('vikram:doorSlam', () => sfx('sfx_door_slam'));
    on('vikram:door', ({ room, from }) => {
      if (from === null && room === 'HALL') sfx('sfx_door_open');
      if (room === null) sfx('sfx_door_close');
    });
    on('vikram:bark', ({ set, index }, s) => {
      let gain = dbToGain(A.barkDb);
      if (set === 'away') gain *= A.awayBarkGain;
      else if (s) gain *= (footstepMix({ ...s, vikram: { ...s.vikram, moving: true } }, HAS_FILTER)?.volume ?? 1);
      this.play(barkKey(set, index), { channel: 'voice', gain });
    });
    on('vikram:spotted', () => sfx('sfx_breath_hold'));

    on('nani:warn', () => sfx('sfx_lamp_tick'));
    on('nani:glimpse', ({ id }) => { if (id === 'NG1') this.play('nani_chai', { channel: 'voice' }); });
    on('nani:touch', () => this.play('nani_touch', { channel: 'voice' }));
    on('presence:threshold', ({ name }) => { if (name === 'flicker') sfx('sfx_flicker'); });
    on('hollow:whisper', ({ id }, s) => {
      this.play(whisperKey(id), { channel: 'hollow', gain: whisperGain(s ? s.presence : 60) });
    });
    on('hollow:manifest', ({ full }) => sfx(full ? 'sfx_stinger_2' : 'sfx_tv_static',
      full ? this.stingers() : A.smallSfxGain));

    on('tape:start', () => {
      sfx('sfx_tape_click');
      this.play('tape_clip', { channel: 'voice', gain: dbToGain(A.voicemailDb) });
    });
    on('call:connected', () => this.play('op_1', { channel: 'voice', gain: A.smallSfxGain }));

    on('memory:start', () => { this.memory = true; });
    on('memory:end', () => { this.memory = false; });
    on('ending:trigger', () => {
      this.inRoom = false;
      this.stopVoice();
      this.silenceLoops();
    });
  }

  stopVoice() {
    if (this.voice && this.voice.isPlaying) this.voice.stop();
    this.voice = null;
  }

  // --- frame (called by RoomScene, and with inRoom false elsewhere) --------

  update(state, dt, inRoom) {
    this.inRoom = inRoom;
    const ducked = this.voiceCount > 0;
    const sfxVol = this.channelGain('sfx');

    if (inRoom && state && !this.memory) {
      const amb = ambienceGains(state.presence, ducked);
      const muffle = state.player.hidden ? A.hiddenMuffle : 1;   // hiding muffles the room
      this.setLoop('amb_flat_loop', amb.flat * muffle * sfxVol, 'ambience');
      this.setLoop('amb_cold_loop', amb.cold * muffle * sfxVol, 'ambience');
      this.setLoop('music_dread_loop', dreadGain(state.act, ducked) * sfxVol, 'music');
      this.setLoop('music_memory_loop', 0, 'music');
      this.setLoop('sfx_heartbeat_loop', heartbeatGain(state.noise) * sfxVol);
      const rain = checkWhen({ vmCurrent: 3 }, state) && state.windowsClosed.length < 3;
      this.setLoop('sfx_rain_loop', rain ? dbToGain(A.rainDb) * sfxVol : 0);
      const siren = state.flags.sirenStarted
        ? clamp(1 - state.flags.policeEta / BALANCE.final.sirenAtEta, A.sirenMinGain, 1) * sfxVol : 0;
      this.setLoop('sfx_siren_loop', siren);
      this.setLoop('sfx_radio_static', this.radioLevel() * sfxVol);
      this.footsteps(state, dt);
      this.lowBattery(state, dt);
    } else if (this.memory) {
      this.stopLoops();
      // Memories: only a warm, muffled room tone under the memory music.
      this.setLoop('amb_flat_loop', dbToGain(A.ambienceDb) * A.hiddenMuffle * sfxVol, 'ambience');
      this.setLoop('music_memory_loop', dbToGain(A.musicDb) * sfxVol, 'music');
    } else {
      this.stopLoops();
    }

    for (const l of Object.values(this.loops)) {
      l.current = approach(l.current, l.target, dt);
      l.snd.setVolume(l.current);
    }
  }

  footsteps(state, dt) {
    const mix = footstepMix(state, HAS_FILTER);
    this.vikStepTimer -= dt;
    if (mix && this.vikStepTimer <= 0) {
      this.vikStepTimer = stepInterval(vikramSpeed(state));
      this.stepIndex = (this.stepIndex % STEP_KEYS) + 1;
      this.play(`sfx_step_vik_0${this.stepIndex}`, { channel: 'footsteps',
        gain: mix.volume * dbToGain(A.footstepDb), pan: mix.pan });
    }
    const p = state.player;
    this.playerStepTimer -= dt;
    if (p.moving && this.playerStepTimer <= 0) {
      this.playerStepTimer = stepInterval(p.sneaking ? P.sneakSpeed : P.walkSpeed);
      this.play(`sfx_step_player_0${(this.stepIndex % STEP_KEYS) + 1}`, { channel: 'footsteps',
        gain: dbToGain(A.playerStepDb) * (p.sneaking ? A.sneakStepGain : 1) });
    }
  }

  lowBattery(state, dt) {
    if (state.battery <= 0 || state.battery >= 15) {
      this.lowBatteryTimer = 0;
      return;
    }
    this.lowBatteryTimer -= dt;
    if (this.lowBatteryTimer <= 0) {
      this.lowBatteryTimer = A.lowBatteryToneEvery;
      this.play('sfx_battery_low', { gain: A.smallSfxGain });
    }
  }

  // The radio dial (RadioDial calls this): static while it is open.
  setRadio(open, value) {
    this.radio.open = open;
    this.radio.value = value;
  }

  // Static quietens near 94.3, but only within nearMhz: a small gift to the ear.
  radioLevel() {
    if (!this.radio.open) return 0;
    const R = BALANCE.puzzles.radio;
    const d = Math.abs(this.radio.value - R.solution);
    const t = d >= R.nearMhz ? 1 : d / R.nearMhz;
    return (A.radioStaticFloor + (1 - A.radioStaticFloor) * t) * dbToGain(A.radioStaticDb);
  }
}
