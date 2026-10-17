// The world: greybox rooms, player, darkness. Renders state and forwards
// input to systems; no game rules live here.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { COLORS, CSS, LAYOUT, ROOM_COLORS, UI } from '../config/constants.js';
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
import { HollowEntity } from '../entities/HollowEntity.js';
import { NaniGlimpse } from '../entities/NaniGlimpse.js';
import { createPresence, createTemptation } from '../systems/presence.js';
import { textStyle } from '../ui/text.js';

const W = BALANCE.world.width;
const H = BALANCE.world.height;
const FLOOR = BALANCE.world.floorY;
const P = BALANCE.player;
const MAX_DT = 0.05;  // docs/02 section 6: clamp to avoid tunnelling

const DEPTH = { room: 0, player: 5, dark: 10, tint: 10.5, outline: 11, vikram: 11, ghost: 11.5,
  debug: 12, label: 13, flash: 14 };
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
    this.chaiSteam = this.add.text(0, 0, '~', textStyle({ size: 20, color: CSS.cream }))
      .setOrigin(0.5).setDepth(DEPTH.ghost).setVisible(false);
    this.tweens.add({ targets: this.chaiSteam, alpha: 0.25, duration: 800, yoyo: true, repeat: -1 });
    this.nani.cup.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.touchChai());
    this.outlines = this.add.graphics().setDepth(DEPTH.outline);
    // Extra vignette while hidden (docs/02 section 8).
    this.hideVignette = this.add.rectangle(W / 2, H / 2, W - 140, H - 140)
      .setStrokeStyle(140, 0x000000, 0.85).setDepth(DEPTH.outline).setVisible(false);
    this.lampFlash = this.add.rectangle(W / 2, H / 2, W, H, COLORS.lamp, 0).setDepth(DEPTH.outline);
    this.debugGfx = this.add.graphics().setDepth(DEPTH.debug);
    this.roomLabel = this.add.text(W / 2, 64, '',
      textStyle({ size: 16, color: CSS.dim })).setOrigin(0.5).setDepth(DEPTH.label).setAlpha(0.6);
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

  buildPlayer() {
    this.playerRect = this.add.rectangle(0, FLOOR, LAYOUT.playerW, LAYOUT.playerH, COLORS.cream, 0.85)
      .setOrigin(0.5, 1).setDepth(DEPTH.player);
    this.playerLetter = this.add.text(0, 0, 'P', textStyle({ size: 20, color: CSS.void }))
      .setOrigin(0.5).setDepth(DEPTH.player);
  }

  // Drawn above the darkness, but only shown when the player could see him.
  buildVikram() {
    this.vikramRect = this.add.rectangle(0, FLOOR, VIKRAM_W, VIKRAM_H, VIKRAM_COLOR, 0.9)
      .setOrigin(0.5, 1).setDepth(DEPTH.vikram).setVisible(false);
    this.vikramLetter = this.add.text(0, 0, 'V', textStyle({ size: 20, color: CSS.void }))
      .setOrigin(0.5).setDepth(DEPTH.vikram).setVisible(false);
  }

  buildRoom() {
    if (this.roomLayer) this.roomLayer.destroy(true);
    const roomId = this.state.player.room;
    const room = ROOMS[roomId];
    const layer = this.add.container(0, 0).setDepth(DEPTH.room);
    this.roomLayer = layer;
    this.hotspotRects = new Map();

    layer.add(this.add.rectangle(W / 2, H / 2, W, H, ROOM_COLORS[roomId]));
    layer.add(this.add.rectangle(W / 2, (FLOOR + H) / 2, W, H - FLOOR, 0x000000, 0.35));
    layer.add(this.add.text(W / 2, 150, room.label.toUpperCase(),
      textStyle({ size: 40, color: CSS.text })).setOrigin(0.5).setAlpha(0.25));
    this.roomLabel.setText(room.label);

    for (const spot of room.hideSpots) {
      const r = this.add.rectangle(spot.x, FLOOR, LAYOUT.hideW, 120, 0x000000, 0.25)
        .setOrigin(0.5, 1).setStrokeStyle(1, COLORS.line);
      const t = this.add.text(spot.x, FLOOR - 128, spot.label, textStyle({ size: 16, color: CSS.dim }))
        .setOrigin(0.5, 1);
      layer.add([r, t]);
    }

    for (const door of room.doors) {
      const h = FLOOR - LAYOUT.doorTopY;
      const r = this.add.rectangle(door.x, FLOOR, LAYOUT.doorW, h, 0x000000, 0.45)
        .setOrigin(0.5, 1).setStrokeStyle(2, COLORS.wall);
      const name = door.to ? ROOMS[door.to].label : 'Front door';
      const t = this.add.text(door.x, LAYOUT.doorTopY - 6, name, textStyle({ size: 16 }))
        .setOrigin(0.5, 1);
      r.setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => this.queue({ type: 'door', id: door.id, x: door.x }));
      layer.add([r, t]);
    }

    for (const hs of room.hotspots) {
      const h = FLOOR - LAYOUT.hotspotTopY;
      const r = this.add.rectangle(hs.x, FLOOR, hs.w, h, COLORS.lamp, 0.12)
        .setOrigin(0.5, 1).setStrokeStyle(1, COLORS.lamp, 0.5);
      const t = this.add.text(hs.x, LAYOUT.hotspotTopY + 6, hs.label,
        textStyle({ size: 16, wrap: Math.max(hs.w + 20, 80) })).setOrigin(0.5, 0);
      r.setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => this.queue({ type: 'hotspot', id: hs.id, x: hs.x }));
      layer.add([r, t]);
      this.hotspotRects.set(hs.id, r);
    }
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
    on('room:enter', () => { this.buildRoom(); this.hollow.hide(); });
    on('ui:torch', () => this.toggleTorch());
    on('ui:hide', () => this.toggleHide());
    on('nani:warn', () => this.lampFlicker());
    on('nani:glimpse', (p) => this.glimpse(p));
    on('hollow:manifest', ({ full }) => this.manifest(full));
    on('hollow:fade', () => this.hollow.hide());
    on('beat:fire', ({ id }) => { if (id === 'TV_STATIC_SCARE') this.tvScare(); });
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
    face.setPosition(tv.x, LAYOUT.hotspotTopY + 50).setVisible(true).setAlpha(1);
    if (this.state.settings.reduceFlash) face.setFillStyle(0x202020, 0.9);
    else this.scareFlash();
    this.time.delayedCall(BALANCE.presence.js3Sec * 1000, () => {
      face.setVisible(false).setFillStyle(0xE6E0D2, 0.9);
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
    const rect = this.hotspotRects.get(id);
    if (rect) this.tweens.add({ targets: rect, scaleX: 1.08, scaleY: 1.04, duration: 60, yoyo: true });
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
    const h = p.sneaking ? LAYOUT.playerSneakH : LAYOUT.playerH;
    if (this.playerRect.height !== h) this.playerRect.setSize(LAYOUT.playerW, h);
    this.playerRect.setPosition(p.x, FLOOR).setVisible(!p.hidden);
    this.playerLetter.setPosition(p.x, FLOOR - h / 2).setVisible(!p.hidden);

    const lightY = FLOOR - LAYOUT.lightY;
    this.darkness.draw(p.x, lightY, state.torchOn);
    this.drawWindows();
    this.drawVikram();
    this.hideVignette.setVisible(p.hidden);
    this.drawGhosts();
    this.drawOutlines();
    this.drawHitboxes();
  }

  drawGhosts() {
    const s = this.state;
    const dt = this.lastDt;
    this.flicker.update(s, dt);
    this.tint.update(s.presence, dt);
    this.updateShape(dt);
    // NG1: the steaming cup in the Hall until VM1 is done.
    const chai = ROOMS.HALL.hotspots.find((h) => h.id === 'H_CHAI');
    const ng1 = s.player.room === 'HALL' && !checkWhen({ vmDone: 1 }, s);
    this.chaiSteam.setVisible(ng1).setPosition(chai.x, LAYOUT.hotspotTopY - 14);
    // NG4: Nani's chai offer near the player.
    const offer = s.nani.offer;
    if (offer && offer.room === s.player.room) this.nani.showCup(offer.x, FLOOR);
    else this.nani.hideCup();
  }

  // Visible inside the torch circle, or within sightTorchOff even in the dark.
  drawVikram() {
    const s = this.state;
    const v = s.vikram;
    const d = Math.abs(v.x - s.player.x);
    const sameRoom = v.room === s.player.room && v.state !== 'AWAY';
    const seen = sameRoom && !s.player.hidden &&
      ((s.torchOn && d <= BALANCE.torch.radius) || d <= BALANCE.vikram.sightTorchOff);
    const show = sameRoom && (seen || this.registry.get('debugShowVikram'));
    this.vikramRect.setVisible(show).setPosition(v.x, FLOOR).setAlpha(seen ? 0.9 : 0.4);
    this.vikramLetter.setVisible(show).setPosition(v.x, FLOOR - VIKRAM_H / 2);
  }

  // Open windows (VM3) and the TV after VM7 get a cold tint.
  drawWindows() {
    const s = this.state;
    for (const [id, rect] of this.hotspotRects) {
      let cold = false;
      if (id.startsWith('H_WINDOW_')) {
        const room = id.slice('H_WINDOW_'.length);
        cold = (checkWhen({ vmCurrent: 3 }, s) && !s.windowsClosed.includes(room)) ||
          (room === 'LIVING' && s.flags.livingWindowReopened);
      } else if (id === 'H_TV') {
        cold = checkWhen({ vmDone: 7 }, s);
      } else {
        continue;
      }
      rect.setFillStyle(cold ? COLORS.cold : COLORS.lamp, cold ? 0.3 : 0.12);
    }
  }

  // Torch off: outlines within outlineDistOff always (so the dark is
  // navigable). Torch on: hint outlines within outlineDistOn if the setting
  // is on.
  drawOutlines() {
    const g = this.outlines;
    g.clear();
    const state = this.state;
    const T = BALANCE.torch;
    const dist = state.torchOn
      ? (state.settings.hotspotHints ? T.outlineDistOn : 0)
      : T.outlineDistOff;
    if (!dist) return;
    const room = ROOMS[state.player.room];
    g.lineStyle(1, COLORS.cream, 0.35);
    for (const hs of room.hotspots) {
      if (Math.abs(hs.x - state.player.x) <= dist) {
        g.strokeRect(hs.x - hs.w / 2, LAYOUT.hotspotTopY, hs.w, FLOOR - LAYOUT.hotspotTopY);
      }
    }
    for (const door of room.doors) {
      if (Math.abs(door.x - state.player.x) <= dist) {
        g.strokeRect(door.x - LAYOUT.doorW / 2, LAYOUT.doorTopY, LAYOUT.doorW, FLOOR - LAYOUT.doorTopY);
      }
    }
  }

  drawHitboxes() {
    const g = this.debugGfx;
    g.clear();
    if (!this.registry.get('debugHitboxes')) return;
    const room = ROOMS[this.state.player.room];
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
