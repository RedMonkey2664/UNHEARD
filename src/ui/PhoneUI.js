// Phone panel (docs/07 section 3): VOICEMAIL, MESSAGES, NOTES. 300 x 380,
// anchored bottom right above the HUD buttons, slides up in 0.25 s. The game
// keeps running behind it.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { COLORS, CSS } from '../config/constants.js';
import { EVIDENCE } from '../data/items.js';
import { TEXTS } from '../data/texts.js';
import { VOICEMAILS } from '../data/voicemails.js';
import { VM_COUNT } from '../systems/gameState.js';
import { currentVmId } from '../systems/interaction.js';
import { clockLabel } from '../systems/messages.js';
import { Button } from './Button.js';
import { textStyle } from './text.js';

const X0 = 646;
const Y0 = 76;
const W = 300;
const H = 384;
const CONTENT_Y = Y0 + 80;
const CONTENT_H = H - 86;
const ROW_H = 24;
const SLIDE_MS = 250;
const TABS = ['VOICEMAIL', 'MESSAGES', 'NOTES'];
const STATUS_LABEL = { locked: 'locked', damaged: 'DAMAGED', fixed: 'FIXED',
  playing: 'PLAYING', memory: '...', done: 'done' };

export class PhoneUI {
  // actions: { preview(id), fix(id), play(id), pause(), objective() }
  constructor(scene, actions) {
    this.scene = scene;
    this.actions = actions;
    this.root = scene.add.container(0, 0).setDepth(25).setVisible(false);
    this.sig = '';

    const panel = scene.add.rectangle(X0 + W / 2, Y0 + H / 2, W, H, COLORS.panel, 0.92)
      .setStrokeStyle(1, COLORS.line).setInteractive();
    this.timeText = scene.add.text(X0 + 14, Y0 + 16, '', textStyle({ size: 16, align: 'left' }))
      .setOrigin(0, 0.5);
    this.batText = scene.add.text(X0 + W - 14, Y0 + 16, '', textStyle({ size: 16, align: 'right' }))
      .setOrigin(1, 0.5);
    this.root.add([panel, this.timeText, this.batText]);

    this.tabButtons = TABS.map((tab, i) => new Button(scene, X0 + 52 + i * 98, Y0 + 52, tab,
      () => this.setTab(tab), { width: 94, height: 44, size: 16 }).addTo(this.root));

    this.content = scene.add.container(0, 0);
    this.root.add(this.content);
    this.progress = scene.add.graphics();
    this.root.add(this.progress);
    // Reacts to noise, not to Vikram's state, so the AI is never revealed.
    this.pauseHint = scene.add.text(X0 + W / 2, Y0 + H - 16, TEXTS.ui.pauseHint,
      textStyle({ size: 16, color: '#E58C79' })).setOrigin(0.5).setVisible(false);
    this.root.add(this.pauseHint);

    // NOTES and MESSAGES can be longer than the panel: mask and drag to scroll.
    const maskShape = scene.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff).fillRect(X0, CONTENT_Y - 4, W, CONTENT_H + 4);
    this.content.setMask(maskShape.createGeometryMask());
    this.scroll = 0;
    this.maxScroll = 0;
    panel.on('pointermove', (p) => {
      if (!p.isDown || this.tab() === 'VOICEMAIL') return;
      this.setScroll(this.scroll - (p.y - p.prevPosition.y));
    });
    panel.on('wheel', (_p, _dx, dy) => this.setScroll(this.scroll + dy * 0.5));
  }

  state() {
    return this.scene.registry.get('state');
  }

  tab() {
    return this.state().phone.tab;
  }

  isOpen() {
    return this.state().phone.open;
  }

  open(tab) {
    const s = this.state();
    if (tab) s.phone.tab = tab;
    if (s.phone.open) return;
    s.phone.open = true;
    this.sig = '';
    this.root.setVisible(true).setY(H);
    this.scene.tweens.add({ targets: this.root, y: 0, duration: SLIDE_MS, ease: 'Quad.easeOut' });
  }

  close() {
    const s = this.state();
    if (!s.phone.open) return;
    s.phone.open = false;
    this.scene.tweens.add({ targets: this.root, y: H, duration: SLIDE_MS, ease: 'Quad.easeIn',
      onComplete: () => { if (!this.state().phone.open) this.root.setVisible(false); } });
  }

  toggle() {
    if (this.isOpen()) this.close(); else this.open();
  }

  setTab(tab) {
    this.state().phone.tab = tab;
    this.scroll = 0;
  }

  setScroll(v) {
    this.scroll = Phaser.Math.Clamp(v, 0, this.maxScroll);
    this.content.setY(-this.scroll);
  }

  // --- frame --------------------------------------------------------------

  update(state) {
    if (!state.phone.open) return;
    this.timeText.setText(clockLabel(state.clock.runSeconds));
    this.batText.setText('BAT ' + Math.ceil(state.battery) + '%');
    this.tabButtons.forEach((b, i) => b.setSelected(TABS[i] === state.phone.tab));

    const sig = this.signature(state);
    if (sig !== this.sig) {
      this.sig = sig;
      this.rebuild(state);
    }
    this.drawProgress(state);
    this.pauseHint.setVisible(state.phone.playing && !state.phone.paused &&
      state.noise >= BALANCE.noise.investigateAt);
  }

  // Rebuild only when something the panel shows has changed.
  signature(state) {
    const vms = [];
    for (let id = 1; id <= VM_COUNT; id++) vms.push(state.voicemails[id].status);
    return [state.phone.tab, vms.join(), state.phone.playing, state.phone.paused,
      state.phone.playingId, state.messages.length, state.inventory.evidence.length,
      this.actions.hints().length, state.act, state.flags.temptationShown].join('|');
  }

  rebuild(state) {
    this.content.removeAll(true);
    this.progressY = null;
    this.setScroll(0);
    this.maxScroll = 0;
    if (state.phone.tab === 'VOICEMAIL') this.buildVoicemail(state);
    if (state.phone.tab === 'MESSAGES') this.buildMessages(state);
    if (state.phone.tab === 'NOTES') this.buildNotes(state);
  }

  addText(x, y, str, opts) {
    const t = this.scene.add.text(x, y, str, textStyle({ size: 16, align: 'left', ...opts }));
    this.content.add(t);
    return t;
  }

  buildVoicemail(state) {
    const cur = currentVmId(state);
    let y = CONTENT_Y;
    for (let id = 1; id <= VM_COUNT + 1; id++) {
      const isEight = id === VM_COUNT + 1;
      const vm = VOICEMAILS[id];
      const status = isEight ? 'locked' : state.voicemails[id].status;
      const done = status === 'done';
      const color = done ? CSS.dim : status === 'locked' ? '#59605E' : CSS.cream;
      const row = this.scene.add.rectangle(X0 + W / 2, y + ROW_H / 2, W - 12, ROW_H, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => this.actions.row(isEight ? null : id));
      this.content.add(row);
      const title = isEight ? '??? ??? ???' : vm.title;
      this.addText(X0 + 12, y + 4, `${id}  ${title}`, { color });
      const stamp = isEight ? '' : vm.stamp + '  ';
      this.addText(X0 + W - 12, y + 4, stamp + STATUS_LABEL[status], { color, align: 'right' })
        .setOrigin(1, 0);
      y += ROW_H;

      if (id === cur && !state.phone.playing) {
        const s = state.voicemails[id].status;
        const mk = (dx, label, fn, enabled) => {
          const b = new Button(this.scene, X0 + dx, y + 22, label, fn, { width: 90, height: 40, size: 16 });
          b.setEnabled(enabled);
          this.content.add([b.bg, b.label]);
        };
        mk(52, 'PREVIEW 3s', () => this.actions.preview(id), true);
        mk(150, 'FIX', () => this.actions.fix(id), s === 'damaged');
        mk(248, 'PLAY', () => this.actions.play(id), s === 'fixed');
        y += 48;
      }
      if (state.phone.playing && state.phone.playingId === id) {
        const b = new Button(this.scene, X0 + 56, y + 22, state.phone.paused ? 'RESUME' : 'PAUSE',
          () => this.actions.pause(), { width: 100, height: 40, size: 16 });
        this.content.add([b.bg, b.label]);
        this.progressY = y + 22;
        y += 48;
      }
    }
    if (state.flags.temptationShown) this.actions.temptationRow?.(this.content, X0, y, W);
  }

  buildMessages(state) {
    let y = CONTENT_Y;
    if (!state.messages.length) this.addText(X0 + 12, y, TEXTS.ui.emptyNotes, { color: CSS.dim });
    for (const m of state.messages) {
      this.addText(X0 + 12, y, `${m.from}  ·  ${m.time}`, { color: CSS.dim });
      y += 22;
      const t = this.addText(X0 + 12, y, m.text, { color: CSS.cream, wrap: W - 24 });
      y += t.height + 14;
    }
    this.maxScroll = Math.max(0, y - (CONTENT_Y + CONTENT_H));
  }

  buildNotes(state) {
    let y = CONTENT_Y;
    const heading = (label) => {
      this.addText(X0 + 12, y, label, { color: CSS.lamp });
      y += 22;
    };
    const para = (str, color = CSS.text) => {
      const t = this.addText(X0 + 12, y, str, { color, wrap: W - 24 });
      y += t.height + 8;
      return t;
    };

    heading('OBJECTIVE');
    const obj = para(TEXTS.objectives[state.act], CSS.cream);
    obj.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.actions.objective());

    const hints = this.actions.hints();
    if (hints.length) {
      heading('HINT');
      hints.forEach((h) => para(h, CSS.dim));
    }
    if (state.flags.tapeTaken) para(TEXTS.ui.callTip, CSS.dim);

    heading('EVIDENCE');
    if (!state.inventory.evidence.length) para(TEXTS.ui.emptyNotes, CSS.dim);
    for (const id of state.inventory.evidence) para(`${EVIDENCE[id].name} - ${EVIDENCE[id].desc}`);

    if (state.inventory.evidence.includes('E4')) {
      heading('LOCKER CODE');
      para('0614', CSS.cream);
    }
    this.maxScroll = Math.max(0, y - (CONTENT_Y + CONTENT_H));
  }

  drawProgress(state) {
    const g = this.progress;
    g.clear();
    if (!state.phone.playing || state.phone.tab !== 'VOICEMAIL' || this.progressY == null) return;
    const dur = VOICEMAILS[state.phone.playingId].durationSec;
    const x = X0 + 120;
    const w = W - 136;
    g.fillStyle(COLORS.line, 1).fillRect(x, this.progressY - 3, w, 6);
    g.fillStyle(COLORS.cream, 1).fillRect(x, this.progressY - 3, w * Math.min(1, state.phone.playPos / dur), 6);
  }
}
