// Phone panel (docs/07 section 3, styled per docs/10 section 6): a phone
// device with VOICEMAIL, MESSAGES and NOTES. The screen is 300 x 384,
// anchored bottom right above the HUD buttons; it slides up in 0.25 s. The
// game keeps running behind it.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { COLORS, CSS, PHONE_LAYOUT } from '../config/constants.js';
import { DEVICE } from '../utils/device.js';
import { EVIDENCE } from '../data/items.js';
import { TEXTS } from '../data/texts.js';
import { VOICEMAILS } from '../data/voicemails.js';
import { PHONE_DEVICE } from '../render/art/uiArt.js';
import { VM_COUNT } from '../systems/gameState.js';
import { currentVmId } from '../systems/interaction.js';
import { clockLabel } from '../systems/messages.js';
import { Button } from './Button.js';
import { textStyle } from './text.js';

// Desktop or touch layout (docs/00 decisions: the mobile version).
const PL = DEVICE.touch ? PHONE_LAYOUT.touch : PHONE_LAYOUT.desk;
const X0 = PL.x0;
const Y0 = PL.y0;
const W = PL.w;
const H = PL.h;
const BTN_H = PL.btnH;
const COL_W = (W - 24) / 3;          // three action buttons across a row
const colX = (i) => X0 + 12 + COL_W * (i + 0.5);
const CONTENT_Y = Y0 + 78;
const CONTENT_H = H - 84;
const ROW_H = PL.rowH;
const OPEN_MS = 250;
const CLOSE_MS = 180;
const TABS = ['VOICEMAIL', 'MESSAGES', 'NOTES'];
const TAB_NAMES = { VOICEMAIL: 'Voicemail', MESSAGES: 'Messages', NOTES: 'Notes' };
const hex = (c) => '#' + c.toString(16).padStart(6, '0');

// Status chips (docs/10): text, fill, text colour.
const CHIPS = {
  locked: ['LOCKED', COLORS.chipLocked, '#6B7472'],
  damaged: ['DAMAGED', COLORS.chipDamaged, hex(COLORS.amber)],
  fixed: ['FIXED', COLORS.chipFixed, hex(COLORS.green)],
  playing: ['PLAYING', COLORS.wall, CSS.cream],
  memory: ['...', COLORS.wall, CSS.cream],
  done: ['DONE', COLORS.chipDone, CSS.dim]
};

export class PhoneUI {
  // actions: { row, preview, fix, play, pause, call, objective, hints, temptationRow }
  constructor(scene, actions) {
    this.scene = scene;
    this.actions = actions;
    this.root = scene.add.container(0, 0).setDepth(25).setVisible(false);
    this.sig = '';

    const P = PHONE_DEVICE;
    const device = scene.add.image(X0 - P.bezel, Y0 - P.bezel, 'ui_phone').setOrigin(0, 0);
    // The whole device swallows taps; the room above it stays tappable.
    const panel = scene.add.rectangle(X0 + W / 2, Y0 + H / 2, W + P.bezel * 2, H + P.bezel * 2,
      COLORS.panel, 0.001).setInteractive();
    this.timeText = scene.add.text(X0 + 18, Y0 + 14, '', textStyle({ size: 16, align: 'left', color: CSS.dim }))
      .setOrigin(0, 0.5);
    this.batText = scene.add.text(X0 + W - 18, Y0 + 14, '', textStyle({ size: 16, align: 'right', color: CSS.dim }))
      .setOrigin(1, 0.5);
    this.root.add([device, panel, this.timeText, this.batText]);

    // Tabs: plain words with an underline under the open one.
    this.tabs = TABS.map((tab, i) => {
      const cx = X0 + W / 6 + (i * W) / 3;
      const hit = scene.add.rectangle(cx, Y0 + 46, W / 3 - 4, 44, COLORS.panel, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.setTab(tab));
      const label = scene.add.text(cx, Y0 + 44, TAB_NAMES[tab], textStyle({ size: 16 })).setOrigin(0.5);
      this.root.add([hit, label]);
      return { tab, label };
    });
    this.underline = scene.add.graphics();
    this.root.add(this.underline);
    this.drawnTab = null;

    this.content = scene.add.container(0, 0);
    this.root.add(this.content);
    this.progress = scene.add.graphics();
    this.root.add(this.progress);
    // Reacts to noise, not to Vikram's state, so the AI is never revealed.
    this.pauseHint = scene.add.text(X0 + W / 2, Y0 + H - 18, TEXTS.ui.pauseHint,
      textStyle({ size: 16, color: hex(COLORS.danger) })).setOrigin(0.5).setVisible(false);
    this.root.add(this.pauseHint);

    // NOTES and MESSAGES can be longer than the screen: mask and drag to scroll.
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

  // instant: keyboard toggles skip the slide (they repeat, so motion would lag).
  open(tab, instant = false) {
    const s = this.state();
    if (tab) s.phone.tab = tab;
    if (s.phone.open) return;
    s.phone.open = true;
    this.sig = '';
    this.scene.tweens.killTweensOf(this.root);
    this.root.setVisible(true);
    if (instant) {
      this.root.setY(0);
      return;
    }
    this.root.setY(H * 0.6);
    this.scene.tweens.add({ targets: this.root, y: 0, duration: OPEN_MS, ease: 'Quart.easeOut' });
  }

  close(instant = false) {
    const s = this.state();
    if (!s.phone.open) return;
    s.phone.open = false;
    this.scene.tweens.killTweensOf(this.root);
    if (instant) {
      this.root.setVisible(false);
      return;
    }
    this.scene.tweens.add({ targets: this.root, y: H * 0.6, duration: CLOSE_MS, ease: 'Quart.easeOut',
      onComplete: () => { if (!this.state().phone.open) this.root.setVisible(false); } });
  }

  toggle(instant = false) {
    if (this.isOpen()) this.close(instant); else this.open(null, instant);
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
    this.batText.setText(Math.ceil(state.battery) + '%');
    this.drawTabs(state.phone.tab);

    const sig = this.signature(state);
    if (sig !== this.sig) {
      this.sig = sig;
      this.rebuild(state);
    }
    this.drawProgress(state);
    this.pauseHint.setVisible(state.phone.playing && !state.phone.paused &&
      state.noise >= BALANCE.noise.investigateAt);
  }

  drawTabs(active) {
    if (active === this.drawnTab) return;
    this.drawnTab = active;
    const g = this.underline.clear();
    for (const t of this.tabs) {
      const on = t.tab === active;
      t.label.setColor(on ? CSS.cream : CSS.dim);
      if (on) g.fillStyle(COLORS.cream, 1).fillRoundedRect(t.label.x - t.label.width / 2, Y0 + 56, t.label.width, 2, 1);
    }
    g.fillStyle(COLORS.line, 1).fillRect(X0 + 8, Y0 + 64, W - 16, 1);
  }

  // Rebuild only when something the panel shows has changed.
  signature(state) {
    const vms = [];
    for (let id = 1; id <= VM_COUNT; id++) vms.push(state.voicemails[id].status);
    return [state.phone.tab, vms.join(), state.phone.playing, state.phone.paused,
      state.phone.playingId, state.messages.length, state.inventory.evidence.length,
      this.actions.hints().length, state.act, state.flags.temptationShown,
      state.flags.tapeMoment === null, state.flags.callConnecting, state.flags.callConnected].join('|');
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

  chip(status, rightX, y) {
    const [label, fill, color] = CHIPS[status];
    const t = this.scene.add.text(0, y, label, textStyle({ size: 16, color })).setOrigin(1, 0.5);
    const w = t.width + 14;
    t.setX(rightX - 7);
    const g = this.scene.add.graphics();
    g.fillStyle(fill, 1).fillRoundedRect(rightX - w, y - 10, w, 20, 10);
    this.content.add([g, t]);
    return w;
  }

  addButton(x, y, label, fn, w, h = BTN_H) {
    const b = new Button(this.scene, x, y, label, fn, { width: w, height: h, size: 16 });
    this.content.add(b.parts());
    return b;
  }

  buildVoicemail(state) {
    const cur = currentVmId(state);
    let y = CONTENT_Y;
    const f = state.flags;
    if (f.tapeTaken && f.tapeMoment === null && !f.callConnected) {
      const b = this.addButton(X0 + W / 2, y + 20, f.callConnecting ? 'Calling 112...' : 'Call 112',
        () => this.actions.call(), W - 24);
      b.setColors({ fill: COLORS.greenDark, stroke: COLORS.green, text: CSS.cream });
      y += 48;
    }
    for (let id = 1; id <= VM_COUNT + 1; id++) {
      const isEight = id === VM_COUNT + 1;
      const vm = VOICEMAILS[id];
      const status = isEight ? 'locked' : state.voicemails[id].status;
      const color = status === 'done' ? CSS.dim : status === 'locked' ? '#59605E' : CSS.cream;
      const mid = y + ROW_H / 2;
      const row = this.scene.add.rectangle(X0 + W / 2, mid, W - 12, ROW_H, COLORS.panel, 0.001)
        .setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => this.actions.row(isEight ? null : id));
      this.content.add(row);
      this.addText(X0 + 14, mid, String(id), { color: CSS.dim }).setOrigin(0, 0.5);
      this.addText(X0 + 32, mid, isEight ? '??? ??? ???' : vm.title, { color }).setOrigin(0, 0.5);
      const chipW = this.chip(status, X0 + W - 12, mid);
      if (!isEight) {
        this.addText(X0 + W - 18 - chipW, mid, vm.stamp, { color: '#59605E' }).setOrigin(1, 0.5);
      }
      y += ROW_H;

      if (id === cur && !state.phone.playing) {
        const s = state.voicemails[id].status;
        const by = y + BTN_H / 2 + 4;
        this.addButton(colX(0), by, 'Preview 3s', () => this.actions.preview(id), COL_W - 4);
        this.addButton(colX(1), by, 'Fix', () => this.actions.fix(id), COL_W - 4).setEnabled(s === 'damaged');
        this.addButton(colX(2), by, 'Play', () => this.actions.play(id), COL_W - 4).setEnabled(s === 'fixed');
        y += BTN_H + 10;
      }
      if (state.phone.playing && state.phone.playingId === id) {
        const by = y + BTN_H / 2 + 4;
        this.addButton(colX(0), by, state.phone.paused ? 'Resume' : 'Pause', () => this.actions.pause(), COL_W - 4);
        this.progressY = by;
        y += BTN_H + 10;
      }
    }
    if (state.flags.temptationShown) this.actions.temptationRow?.(this.content, X0, y, W);
  }

  buildMessages(state) {
    let y = CONTENT_Y;
    if (!state.messages.length) this.addText(X0 + 14, y, TEXTS.ui.emptyNotes, { color: CSS.dim });
    for (const m of state.messages) {
      this.addText(X0 + 14, y, m.from, { color: CSS.cream });
      this.addText(X0 + W - 14, y, m.time, { color: CSS.dim, align: 'right' }).setOrigin(1, 0);
      y += 22;
      const t = this.addText(X0 + 14, y, m.text, { color: CSS.text, wrap: W - 28 });
      y += t.height + 16;
    }
    this.maxScroll = Math.max(0, y - (CONTENT_Y + CONTENT_H));
  }

  buildNotes(state) {
    let y = CONTENT_Y;
    const heading = (label) => {
      this.addText(X0 + 14, y, label, { color: CSS.lamp });
      y += 22;
    };
    const para = (str, color = CSS.text) => {
      const t = this.addText(X0 + 14, y, str, { color, wrap: W - 28 });
      y += t.height + 10;
      return t;
    };

    heading('Objective');
    const obj = para(TEXTS.objectives[state.act], CSS.cream);
    obj.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.actions.objective());

    const hints = this.actions.hints();
    if (hints.length) {
      heading('Hint');
      hints.forEach((h) => para(h, CSS.dim));
    }
    if (state.flags.tapeTaken) para(TEXTS.ui.callTip, CSS.dim);

    heading('Evidence');
    if (!state.inventory.evidence.length) para(TEXTS.ui.emptyNotes, CSS.dim);
    for (const id of state.inventory.evidence) para(`${EVIDENCE[id].name}: ${EVIDENCE[id].desc}`);

    if (state.inventory.evidence.includes('E4')) {
      heading('Locker code');
      para('0614', CSS.cream);
    }
    this.maxScroll = Math.max(0, y - (CONTENT_Y + CONTENT_H));
  }

  drawProgress(state) {
    const g = this.progress;
    g.clear();
    if (!state.phone.playing || state.phone.tab !== 'VOICEMAIL' || this.progressY == null) return;
    const dur = VOICEMAILS[state.phone.playingId].durationSec;
    const x = X0 + 12 + COL_W + 12;
    const w = W - (COL_W + 40);
    const t = Math.min(1, state.phone.playPos / dur);
    g.fillStyle(COLORS.line, 1).fillRoundedRect(x, this.progressY - 3, w, 6, 3);
    g.fillStyle(COLORS.cream, 1).fillRoundedRect(x, this.progressY - 3, Math.max(6, w * t), 6, 3);
    g.fillStyle(COLORS.cream, 1).fillCircle(x + w * t, this.progressY, 5);
  }
}
