// Plays an ending's beat list from data/endings.js, then the end card
// (docs/06 sections 3 to 8). No darkness layer. Visuals are plain colour
// fields with text when art is missing; missing audio is silent.

import Phaser from 'phaser';
import { COLORS, CSS, FONTS, ROOM_COLORS } from '../config/constants.js';
import { END_CARD, ENDINGS, endingBeats, EPILOGUE } from '../data/endings.js';
import { VOICEMAILS } from '../data/voicemails.js';
import { Subtitles } from '../audio/Subtitles.js';
import { epilogueKey } from '../systems/endingResolver.js';
import { Button } from '../ui/Button.js';
import { textStyle } from '../ui/text.js';
import { addEnding } from '../utils/storage.js';

const FIELD = 0x120C08;
const CARD_FADE_MS = 800;

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  init(data) {
    this.endingId = data.id;
    this.cause = data.cause;
  }

  create() {
    this.state = this.registry.get('state');
    this.beats = endingBeats(this.endingId, this.cause);
    this.index = -1;
    this.done = false;

    this.bg = this.add.rectangle(480, 270, 960, 540, 0x000000);
    this.still = this.add.image(480, 270, '__DEFAULT').setVisible(false);
    this.phone = this.add.container(0, 0).setVisible(false);
    const body = this.add.rectangle(480, 250, 260, 400, COLORS.panel, 1).setStrokeStyle(2, COLORS.line);
    this.phoneText = this.add.text(480, 200, '', textStyle({ size: 18, color: CSS.cream, wrap: 220 }))
      .setOrigin(0.5);
    this.phoneGlow = this.add.rectangle(480, 250, 260, 400, COLORS.cream, 0.05);
    this.phone.add([body, this.phoneGlow, this.phoneText]);
    this.centre = this.add.text(480, 250, '', textStyle({ font: FONTS.memory, style: 'italic', size: 28,
      color: CSS.cream, wrap: 700 })).setOrigin(0.5);
    this.subtitles = new Subtitles(this, 10);

    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.next();
  }

  // Through AudioDirector, so missing files fall back silently on a timer.
  play(key, channel = 'sfx') {
    const audio = this.registry.get('audio');
    if (key && audio) audio.play(key, { channel });
  }

  update(_t, deltaMs) {
    this.registry.get('audio')?.update(null, deltaMs / 1000, false);
  }

  next() {
    this.time.removeAllEvents();
    this.index++;
    if (this.index >= this.beats.length) return this.endCard();
    const beat = this.beats[this.index];
    this.showVisual(beat);
    (beat.audio || []).forEach((k) => this.play(k));
    this.play(beat.voice, 'voice');
    this.scheduleLines(beat);
    this.time.delayedCall(beat.hold * 1000, () => this.next());
    return null;
  }

  showVisual(beat) {
    const v = beat.visual || 'black';
    this.still.setVisible(false);
    this.phone.setVisible(false);
    this.centre.setText('').setAlpha(1);
    this.bg.setFillStyle(0x000000);
    if (v.startsWith('room:')) this.bg.setFillStyle(ROOM_COLORS[v.slice(5)] || FIELD);
    if (v.startsWith('still:')) {
      const key = v.slice(6);
      if (this.textures.exists(key)) this.still.setTexture(key).setDisplaySize(960, 540).setVisible(true);
      else this.bg.setFillStyle(FIELD);
    }
    if (v === 'phone') {
      this.phone.setVisible(true);
      this.phoneText.setText(beat.phone || '');
      if (beat.dying) {
        // The icon dies like a lamp running out of oil.
        this.phoneGlow.setAlpha(0.25);
        this.tweens.add({ targets: this.phoneGlow, alpha: 0, duration: beat.hold * 900 });
      } else {
        this.phoneGlow.setAlpha(0.05);
      }
    }
    if (beat.text) this.centre.setText(beat.text);
    if (beat.epilogue) {
      let text = EPILOGUE[epilogueKey(this.state)];
      if (beat.extra) text += '\n\n' + EPILOGUE.staticExtra;
      this.centre.setText(text).setFontSize(22);
    } else {
      this.centre.setFontSize(28);
    }
  }

  // Lines share the beat's time evenly; VM8 follows its own timings.
  scheduleLines(beat) {
    const lines = [...(beat.lines || [])];
    if (beat.ifTape && this.state.flags.tapeTaken) lines.push(...beat.ifTape);
    const step = (beat.hold * 1000) / Math.max(1, lines.length);
    lines.forEach((l, i) => this.time.delayedCall(i * step, () => this.subtitles.show(l.who, l.hi, null)));
    if (!lines.length) this.subtitles.hide();

    if (beat.texts) {
      const tstep = (beat.hold * 1000) / beat.texts.length;
      beat.texts.forEach((t, i) => this.time.delayedCall(i * tstep, () => this.centre.setText(t)));
    }

    if (beat.vm8) {
      const vmLines = beat.vm8.lines || VOICEMAILS[8].lines;
      this.time.delayedCall(beat.vm8.startAt * 1000, () => this.play('vm8', 'voice'));
      vmLines.forEach((l) => this.time.delayedCall((beat.vm8.startAt + l.t) * 1000,
        () => this.subtitles.show(l.who, l.hi, null)));
      if (beat.vm8.blanks) {
        const end = (beat.vm8.startAt + VOICEMAILS[8].durationSec) * 1000;
        this.time.delayedCall(end, () => {
          this.subtitles.hide();
          this.phoneText.setText(beat.vm8.blanks);
        });
      }
    }
  }

  // Debug: jump straight to the card.
  skipToCard() {
    this.index = this.beats.length;
    this.time.removeAllEvents();
    this.endCard();
  }

  endCard() {
    if (this.done) return;
    this.done = true;
    this.subtitles.hide();
    this.still.setVisible(false);
    this.phone.setVisible(false);
    this.centre.setText('');
    this.bg.setFillStyle(0x000000);

    const e = ENDINGS[this.endingId];
    const found = addEnding(this.endingId);
    const card = this.add.container(0, 0).setAlpha(0);
    card.add(this.add.text(480, 190, `ENDING ${e.number} OF 4: ${e.title}`,
      textStyle({ font: FONTS.memory, size: 34, color: CSS.cream })).setOrigin(0.5));
    card.add(this.add.text(480, 250, END_CARD.found(found.length),
      textStyle({ size: 18, color: CSS.dim })).setOrigin(0.5));
    if (found.length === 4) {
      card.add(this.add.text(480, 284, END_CARD.thanks, textStyle({ size: 18, color: CSS.cream }))
        .setOrigin(0.5));
    }
    const again = new Button(this, 380, 360, END_CARD.playAgain, () => this.scene.start('HeadphoneGate'),
      { width: 180, height: 52 });
    const title = new Button(this, 580, 360, END_CARD.title, () => this.scene.start('Title'),
      { width: 180, height: 52 });
    again.addTo(card);
    title.addTo(card);
    this.tweens.add({ targets: card, alpha: 1, duration: CARD_FADE_MS });
  }
}
