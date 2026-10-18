// The world: rooms, characters, darkness and atmosphere. Renders state and
// forwards input to systems; no game rules live here.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { ART, COLORS, CSS, FONTS, fitHeight, LAYOUT, UI } from '../config/constants.js';
import { ROOMS } from '../data/rooms.js';
import { EVIDENCE, TOOLS, CARD_PIECES } from '../data/items.js';
import { TEXTS } from '../data/texts.js';
import { bus } from '../systems/eventBus.js';
import { createBattery } from '../systems/battery.js';
import { createFinalAct } from '../systems/finalAct.js';
import { createBarks } from '../systems/barks.js';
import { createEndingResolver } from '../systems/endingResolver.js';
import { createFixPuzzles } from '../systems/fixPuzzles.js';
import { applyPreset } from '../systems/presets.js';
import { createHideSystem } from '../systems/hideSystem.js';
import { createNaniWarning } from '../systems/naniWarning.js';
import { createMovement } from '../systems/movement.js';
import { checkWhen, createInteraction } from '../systems/interaction.js';
import { createMessages } from '../systems/messages.js';
import { createNoise } from '../systems/noise.js';
import { connectRules } from '../systems/rules.js';
import { createVikramAI } from '../systems/vikramAI.js';
import { createVoicemailFlow } from '../systems/voicemailFlow.js';
import { createRng } from '../utils/rng.js';
import { DarknessLayer } from '../render/DarknessLayer.js';
import { FlickerController } from '../render/FlickerController.js';
import { TintLayer } from '../render/TintLayer.js';
import { RoomDecor } from '../render/RoomDecor.js';
import { ART_ANCHOR, DOOR_ANCHOR } from '../render/art/roomArt.js';
import { HollowEntity } from '../entities/HollowEntity.js';
import { NaniGlimpse } from '../entities/NaniGlimpse.js';
import { createPresence, createTemptation } from '../systems/presence.js';
import { textStyle } from '../ui/text.js';

const W = BALANCE.world.width;
const H = BALANCE.world.height;
const FLOOR = BALANCE.world.floorY;
const P = BALANCE.player;
const MAX_DT = 0.05;  // docs/02 section 6: clamp to avoid tunnelling

const DEPTH = { room: 0, props: 1, player: 5, dark: 10, warm: 10.2, tint: 10.5, emissive: 10.6, dust: 10.7,
  outline: 11, vikram: 11, glint: 11.2, ghost: 11.5, debug: 12, vignette: 13.6, grain: 13.7, label: 13.8,
  caption: 13.85, flash: 14 };
const LABEL_RISE = 4;         // px a label drifts up as it fades in
const VIKRAM_COLOR = 0xE58C79;
const VIKRAM_W = 40;
const VIKRAM_H = 130;

export class RoomScene extends Phaser.Scene {
  constructor() {
    super('Room');
  }

  create() {
    this.state = this.registry.get('state');
    this.subs = [];
    this.events.once('shutdown', () => this.subs.forEach((off) => off()));

    const battery = createBattery(bus);
    const puzzles = createFixPuzzles();
    const messages = createMessages(bus);
    const noise = createNoise(bus);
    const seed = Date.now() >>> 0;
    this.systems = {
      noise,
      presence: createPresence(bus, { noise, rng: createRng(seed ^ 0x9e37) }),
      temptation: createTemptation(bus),
      vikram: createVikramAI(bus, { noise, rng: createRng(seed) }),
      battery,
      puzzles,
      messages,
      movement: createMovement(),
      interaction: createInteraction(bus),
      flow: createVoicemailFlow(bus, { battery, puzzles, messages }),
      endings: createEndingResolver(bus),
      hide: createHideSystem(bus, { battery }),
      naniWarning: createNaniWarning(bus),
      barks: createBarks(bus),
    };
    this.systems.finalAct = createFinalAct(bus, { puzzles, battery, vikram: this.systems.vikram });
    this.registry.set('systems', this.systems);
    const offRules = connectRules(bus, this.systems, () => this.state);
    this.events.once('shutdown', offRules);
    this.memoryOpen = false;
    this.ended = false;
    this.torchHintShown = false;
    this.vikramHintShown = false;

    this.pending = null;        // { type: 'walk' | 'hotspot' | 'door', id, x }
    this.sneakToggle = false;
    this.transitioning = false;

    this.cameras.main.setBackgroundColor(COLORS.void);
    this.buildPlayer();
    this.buildVikram();
    this.darkness = new DarknessLayer(this, DEPTH.dark);
    this.flicker = new FlickerController(this.darkness);
    this.tint = new TintLayer(this, DEPTH.tint);
    this.nani = new NaniGlimpse(this, DEPTH.ghost);
    this.hollow = new HollowEntity(this, DEPTH.ghost);
    this.fxRng = createRng(seed ^ 0x51ed);
    this.shapeTimer = BALANCE.presence.shapeEvery[0];
    this.shapeSide = 1;
    this.lastDt = 0;
    this.flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(DEPTH.flash);
    this.nani.cup.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.touchChai());
    this.decor = new RoomDecor(this, DEPTH);
    this.animT = 0;
    // Extra vignette while hidden (docs/02 section 8).
    this.hideVignette = this.add.image(W / 2, H / 2, 'fx_vignette').setDisplaySize(W, H)
      .setDepth(DEPTH.outline).setAlpha(0.95).setVisible(false);
    this.lampFlash = this.add.rectangle(W / 2, H / 2, W, H, COLORS.lamp, 0).setDepth(DEPTH.outline);
    this.debugGfx = this.add.graphics().setDepth(DEPTH.debug);
    // The room name, shown small for 2 s on entering (docs/10 section 4).
    this.caption = this.add.text(W / 2, 74, '', textStyle({ font: FONTS.memory, style: 'italic', size: 20,
      color: CSS.cream })).setOrigin(0.5).setDepth(DEPTH.caption).setAlpha(0);
    this.windowOpen = (id) => this.isWindowOpen(id);
    this.buildRoom();
    this.bindInput();
    this.bindEvents();

    this.scene.launch('UI');
    if (this.scene.manager.keys.Debug && !this.scene.isActive('Debug')) {
      this.scene.launch('Debug');
    }
    const preset = this.registry.get('pendingPreset');
    if (preset) {
      this.registry.set('pendingPreset', null);
      applyPreset(this.state, preset, this.systems);
    }
    this.startPrologue();
  }

  // Debug can skip the scripted opening; Mom's text still arrives.
  startPrologue() {
    if (this.state.flags.arrivalShown) return;
    if (this.registry.get('skipPrologue')) {
      this.state.flags.arrivalShown = true;
      this.systems.messages.send(this.state, 'mom1');
      return;
    }
    this.scene.launch('Prologue');
  }

  // --- building -----------------------------------------------------------

  // Code-drawn sheets keep their own size and frames; a real PNG is fitted
  // to the docs/07 character height (docs/02 section 10).
  sprite(key, depth) {
    if (!this.textures.exists(key)) return null;
    const img = this.add.image(0, FLOOR, key).setOrigin(0.5, 1).setDepth(depth);
    if (this.textures.get(key).has('idle')) return img.setFrame('idle');
    return fitHeight(img, LAYOUT.spriteH);
  }

  setFrame(img, name) {
    if (img.frame.name !== name && img.texture.has(name)) img.setFrame(name);
  }

  buildPlayer() {
    this.playerRect = this.add.rectangle(0, FLOOR, LAYOUT.playerW, LAYOUT.playerH, COLORS.cream, 0.85)
      .setOrigin(0.5, 1).setDepth(DEPTH.player);
    this.playerLetter = this.add.text(0, 0, 'P', textStyle({ size: 20, color: CSS.void }))
      .setOrigin(0.5).setDepth(DEPTH.player);
    this.playerImg = this.sprite('spr_player', DEPTH.player);
    if (this.playerImg) {
      this.playerRect.setAlpha(0);
      this.playerLetter.setAlpha(0);
    }
  }

  // Drawn above the darkness, but only shown when the player could see him.
  buildVikram() {
    this.vikramRect = this.add.rectangle(0, FLOOR, VIKRAM_W, VIKRAM_H, VIKRAM_COLOR, 0.9)
      .setOrigin(0.5, 1).setDepth(DEPTH.vikram).setVisible(false);
    this.vikramLetter = this.add.text(0, 0, 'V', textStyle({ size: 20, color: CSS.void }))
      .setOrigin(0.5).setDepth(DEPTH.vikram).setVisible(false);
    this.vikramImg = this.sprite('spr_vikram', DEPTH.vikram);
    if (this.vikramImg) this.vikramImg.setVisible(false);
  }

  buildRoom() {
    if (this.roomLayer) this.roomLayer.destroy(true);
    const roomId = this.state.player.room;
    const room = ROOMS[roomId];
    const layer = this.add.container(0, 0).setDepth(DEPTH.room);
    this.roomLayer = layer;
    this.hotspotRects = new Map();
    this.overlays = new Map();
    this.marks = [];            // interactables: { id, x, label, glint, alpha }
    // The background is a real PNG or the code-drawn one (always present);
    // hotspots and doors become invisible hit areas over it.
    layer.add(this.add.image(W / 2, H / 2, room.bg).setDisplaySize(W, H));
    this.showCaption(room.label);
    const overlay = (id, key) => {
      if (!this.textures.exists(key)) return;
      const img = this.add.image(W / 2, H / 2, key).setDisplaySize(W, H).setVisible(false);
      layer.add(img);
      this.overlays.set(id, img);
    };
    overlay('H_WINDOW_' + roomId, 'ov_window_open_' + roomId.toLowerCase());
    if (roomId === 'LIVING') {
      overlay('H_TV', 'ov_tv_static');
      overlay('H_RADIO', 'ov_radio_on');
    }

    for (const door of room.doors) {
      const h = FLOOR - LAYOUT.doorTopY;
      const r = this.add.rectangle(door.x, FLOOR, LAYOUT.doorW, h, COLORS.line, 0.001).setOrigin(0.5, 1);
      r.setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => this.queue({ type: 'door', id: door.id, x: door.x }));
      layer.add(r);
      this.addMark(door.id, door.x, DOOR_ANCHOR, door.to ? ROOMS[door.to].label : 'Front door');
    }

    for (const hs of room.hotspots) {
      const h = FLOOR - LAYOUT.hotspotTopY;
      const r = this.add.rectangle(hs.x, FLOOR, hs.w, h, COLORS.line, 0.001).setOrigin(0.5, 1);
      r.setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => this.queue({ type: 'hotspot', id: hs.id, x: hs.x }));
      layer.add(r);
      this.hotspotRects.set(hs.id, r);
      this.addMark(hs.id, hs.x, ART_ANCHOR[hs.id] ?? LAYOUT.hotspotTopY, hs.label);
    }
    this.decor.build(roomId);
  }

  // A glint on the object and a label above it, both hidden until near.
  addMark(id, x, anchorY, text) {
    const label = this.add.text(x, anchorY - 12, text, textStyle({ size: 16, color: CSS.cream }))
      .setOrigin(0.5, 1).setDepth(DEPTH.label).setAlpha(0)
      .setStroke(CSS.void, 4).setShadow(0, 1, CSS.void, 4, false, true);
    const glint = this.add.image(x, anchorY + 12, 'fx_glint').setDepth(DEPTH.glint)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.marks.push({ id, x, label, glint, labelY: anchorY - 12, alpha: 0, phase: x * 0.013 });
  }

  showCaption(text) {
    const c = this.caption;
    if (!c) return;
    this.tweens.killTweensOf(c);
    c.setText(text).setAlpha(0).setY(78);
    this.tweens.add({ targets: c, alpha: 0.85, y: 74, duration: 220, ease: 'Quart.easeOut' });
    this.tweens.add({ targets: c, alpha: 0, delay: ART.roomCaptionSec * 1000, duration: 400, ease: 'Sine.easeInOut' });
  }

  // --- input --------------------------------------------------------------

  bindInput() {
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard?.addKeys({
      a: K.A, d: K.D, left: K.LEFT, right: K.RIGHT, e: K.E, f: K.F, c: K.C, shift: K.SHIFT
    });
    if (this.keys) {
      this.keys.f.on('down', () => this.toggleTorch());
      this.keys.c.on('down', () => { this.sneakToggle = !this.sneakToggle; });
      this.keys.e.on('down', () => this.interactNearest());
      this.input.keyboard.addKey(K.H).on('down', () => this.toggleHide());
    }

    // Taps on hotspots and doors are handled by those objects; anything else
    // is a walk target.
    this.input.on('pointerdown', (pointer, over) => {
      if (over.length || this.transitioning) return;
      this.queue({ type: 'walk', x: pointer.worldX });
    });
  }

  bindEvents() {
    const on = (name, fn) => this.subs.push(bus.on(name, fn));
    on('room:enter', () => { this.clearMarks(); this.buildRoom(); this.hollow.hide(); });
    on('ui:torch', () => this.toggleTorch());
    on('ui:hide', () => this.toggleHide());
    on('nani:warn', () => this.lampFlicker());
    on('nani:glimpse', (p) => this.glimpse(p));
    on('hollow:manifest', ({ full }) => this.manifest(full));
    on('hollow:fade', () => this.hollow.hide());
    on('beat:fire', ({ id }) => {
      if (id === 'TV_STATIC_SCARE') this.tvScare();
      if (id === 'RADIO_TURNS_ON') this.decor.radioOn(BALANCE.beats.radioTuneSec);
      const radio = this.overlays?.get('H_RADIO');
      if (id === 'RADIO_TURNS_ON' && radio) {
        radio.setVisible(true);
        this.time.delayedCall(BALANCE.beats.radioTuneSec * 1000, () => radio.active && radio.setVisible(false));
      }
    });
    on('ending:trigger', (p) => this.goToEnding(p));
    on('vikram:door', ({ room }) => {
      if (room === this.state.player.room && !this.vikramHintShown) {
        this.vikramHintShown = true;
        bus.emit('ui:toast', { text: TEXTS.hints.vikram });
      }
    });
    on('ui:sneak', () => { this.sneakToggle = !this.sneakToggle; });
    on('item:added', ({ id, kind }) => {
      const def = kind === 'tool' ? TOOLS[id] : CARD_PIECES[id];
      if (def) bus.emit('ui:toast', { text: TEXTS.ui.pickedUp + def.name });
    });
    on('evidence:added', ({ id }) => {
      bus.emit('ui:toast', { text: TEXTS.ui.evidence + EVIDENCE[id].name });
    });
    // Memory freezes the room's simulation (docs/02 section 6, step 2).
    on('memory:start', ({ vmId }) => {
      this.memoryOpen = true;
      this.pending = null;
      this.scene.launch('Memory', { vmId });
    });
    on('memory:end', () => { this.memoryOpen = false; });
    on('debug:teleport', ({ room }) => {
      this.pending = null;
      this.systems.interaction.teleport(this.state, room, ROOMS[room].start?.x ?? W / 2);
    });
  }

  queue(target) {
    if (this.transitioning || this.state.player.locked) return;
    this.pending = target;
  }

  // Once an ending fires nothing else changes; the EndingScene takes over.
  goToEnding({ id, cause }) {
    this.ended = true;
    this.pending = null;
    this.hollow.hide();
    this.time.delayedCall(BALANCE.final.endingDelaySec * 1000, () => {
      for (const key of ['UI', 'Memory', 'Prologue']) if (this.scene.isActive(key)) this.scene.stop(key);
      this.scene.start('Ending', { id, cause });
    });
  }

  touchChai() {
    this.systems.presence.touchChai(this.state);
  }

  clearMarks() {
    for (const m of this.marks || []) {
      m.label.destroy();
      m.glint.destroy();
    }
    this.marks = [];
  }

  // --- ghosts ---------------------------------------------------------------

  glimpse({ id }) {
    const p = this.state.player;
    if (id === 'NG2') {
      // A thin figure in the doorway at the far side of the room, 8 s.
      const doors = ROOMS[p.room].doors.filter((d) => !d.locked);
      const far = doors.sort((a, b) => Math.abs(b.x - p.x) - Math.abs(a.x - p.x))[0];
      const x = far && Math.abs(far.x - p.x) > W / 3 ? far.x : (p.x < W / 2 ? W - 60 : 60);
      this.nani.showFigure(x, FLOOR, BALANCE.nani.ng2Sec);
    }
    if (id === 'NG3' && p.room === 'LIVING') {
      // In the Living window glass: a faint reflection, a second late.
      const win = ROOMS.LIVING.hotspots.find((h) => h.id === 'H_WINDOW_LIVING');
      this.time.delayedCall(1000, () => this.nani.showFigure(win.x, FLOOR - 70, 3, 0.2));
    }
  }

  // Full white flash, or a dark fade with Reduce flash (docs/05 section 6).
  scareFlash() {
    const reduce = this.state.settings.reduceFlash;
    this.flash.setFillStyle(reduce ? 0x000000 : 0xffffff, 1).setAlpha(reduce ? 0.6 : 0.85);
    this.tweens.add({ targets: this.flash, alpha: 0, duration: reduce ? 500 : 140 });
  }

  manifest(full) {
    const p = this.state.player;
    this.hollow.manifest(Phaser.Math.Clamp(p.x + (p.x < W / 2 ? 110 : -110), 40, W - 40), FLOOR, full);
    if (full) this.scareFlash();
  }

  // JS3: the Hollow's face in the TV static, only if the player is there.
  tvScare() {
    if (this.state.player.room !== 'LIVING') return;
    const tv = ROOMS.LIVING.hotspots.find((h) => h.id === 'H_TV');
    const face = this.hollow.face;
    face.setPosition(tv.x, ART_ANCHOR.H_TV + 32).setVisible(true).setAlpha(1);
    if (this.state.settings.reduceFlash) this.hollow.darkenFace(true);
    else this.scareFlash();
    this.time.delayedCall(BALANCE.presence.js3Sec * 1000, () => {
      face.setVisible(false);
      this.hollow.darkenFace(false);
    });
  }

  // At Presence >= 60 a tall dark shape at the edge of the light, never at
  // the same place twice.
  updateShape(dt) {
    const s = this.state;
    if (s.presence < BALANCE.presence.thresholds.whisper || s.flags.manifestTimer !== null) return;
    this.shapeTimer -= dt;
    if (this.shapeTimer > 0) return;
    this.shapeTimer = this.fxRng.range(...BALANCE.presence.shapeEvery);
    this.shapeSide = -this.shapeSide;
    const edge = s.torchOn ? BALANCE.torch.radius - 15 : BALANCE.torch.dimGlowRadius + 30;
    const x = s.player.x + this.shapeSide * (edge + this.fxRng.range(-20, 20));
    this.hollow.glimpse(Phaser.Math.Clamp(x, 20, W - 20), FLOOR, BALANCE.presence.shapeSec);
  }

  toggleHide() {
    const { hide } = this.systems;
    if (this.state.player.hidden) {
      hide.unhide(this.state);
    } else if (hide.hide(this.state)) {
      this.pending = null;
      if (this.state.stats.hides === 1) bus.emit('ui:toast', { text: TEXTS.hints.hide });
    }
  }

  // Nani's warning: the lamp flickers once (two quick pulses) and ticks.
  lampFlicker() {
    this.tweens.killTweensOf(this.lampFlash);
    this.lampFlash.setAlpha(0);
    this.tweens.add({ targets: this.lampFlash, alpha: 0.18, duration: 70, yoyo: true, repeat: 1 });
    bus.emit('ui:subtitle', { who: 'SFX', text: TEXTS.captions.LAMP_TICK, sec: 2 });
  }

  toggleTorch() {
    const on = this.systems.battery.setTorch(this.state, !this.state.torchOn);
    if (on && !this.torchHintShown) {
      this.torchHintShown = true;
      bus.emit('ui:toast', { text: TEXTS.hints.torch });
    }
  }

  // E key: the nearest hotspot or door within interact range.
  interactNearest() {
    if (this.transitioning) return;
    const offer = this.state.nani.offer;
    if (offer && offer.room === this.state.player.room &&
        Math.abs(offer.x - this.state.player.x) <= P.interactRange) {
      this.touchChai();
      return;
    }
    const room = ROOMS[this.state.player.room];
    const px = this.state.player.x;
    let best = null;
    for (const hs of room.hotspots) {
      const d = Math.abs(hs.x - px);
      if (d <= P.interactRange && (!best || d < best.d)) best = { d, type: 'hotspot', id: hs.id, x: hs.x };
    }
    for (const door of room.doors) {
      const d = Math.abs(door.x - px);
      if (d <= P.interactRange && (!best || d < best.d)) best = { d, type: 'door', id: door.id, x: door.x };
    }
    if (best) this.pending = best;
  }

  // --- frame --------------------------------------------------------------

  update(_time, deltaMs) {
    const state = this.state;
    const dt = Math.min(deltaMs / 1000, MAX_DT) * (this.registry.get('timeScale') || 1);
    state.clock.runSeconds += dt;
    this.lastDt = this.memoryOpen || this.ended ? 0 : dt;

    const cinematic = this.systems.finalAct.inCinematic(state);
    if (!this.memoryOpen && !this.ended && !cinematic) {
      if (!this.transitioning) this.stepPlayer(dt);
      // docs/02 section 6 order: flow, Vikram, noise, (presence), battery.
      this.systems.flow.tick(state, dt);
      this.systems.vikram.tick(state, dt);
      this.systems.naniWarning.tick(state);
      this.systems.barks.tick(state, dt);
      this.systems.noise.tick(state, dt);
      this.systems.presence.tick(state, dt);
      this.systems.battery.tick(state, dt);
    }
    this.registry.get('audio')?.update(state, dt, !this.memoryOpen && !this.ended);
    // Steps 9 and 10: the final act (also runs the tape cinematic) and endings.
    if (!this.memoryOpen && !this.ended) {
      this.systems.finalAct.tick(state, dt);
      this.systems.endings.flush(state);
    }

    this.render();
  }

  stepPlayer(dt) {
    const state = this.state;
    const keys = this.keys;
    const dir = keys
      ? (keys.d.isDown || keys.right.isDown ? 1 : 0) - (keys.a.isDown || keys.left.isDown ? 1 : 0)
      : 0;
    if (dir) this.pending = null;
    state.player.sneaking = this.sneakToggle || Boolean(keys?.shift.isDown);

    const target = this.pending;
    const arrived = this.systems.movement.move(state, dt, { dir, targetX: target ? target.x : null });
    if (!target) return;

    if (target.type === 'walk' && arrived) this.pending = null;
    if (target.type === 'hotspot' && Math.abs(state.player.x - target.x) <= P.interactRange) {
      this.pending = null;
      state.player.moving = false;
      this.doHotspot(target.id);
    }
    if (target.type === 'door' && arrived) {
      this.pending = null;
      this.doDoor(target.id);
    }
  }

  doHotspot(id) {
    const result = this.systems.interaction.interact(this.state, id);
    // A small pop on the glint confirms the tap (docs/07 section 5).
    const mark = this.marks.find((m) => m.id === id);
    if (mark) this.tweens.add({ targets: mark.glint, scale: 1.4, duration: 120, yoyo: true, ease: 'Quart.easeOut' });
    if (result?.text) bus.emit('ui:subtitle', { who: 'YOU', text: result.text, sec: UI.examineSec });
    this.runAction(result?.action);
  }

  // Hotspot actions that open UI or touch puzzles (docs/04 section 2).
  runAction(action) {
    if (!action) return;
    if (action.openFix) bus.emit('puzzle:open', { type: action.openFix });
    if (action.openKeypad) bus.emit('puzzle:open', { type: 'KEYPAD' });
    if (action.closeWindow) this.systems.flow.closeWindow(this.state, action.closeWindow);
    if (action.glimpse) bus.emit('nani:glimpse', { id: action.glimpse });
  }

  doDoor(id) {
    const room = ROOMS[this.state.player.room];
    const door = room.doors.find((d) => d.id === id);
    if (!door) return;
    if (door.locked) {
      this.systems.interaction.useDoor(this.state, id);
      bus.emit('ui:subtitle', { who: 'YOU', text: door.examine, sec: UI.examineSec });
      return;
    }
    // 0.4 s total: half out, swap rooms, half in.
    const half = (P.doorFadeSec * 1000) / 2;
    const cam = this.cameras.main;
    this.transitioning = true;
    this.state.player.moving = false;
    cam.fadeOut(half, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      this.systems.interaction.useDoor(this.state, id);
      cam.fadeIn(half, 0, 0, 0);
      cam.once('camerafadeincomplete', () => { this.transitioning = false; });
    });
  }

  // --- render -------------------------------------------------------------

  render() {
    const state = this.state;
    const p = state.player;
    this.animT += this.lastDt;
    const step = Math.floor(this.animT * ART.walkFps) % 4;
    const h = p.sneaking ? LAYOUT.playerSneakH : LAYOUT.playerH;
    if (this.playerRect.height !== h) this.playerRect.setSize(LAYOUT.playerW, h);
    this.playerRect.setPosition(p.x, FLOOR).setVisible(!p.hidden);
    this.playerLetter.setPosition(p.x, FLOOR - h / 2).setVisible(!p.hidden);
    if (this.playerImg) {
      this.playerImg.setPosition(p.x, FLOOR).setVisible(!p.hidden).setFlipX(p.facing < 0);
      const pose = p.sneaking ? 'sneak' : 'walk';
      this.setFrame(this.playerImg, p.moving ? pose + step : (p.sneaking ? 'sneak0' : 'idle'));
    }

    // The phone sits in the code-drawn sprite's hand.
    const hp = this.handPos || (this.handPos = { x: 0, y: 0, visible: false });
    hp.visible = !p.hidden && Boolean(this.playerImg) && this.textures.get('spr_player').has('idle');
    hp.x = p.x + p.facing * (p.sneaking ? ART.handXSneak : ART.handX);
    hp.y = FLOOR - (p.sneaking ? ART.handYSneak : ART.handY);

    // The torch leans a little the way the player faces; the dim glow does not.
    const preview = Boolean(this.registry.get('artPreview'));
    const lightX = p.x + (state.torchOn ? p.facing * ART.torchBias : 0);
    const lightY = FLOOR - LAYOUT.lightY;
    this.darkness.draw(lightX, lightY, state.torchOn);
    this.darkness.setVisible(!preview);
    this.tint.setVisible(!preview);
    this.decor.setPreview(preview);
    this.decor.update(this.lastDt || 0.016, {
      x: lightX, y: lightY, on: state.torchOn, radius: BALANCE.torch.radius + this.darkness.radiusJitter
    }, {
      windowOpen: this.windowOpen,
      tvOn: checkWhen({ vmDone: 7 }, state),
      steam: p.room === 'HALL' && !checkWhen({ vmDone: 1 }, state),
      preview,
      reduceFlash: state.settings.reduceFlash,
      hand: this.handPos
    });
    this.drawWindows();
    this.drawVikram(step);
    const hiddenView = p.hidden && !preview;
    this.hideVignette.setVisible(hiddenView && !this.decor.setHidden(hiddenView));
    this.drawGhosts();
    this.drawHints();
    this.drawHitboxes();
  }

  isWindowOpen(id) {
    const s = this.state;
    const room = id.slice('H_WINDOW_'.length);
    return (checkWhen({ vmCurrent: 3 }, s) && !s.windowsClosed.includes(room)) ||
      (room === 'LIVING' && s.flags.livingWindowReopened);
  }

  drawGhosts() {
    const s = this.state;
    const dt = this.lastDt;
    this.flicker.update(s, dt);
    this.tint.update(s.presence, dt);
    this.updateShape(dt);
    // NG1's steam is drawn by RoomDecor. NG4: Nani's chai offer near the player.
    const offer = s.nani.offer;
    if (offer && offer.room === s.player.room) this.nani.showCup(offer.x, FLOOR);
    else this.nani.hideCup();
  }

  // Visible inside the torch circle, or within sightTorchOff even in the dark.
  drawVikram(step) {
    const s = this.state;
    const v = s.vikram;
    const d = Math.abs(v.x - s.player.x);
    const sameRoom = v.room === s.player.room && v.state !== 'AWAY';
    const seen = sameRoom && !s.player.hidden &&
      ((s.torchOn && d <= BALANCE.torch.radius) || d <= BALANCE.vikram.sightTorchOff);
    const show = sameRoom && (seen || this.registry.get('debugShowVikram'));
    if (this.vikramImg) {
      this.vikramImg.setVisible(show).setPosition(v.x, FLOOR).setAlpha(seen ? 1 : 0.4).setFlipX(v.facing < 0);
      let frame = v.moving ? 'walk' + step : 'idle';
      if (v.state === 'CHASE') frame = 'chase' + (step % 2);
      else if (v.state === 'SEARCH' && !v.moving) frame = 'search' + (Math.floor(this.animT / ART.searchTurnSec) % 2);
      this.setFrame(this.vikramImg, frame);
      return;
    }
    this.vikramRect.setVisible(show).setPosition(v.x, FLOOR).setAlpha(seen ? 0.9 : 0.4);
    this.vikramLetter.setVisible(show).setPosition(v.x, FLOOR - VIKRAM_H / 2);
  }

  // Real PNG overlays (ov_*) for open windows and the TV, when they exist.
  // The code-drawn versions are in RoomDecor.
  drawWindows() {
    if (!this.overlays.size) return;
    const s = this.state;
    for (const [id, ov] of this.overlays) {
      if (id.startsWith('H_WINDOW_')) ov.setVisible(this.isWindowOpen(id));
      else if (id === 'H_TV') ov.setVisible(checkWhen({ vmDone: 7 }, s));
    }
  }

  // Glints within the hint distance, labels within interact range (docs/10
  // section 4). Torch off: glints within outlineDistOff always, so the dark
  // stays navigable (docs/03 section 8). Torch on: within outlineDistOn when
  // the Hotspot hints setting is on.
  drawHints() {
    const s = this.state;
    const T = BALANCE.torch;
    const px = s.player.x;
    const debug = Boolean(this.registry.get('debugHitboxes'));
    const hintDist = s.torchOn ? (s.settings.hotspotHints ? T.outlineDistOn : 0) : T.outlineDistOff;
    const dt = this.lastDt || 0.016;
    const t = this.animT;
    const busy = s.player.hidden || s.player.locked || this.ended;

    // Nearest first; skip any label within labelGap of one already shown.
    let shown0 = null;
    let shown1 = null;
    let best0 = Infinity;
    for (const m of this.marks) {
      const d = Math.abs(m.x - px);
      if (d <= P.interactRange && d < best0) { best0 = d; shown0 = m; }
    }
    if (shown0) {
      let best1 = Infinity;
      for (const m of this.marks) {
        const d = Math.abs(m.x - px);
        if (m !== shown0 && d <= P.interactRange && Math.abs(m.x - shown0.x) >= ART.labelGap && d < best1) {
          best1 = d;
          shown1 = m;
        }
      }
    }

    const step = dt / ART.labelFadeSec;
    for (const m of this.marks) {
      const want = debug || (!busy && (m === shown0 || m === shown1)) ? 1 : 0;
      m.alpha = want > m.alpha ? Math.min(1, m.alpha + step) : Math.max(0, m.alpha - step);
      m.label.setAlpha(m.alpha).setY(m.labelY + (1 - m.alpha) * LABEL_RISE);
      const d = Math.abs(m.x - px);
      const pulse = 0.5 + 0.5 * Math.sin((t / ART.glintPulseSec) * Math.PI * 2 + m.phase);
      const near = !busy && hintDist > 0 && d <= hintDist;
      m.glint.setAlpha(near ? (0.25 + 0.45 * pulse) * (1 - m.alpha * 0.6) : 0).setScale(0.8 + 0.2 * pulse);
    }
  }

  drawHitboxes() {
    const g = this.debugGfx;
    g.clear();
    if (!this.registry.get('debugHitboxes')) return;
    const room = ROOMS[this.state.player.room];
    g.fillStyle(COLORS.steelDark, 0.25);
    for (const hs of room.hotspots) g.fillRect(hs.x - hs.w / 2, LAYOUT.hotspotTopY, hs.w, FLOOR - LAYOUT.hotspotTopY);
    for (const spot of room.hideSpots) g.fillRect(spot.x - LAYOUT.hideW / 2, FLOOR - 120, LAYOUT.hideW, 120);
    g.lineStyle(1, 0xff5555, 0.9);
    for (const hs of room.hotspots) {
      g.strokeRect(hs.x - hs.w / 2, LAYOUT.hotspotTopY, hs.w, FLOOR - LAYOUT.hotspotTopY);
    }
    g.lineStyle(1, 0x55aaff, 0.9);
    for (const door of room.doors) {
      g.strokeRect(door.x - LAYOUT.doorW / 2, LAYOUT.doorTopY, LAYOUT.doorW, FLOOR - LAYOUT.doorTopY);
    }
    g.lineStyle(1, 0x55ff88, 0.9);
    for (const spot of room.hideSpots) {
      g.strokeRect(spot.x - P.hideRange, FLOOR - 140, P.hideRange * 2, 140);
    }
    const px = this.state.player.x;
    g.lineStyle(1, 0xffffff, 0.8);
    g.lineBetween(px - P.interactRange, FLOOR + 8, px + P.interactRange, FLOOR + 8);
    g.lineBetween(BALANCE.world.walkMinX, FLOOR, BALANCE.world.walkMaxX, FLOOR);
  }
}
