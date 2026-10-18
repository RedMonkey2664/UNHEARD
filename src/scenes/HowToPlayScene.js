// How to play: three short pages (goal, controls, staying alive). After BEGIN
// it ends on START (then the headphone gate); from the title's button it ends
// on DONE (back to the title). Controls show the touch or keyboard set.

import Phaser from 'phaser';
import { COLORS, CSS, FONTS } from '../config/constants.js';
import { TEXTS } from '../data/texts.js';
import { Button } from '../ui/Button.js';
import { textStyle } from '../ui/text.js';
import { DEVICE } from '../utils/device.js';

const W = 960;
const H = 540;
const KEY_X = 360;          // right edge of the key column
const DESC_X = 384;         // left edge of the description column
const DESC_WRAP = 500;
const ROWS_TOP = 150;
const ROWS_BOTTOM = 388;
const DOTS_Y = 434;
const BUTTONS_Y = 484;
const DOT_SPACING = 22;

export class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super('HowToPlay');
  }

  init(data) {
    this.mode = data?.mode === 'view' ? 'view' : 'start';
    this.page = 0;
  }

  create() {
    const T = TEXTS.howTo;
    this.cameras.main.setBackgroundColor(COLORS.void);
    this.add.image(W / 2, 214, 'title_window').setAlpha(0.08);
    this.add.rectangle(W / 2, H / 2, 900, 500, COLORS.panel, 0.9).setStrokeStyle(1, COLORS.line);
    this.add.text(W / 2, 46, T.title.toUpperCase(), textStyle({ size: 16, color: CSS.dim, letterSpacing: 3 }))
      .setOrigin(0.5);
    this.heading = this.add.text(W / 2, 92, '', textStyle({ font: FONTS.memory, size: 34, color: CSS.cream }))
      .setOrigin(0.5);
    this.rows = this.add.container(0, 0);
    this.dots = this.add.graphics();

    this.backBtn = new Button(this, W / 2 - 130, BUTTONS_Y, T.back, () => this.go(-1), { width: 200, height: 52 });
    this.nextBtn = new Button(this, W / 2 + 130, BUTTONS_Y, T.next, () => this.go(1), { width: 200, height: 52, size: 20 });

    const keys = this.input.keyboard;
    if (keys) {
      keys.on('keydown-RIGHT', () => this.go(1));
      keys.on('keydown-ENTER', () => this.go(1));
      keys.on('keydown-SPACE', () => this.go(1));
      keys.on('keydown-LEFT', () => this.go(-1));
      keys.on('keydown-ESC', () => this.scene.start('Title'));
    }
    this.showPage();
  }

  go(step) {
    const last = TEXTS.howTo.pages.length - 1;
    const next = this.page + step;
    if (next < 0) {
      this.scene.start('Title');
    } else if (next > last) {
      this.scene.start(this.mode === 'start' ? 'HeadphoneGate' : 'Title');
    } else {
      this.page = next;
      this.showPage();
    }
  }

  showPage() {
    const T = TEXTS.howTo;
    const page = T.pages[this.page];
    const view3d = this.registry.get('settings')?.view3d;
    const set = (DEVICE.touch ? 'touch' : 'keys') + (view3d ? '3d' : '');
    const rows = page.rows || page[set];
    this.heading.setText(page.heading);

    this.rows.removeAll(true);
    const step = (ROWS_BOTTOM - ROWS_TOP) / Math.max(1, rows.length - 1);
    rows.forEach((row, i) => {
      const y = ROWS_TOP + i * Math.min(step, 64);
      const key = this.add.text(KEY_X, y, row.k, textStyle({ size: 20, color: CSS.cream, align: 'right' }))
        .setOrigin(1, 0.5);
      const desc = this.add.text(DESC_X, y, row.d, textStyle({ size: 18, align: 'left', wrap: DESC_WRAP }))
        .setOrigin(0, 0.5);
      this.rows.add([key, desc]);
    });

    const last = this.page === T.pages.length - 1;
    this.nextBtn.setText(last ? (this.mode === 'start' ? T.start : T.done) : T.next);
    this.nextBtn.setSelected(last);

    const g = this.dots;
    g.clear();
    const x0 = W / 2 - DOT_SPACING * (T.pages.length - 1) / 2;
    T.pages.forEach((_p, i) => {
      if (i === this.page) g.fillStyle(COLORS.cream, 1).fillCircle(x0 + i * DOT_SPACING, DOTS_Y, 5);
      else g.lineStyle(1.5, COLORS.line, 1).strokeCircle(x0 + i * DOT_SPACING, DOTS_Y, 5);
    });
  }
}
