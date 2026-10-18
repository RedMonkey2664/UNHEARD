// HUD, phone, puzzle modals, subtitles and toasts, running on top of
// RoomScene. Reads GameState to draw and turns taps into system calls.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { CALL_TEXT, TAPE_MOMENT } from '../data/endings.js';
import { TEXTS } from '../data/texts.js';
import { VOICEMAILS } from '../data/voicemails.js';
import { bus } from '../systems/eventBus.js';
import { Subtitles } from '../audio/Subtitles.js';
import { CardAssembler } from '../ui/CardAssembler.js';
import { CounterDial } from '../ui/CounterDial.js';
import { Hud } from '../ui/Hud.js';
import { ItemPicker } from '../ui/ItemPicker.js';
import { Keypad } from '../ui/Keypad.js';
import { NoteReader } from '../ui/NoteReader.js';
import { PhoneUI } from '../ui/PhoneUI.js';
import { RadioDial } from '../ui/RadioDial.js';
import { Toast } from '../ui/Toast.js';
import { footstepMix } from '../systems/footsteps.js';
import { nearestHideSpot } from '../systems/hideSystem.js';
import { Button } from '../ui/Button.js';
import { createRng } from '../utils/rng.js';
import { textStyle } from '../ui/text.js';
import { COLORS, SPEAKER_CSS } from '../config/constants.js';

// Beats shown as a toast; the rest are SFX captions.
const TOAST_BEATS = ['HANDWRITING_LATER', 'WARM_WIRE'];
const CAPTION_SEC = 3;
const BARK_SEC = 2.5;
const VIBRATE_INVESTIGATE_MS = 40;
const VIBRATE_SPOTTED_MS = 200;

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.subs = [];
    this.events.once('shutdown', () => this.subs.forEach((off) => off()));
    const on = (name, fn) => this.subs.push(bus.on(name, fn));
    this.sys_ = this.registry.get('systems');
    this.modal = null;
    this.lineIndex = -1;
    this.rng = createRng(0x5eed);

    this.hud = new Hud(this, {
      torch: () => bus.emit('ui:torch', {}),
      sneak: () => bus.emit('ui:sneak', {}),
      phone: () => this.togglePhone(),
      call: () => this.onCall()
    });
    this.phone = new PhoneUI(this, {
      row: (id) => this.onRow(id),
      preview: (id) => this.result(this.sys_.flow.preview(this.state(), id)),
      fix: (id) => this.onFix(id),
      play: (id) => this.onPlay(id),
      pause: () => this.sys_.flow.togglePause(this.state()),
      call: () => this.onCall(),
      objective: () => this.showObjective(),
      hints: () => this.sys_.flow.hintsFor(this.state()),
      temptationRow: (content, x0, y, w) => this.temptationRow(content, x0, y, w)
    });
    this.subtitles = new Subtitles(this, 40);
    // Context button near the player: HIDE by a hide spot, COME OUT when hidden.
    this.hideButton = new Button(this, 480, 250, TEXTS.ui.hide, () => bus.emit('ui:hide', {}),
      { width: 130, height: 44, size: 18 });
    this.hideButton.setVisible(false);
    // Visual stand-in for spatial footsteps until audio (Stage 6): position
    // follows the real pan, opacity the real volume (docs/07 section 8.5).
    this.steps = this.add.text(480, 96, '[footsteps]', textStyle({ size: 16, style: 'italic',
      color: SPEAKER_CSS.SFX })).setOrigin(0.5).setAlpha(0);
    this.toast = new Toast(this, 40);

    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard;
    if (kb) {
      // Keyboard toggles are instant: repeated key actions should not animate.
      kb.addKey(K.P).on('down', () => this.togglePhone(true));
      kb.addKey(K.TAB).on('down', () => this.togglePhone(true));
      kb.addKey(K.SPACE).on('down', () => this.sys_.flow.togglePause(this.state()));
    }

    on('battery:changed', ({ value }) => this.hud.setBattery(value));
    on('ui:subtitle', ({ who, text, sec }) => this.subtitle(who, text, sec));
    on('ui:toast', ({ text, sec }) => this.toast.show(text, sec));
    on('ui:phone', () => this.togglePhone());
    on('ui:phone:show', ({ tab, sec }) => this.showPhoneFor(tab, sec));
    on('ui:objective', () => this.showObjective());
    on('puzzle:open', ({ type }) => this.openPuzzle(type));
    on('fix:fail', () => {
      this.toast.show(TEXTS.toasts.wrongFix);
      this.modal?.shake(this.state().settings.reduceFlash);
    });
    // The note reader stays open for JUMP SCARE 1, then closes.
    on('fix:success', ({ type }) => { if (type !== 'NOTE') this.closeModal(); });
    on('hollow:whisper', ({ text }) => this.subtitle('HOLLOW', text, CAPTION_SEC));
    on('nani:glimpse', ({ id }) => { if (id === 'NG1') this.subtitle('NANI', TEXTS.nani.chai, CAPTION_SEC); });
    on('nani:touch', () => this.subtitle('NANI', TEXTS.nani.touch, CAPTION_SEC));
    on('hollow:manifest', ({ full }) => {
      this.subtitle('SFX', full ? TEXTS.captions.MANIFEST_FULL : TEXTS.captions.MANIFEST, BALANCE.presence.manifestSec);
    });
    on('hollow:fade', () => this.subtitle('SFX', TEXTS.captions.HOLLOW_FADE, 2));
    // Spotted: a short red edge pulse; vibration only if enabled (docs/07 s5).
    on('vikram:spotted', () => {
      this.hud.spottedPulse();
      this.vibrate(VIBRATE_SPOTTED_MS);
    });
    on('vikram:state', ({ state }) => { if (state === 'INVESTIGATE') this.vibrate(VIBRATE_INVESTIGATE_MS); });
    on('message:received', () => this.notify());
    on('memory:end', () => this.notify());
    on('act:changed', () => this.showObjective());
    on('vm:preview', ({ vmId }) => {
      const label = VOICEMAILS[vmId].previewLabel || TEXTS.captions.PREVIEW_CLEAN;
      this.subtitle('SFX', label, BALANCE.vm.previewSec);
    });
    on('vm:play:end', ({ interrupted }) => {
      this.subtitles.hide();
      this.lineIndex = -1;
      if (interrupted) this.toast.show(TEXTS.toasts.lowBattery);
    });
    on('beat:fire', ({ id }) => this.beat(id));
    on('tape:start', () => {
      this.phone.close();
      TAPE_MOMENT.forEach((l) => this.time.delayedCall(l.at * 1000, () => this.subtitle(l.who, l.text, 3)));
    });
    on('call:connecting', () => this.subtitle('YOU', CALL_TEXT.whisper, BALANCE.final.callConnectSec));
    on('call:connected', () => this.subtitle('POLICE', CALL_TEXT.operator, 4));
    on('call:failed', () => this.toast.show(TEXTS.toasts.callDropped));
    on('siren:start', () => this.subtitle('SFX', CALL_TEXT.siren, 3));
    on('ending:trigger', () => {
      this.ending = true;
      this.closeModal();
      this.phone.close();
    });
    on('vikram:keyInLock', () => this.subtitle('SFX', TEXTS.captions.KEY_IN_LOCK, BALANCE.vikram.keyWarningSec));
    on('vikram:doorSlam', () => this.subtitle('SFX', TEXTS.captions.DOOR_SLAM, 2));
    on('vikram:bark', ({ text }) => this.subtitle('VIKRAM', text, BARK_SEC));
    on('noise:changed', ({ value }) => this.pauseNudge(value));

    this.hud.setBattery(this.state().battery);
  }

  // Read from the registry each time: a debug reset swaps the object.
  state() {
    return this.registry.get('state');
  }

  subtitle(who, text, sec) {
    this.subtitles.show(who, text, sec, this.state().settings.subtitleSize);
  }

  result(r) {
    if (r && !r.ok && TEXTS.toasts[r.reason]) this.toast.show(TEXTS.toasts[r.reason]);
    return r;
  }

  // --- phone --------------------------------------------------------------

  togglePhone(instant = false) {
    this.phone.toggle(instant);
    if (this.phone.isOpen()) this.hud.setPhoneDot(false);
  }

  showPhoneFor(tab, sec) {
    this.phone.open(tab);
    this.time.delayedCall(sec * 1000, () => {
      this.phone.close();
      this.hud.setPhoneDot(true);
    });
  }

  // With the phone closed mid-playback, the "Pause and hide." hint is a toast,
  // once per crossing of the investigate threshold.
  pauseNudge(value) {
    const s = this.state();
    const loud = value >= BALANCE.noise.investigateAt;
    if (loud && !this.wasLoud && s.phone.playing && !s.phone.paused && !s.phone.open) {
      this.toast.show(TEXTS.ui.pauseHint);
    }
    this.wasLoud = loud;
  }

  notify() {
    if (!this.phone.isOpen()) this.hud.setPhoneDot(true);
  }

  onRow(id) {
    const s = this.state();
    if (id == null) return this.toast.show(TEXTS.toasts.notYet);
    const status = s.voicemails[id].status;
    if (status === 'locked') return this.toast.show(TEXTS.toasts.notYet);
    if (status === 'done') return this.result(this.sys_.flow.play(s, id));   // replay
    return null;
  }

  onFix(id) {
    const r = this.result(this.sys_.flow.fixButton(this.state(), id));
    if (!r.ok) return;
    if (r.picker) {
      this.phone.close();
      this.openPuzzle('EARPHONES');
    } else {
      this.toast.show(r.toast);
    }
  }

  onPlay(id) {
    const r = this.sys_.flow.play(this.state(), id);
    if (!r.ok && r.reason !== 'needsFix') this.result(r);
  }

  showObjective() {
    this.hud.showObjective(TEXTS.objectives[this.state().act], BALANCE.prologue.objectiveSec);
  }

  // --- modals -------------------------------------------------------------

  openPuzzle(type) {
    this.closeModal();
    const s = this.state();
    const flow = this.sys_.flow;
    const onClose = () => this.closeModal();
    const fix = (vmId, input) => flow.attemptFix(s, vmId, input).ok;

    if (type === 'RADIO') {
      const audio = this.registry.get('audio');
      this.modal = new RadioDial(this, { onClose, onConfirm: (v) => fix(1, v),
        onChange: (v) => audio?.setRadio(true, v) });
    }
    if (type === 'COOKER') this.modal = new CounterDial(this, { onClose, onConfirm: (v) => fix(4, v) });
    if (type === 'CARD') {
      this.modal = new CardAssembler(this, { onClose, order: this.shuffledCard(),
        onConfirm: (order) => fix(2, order) });
    }
    if (type === 'NOTE') {
      this.modal = new NoteReader(this, { onClose, onRead: () => fix(5, null) });
    }
    if (type === 'EARPHONES') {
      this.modal = new ItemPicker(this, { onClose, tools: s.inventory.tools.slice(),
        onConfirm: (id) => fix(6, id) });
    }
    if (type === 'KEYPAD') {
      this.modal = new Keypad(this, { onClose, reduceFlash: s.settings.reduceFlash,
        onEnter: (code) => {
          const ok = this.sys_.finalAct.tryCode(s, code).ok;
          if (ok) this.closeModal();
          return ok;
        } });
    }
    if (this.modal) {
      this.phone.close();
      s.ui.puzzleOpen = true;
    }
  }

  // PLAY #8 NOW (docs/07 section 3): full width, teal, slow pulse. A lie.
  temptationRow(content, x0, y, w) {
    const b = new Button(this, x0 + w / 2, y + 18, TEXTS.ui.temptation,
      () => this.sys_.temptation.press(this.state()), { width: w - 16, height: 32, size: 16 });
    b.setColors({ fill: COLORS.hollowDeep, stroke: COLORS.cold, text: SPEAKER_CSS.HOLLOW });
    b.label.setColor(SPEAKER_CSS.HOLLOW);
    const sub = this.add.text(x0 + w / 2, y + 44, TEXTS.ui.temptationSub,
      textStyle({ size: 16, color: SPEAKER_CSS.HOLLOW })).setOrigin(0.5);
    content.add([...b.parts(), sub]);
    // A slow pulse: it wants to be pressed.
    this.tweens.add({ targets: [b.skin, b.label], alpha: 0.55, duration: 1400, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut' });
  }

  // Tray order is shuffled but never already in the right order.
  shuffledCard() {
    const ids = BALANCE.puzzles.cardOrder;
    let order = ids;
    while (order.every((id, i) => id === ids[i])) order = this.rng.shuffle(ids);
    return order;
  }

  closeModal() {
    if (!this.modal) return;
    this.registry.get('audio')?.setRadio(false, 0);
    this.modal.destroy();
    this.modal = null;
    this.state().ui.puzzleOpen = false;
  }

  // --- beats --------------------------------------------------------------

  beat(id) {
    const text = TEXTS.captions[id];
    if (!text) return;
    if (id === 'REFLECTION_SCARE' && this.modal instanceof NoteReader) {
      const sec = BALANCE.presence.js1Sec;
      this.modal.scare(this.state().settings.reduceFlash, sec);
      this.time.delayedCall(sec * 1000 + 800, () => this.closeModal());
    }
    if (TOAST_BEATS.includes(id)) this.toast.show(text, CAPTION_SEC);
    else this.subtitle('SFX', text, id === 'RADIO_TURNS_ON' ? BALANCE.beats.radioTuneSec : CAPTION_SEC);
  }

  // --- frame --------------------------------------------------------------

  update() {
    const s = this.state();
    this.hud.update(s);
    this.phone.update(s);
    this.updateHideButton(s);
    const mix = footstepMix(s);
    this.steps.setAlpha(mix ? mix.volume * (mix.muffled ? 0.7 : 1) : 0)
      .setX(480 + (mix ? mix.pan : 0) * 400);
    this.updateVoicemailLines(s);
  }

  updateHideButton(s) {
    const spot = nearestHideSpot(s);
    const show = !this.ending && (s.player.hidden || (spot && !s.player.locked));
    if (show !== this.hideButton.bg.visible) this.hideButton.setVisible(show);
    if (!show) return;
    this.hideButton.setText(s.player.hidden ? TEXTS.ui.comeOut : TEXTS.ui.hide);
    if (this.registry.get('view3d')) {
      this.hideButton.setPosition(480, 330);
      return;
    }
    const x = Phaser.Math.Clamp(s.player.x, 80, 880);
    this.hideButton.setPosition(x, 250);
  }

  vibrate(ms) {
    if (!this.state().settings.vibration || !navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch { /* not supported */ }
  }

  onCall() {
    const r = this.sys_.finalAct.call(this.state());
    if (!r.ok && TEXTS.toasts[r.reason]) this.toast.show(TEXTS.toasts[r.reason]);
  }

  // Subtitles follow the playback position, so pause and time scale just work.
  updateVoicemailLines(s) {
    if (!s.phone.playing) return;
    const lines = VOICEMAILS[s.phone.playingId].lines;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) if (lines[i].t <= s.phone.playPos) idx = i;
    if (idx !== this.lineIndex && idx >= 0) {
      this.lineIndex = idx;
      this.subtitle(lines[idx].who, lines[idx].text, null);
    }
  }
}
