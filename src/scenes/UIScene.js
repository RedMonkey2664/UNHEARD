// HUD, phone, puzzle modals, subtitles and toasts, running on top of
// RoomScene. Reads GameState to draw and turns taps into system calls.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
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
import { createRng } from '../utils/rng.js';

// Beats shown as a toast; the rest are SFX captions.
const TOAST_BEATS = ['HANDWRITING_LATER', 'WARM_WIRE'];
const CAPTION_SEC = 3;

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
      phone: () => this.togglePhone()
    });
    this.phone = new PhoneUI(this, {
      row: (id) => this.onRow(id),
      preview: (id) => this.result(this.sys_.flow.preview(this.state(), id)),
      fix: (id) => this.onFix(id),
      play: (id) => this.onPlay(id),
      pause: () => this.sys_.flow.togglePause(this.state()),
      objective: () => this.showObjective(),
      hints: () => this.sys_.flow.hintsFor(this.state())
    });
    this.subtitles = new Subtitles(this, 40);
    this.toast = new Toast(this, 40);

    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard;
    if (kb) {
      kb.addKey(K.P).on('down', () => this.togglePhone());
      kb.addKey(K.TAB).on('down', () => this.togglePhone());
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
    on('fix:success', () => this.closeModal());
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

  togglePhone() {
    this.phone.toggle();
    if (this.phone.isOpen()) this.hud.setPhoneDot(false);
  }

  showPhoneFor(tab, sec) {
    this.phone.open(tab);
    this.time.delayedCall(sec * 1000, () => {
      this.phone.close();
      this.hud.setPhoneDot(true);
    });
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

    if (type === 'RADIO') this.modal = new RadioDial(this, { onClose, onConfirm: (v) => fix(1, v) });
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

  // Tray order is shuffled but never already in the right order.
  shuffledCard() {
    const ids = BALANCE.puzzles.cardOrder;
    let order = ids;
    while (order.every((id, i) => id === ids[i])) order = this.rng.shuffle(ids);
    return order;
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.destroy();
    this.modal = null;
    this.state().ui.puzzleOpen = false;
  }

  // --- beats --------------------------------------------------------------

  beat(id) {
    const text = TEXTS.captions[id];
    if (!text) return;
    if (TOAST_BEATS.includes(id)) this.toast.show(text, CAPTION_SEC);
    else this.subtitle('SFX', text, id === 'RADIO_TURNS_ON' ? BALANCE.beats.radioTuneSec : CAPTION_SEC);
  }

  // --- frame --------------------------------------------------------------

  update() {
    const s = this.state();
    this.hud.update(s);
    this.phone.update(s);
    this.updateVoicemailLines(s);
  }

  // Subtitles follow the playback position, so pause and time scale just work.
  updateVoicemailLines(s) {
    if (!s.phone.playing) return;
    const lines = VOICEMAILS[s.phone.playingId].lines;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) if (lines[i].t <= s.phone.playPos) idx = i;
    if (idx !== this.lineIndex && idx >= 0) {
      this.lineIndex = idx;
      this.subtitle(lines[idx].who, lines[idx].hi, null);
    }
  }
}
