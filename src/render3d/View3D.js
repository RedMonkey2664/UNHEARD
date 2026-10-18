// First-person 3D view (Three.js). Draws the same game state the 2D room
// shows: the player is the camera, walking along each room at TRACK_Z; the
// torch is a spotlight in the player's hand. A WebGL canvas sits under the
// Phaser canvas, which stays on top for the HUD, phone, puzzles and
// subtitles. Gameplay is untouched: every position is a room x from docs/04.

import * as THREE from 'three';
import { BALANCE } from '../config/balance.js';
import { COLORS } from '../config/constants.js';
import { ROOMS } from '../data/rooms.js';
import { DEVICE } from '../utils/device.js';
import { buildRoom, S, TRACK_Z } from './props3d.js';
import { createStatic, glowTexture } from './textures3d.js';

const T = BALANCE.torch;
const P = BALANCE.player;
const EYE = 1.6;
const EYE_SNEAK = 1.2;
const VIKRAM_Z = 1.25;
const LOOK_SPEED = 0.0055;     // radians per game px dragged
const PITCH_MAX = 1.2;
const TURN_SPEED = 2.2;        // radians per second (arrow keys)
const TORCH_ON = 6.5;
const TORCH_FLICKER = 0.35;    // share of the torch lost at full jitter

// Where the camera sits in each hiding place (x is the spot's x), facing out
// into the room, and how the hiding place frames the view: side panels
// (doors ajar, curtain edges), the bed's underside on top, the sofa back
// below. Values are the share of the half-screen each panel covers.
const HIDE_VIEW = {
  LIVING_CURTAIN: { y: 1.45, z: 0.42, yaw: Math.PI, sides: 0.55, color: COLORS.fabricDark },
  LIVING_SOFA: { y: 1.02, z: 0.16, yaw: Math.PI, bottom: 0.35, color: COLORS.fabricDark },
  KITCHEN_PANTRY: { y: 1.45, z: 0.66, yaw: Math.PI, sides: 0.6, color: COLORS.woodDark },
  BEDROOM_UNDERBED: { y: 0.16, z: 1.02, yaw: Math.PI, pitch: 0.04, top: 0.55, color: COLORS.woodDark },
  BEDROOM_WARDROBE: { y: 1.45, z: 0.68, yaw: Math.PI, sides: 0.6, color: COLORS.wood }
};
const PEEK_DIST = 0.3;

function lerp(a, b, k) {
  return a + (b - a) * k;
}

// A person from capsules: built facing +z, origin at the feet. Limbs hang
// from pivots so walking can swing them.
function person({ shirt, trousers, skin, hair, height = 1.78, eyes = true }) {
  const g = new THREE.Group();
  const m = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const k = height / 1.78;
  const capsule = (r, len, mat) => new THREE.Mesh(new THREE.CapsuleGeometry(r * k, len * k, 4, 10), mat);
  const legMat = m(trousers);
  const shirtMat = m(shirt);
  const skinMat = m(skin, 0.7);
  const legs = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.1 * k, 0.9 * k, 0);
    const leg = capsule(0.075, 0.72, legMat);
    leg.position.y = -0.44 * k;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11 * k, 0.07 * k, 0.26 * k), m(0x161412, 0.6));
    shoe.position.set(0, -0.86 * k, 0.05 * k);
    pivot.add(leg, shoe);
    g.add(pivot);
    return pivot;
  });
  const torso = capsule(0.17, 0.42, shirtMat);
  torso.scale.set(1.25, 1, 0.72);
  torso.position.y = 1.2 * k;
  const hips = capsule(0.15, 0.12, legMat);
  hips.scale.set(1.25, 1, 0.75);
  hips.position.y = 0.94 * k;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * k, 0.055 * k, 0.1 * k, 10), skinMat);
  neck.position.y = 1.53 * k;
  g.add(torso, hips, neck);
  const arms = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.25 * k, 1.45 * k, 0);
    const arm = capsule(0.055, 0.5, shirtMat);
    arm.position.y = -0.3 * k;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05 * k, 10, 8), skinMat);
    hand.position.y = -0.62 * k;
    pivot.add(arm, hand);
    g.add(pivot);
    return pivot;
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105 * k, 18, 14), skinMat);
  head.scale.set(0.9, 1.1, 0.95);
  head.position.y = 1.67 * k;
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.11 * k, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), m(hair, 0.95));
  hairCap.scale.set(0.92, 1.1, 1);
  hairCap.position.set(0, 1.685 * k, -0.008 * k);
  g.add(head, hairCap);
  if (eyes) {
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.013 * k, 8, 6), m(0x0a0807, 0.3));
      eye.position.set(side * 0.035 * k, 1.69 * k, 0.092 * k);
      g.add(eye);
    }
  }
  return { group: g, legs, arms };
}

export class View3D {
  constructor(game) {
    this.game = game;
    this.phaserCanvas = game.canvas;
    this.parent = this.phaserCanvas.parentElement;
    this.prevCanvasStyle = { position: this.phaserCanvas.style.position, zIndex: this.phaserCanvas.style.zIndex };
    this.phaserCanvas.style.position = 'relative';
    this.phaserCanvas.style.zIndex = '2';

    this.renderer = new THREE.WebGLRenderer({ antialias: !DEVICE.touch, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DEVICE.touch ? 1.25 : 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setClearColor(COLORS.void, 1);
    const c = this.renderer.domElement;
    Object.assign(c.style, { position: 'absolute', zIndex: '0', pointerEvents: 'none' });
    this.parent.insertBefore(c, this.phaserCanvas);

    // Flashes, door fades and the hiding vignette, between the two canvases.
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, { position: 'absolute', zIndex: '1', pointerEvents: 'none',
      background: '#000', opacity: '0', transition: 'opacity 0.2s' });
    this.hideShade = document.createElement('div');
    Object.assign(this.hideShade.style, { position: 'absolute', zIndex: '1', pointerEvents: 'none', opacity: '0',
      transition: 'opacity 0.3s', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)' });
    this.parent.insertBefore(this.overlay, this.phaserCanvas);
    this.parent.insertBefore(this.hideShade, this.phaserCanvas);
    this.rect = { l: -1, t: -1, w: -1, h: -1 };

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(COLORS.void, 0.11);
    this.camera = new THREE.PerspectiveCamera(66, 960 / 540, 0.05, 30);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    this.yaw = 0;
    this.pitch = -0.05;
    this.bobT = 0;
    this.camY = EYE;

    this.hemi = new THREE.HemisphereLight(0x5A8088, 0x0A0806, 0.95);
    this.scene.add(this.hemi);
    this.skyBase = new THREE.Color(0x5A8088);
    this.skyCold = new THREE.Color(COLORS.cold);

    // The torch: a warm spotlight in the hand, aimed where you look.
    this.torch = new THREE.SpotLight(COLORS.torchWarm, TORCH_ON, 11, 0.5, 0.55, 1.4);
    this.torch.position.set(0.18, -0.25, 0);
    this.torch.target.position.set(0, -0.05, -1);
    this.camera.add(this.torch, this.torch.target);
    // The phone glow: always on, so you never lose yourself in the dark.
    this.handLight = new THREE.PointLight(COLORS.phoneGlow, 0.5, 2.6, 2);
    this.handLight.position.set(0.15, -0.3, -0.3);
    this.camera.add(this.handLight);

    this.rooms = new Map();
    this.roomId = null;
    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.glowTex = glowTexture();
    this.static = createStatic();
    this.staticT = 0;
    this.tvFaceUntil = 0;
    this.radioUntil = 0;
    this.time = 0;

    this.buildCharacters();
    this.buildPeek();
    this.wasHidden = false;
  }

  // Four panels just in front of the camera that frame the hiding view.
  buildPeek() {
    const halfH = PEEK_DIST * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const halfW = halfH * this.camera.aspect;
    this.peekMat = new THREE.MeshStandardMaterial({ color: COLORS.wood, roughness: 0.9 });
    const panel = (w, h, x, y) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.peekMat);
      m.position.set(x, y, -PEEK_DIST);
      m.renderOrder = 5;
      m.visible = false;
      this.camera.add(m);
      return m;
    };
    this.peek = {
      halfW, halfH,
      left: panel(halfW * 2, halfH * 2.4, 0, 0),
      right: panel(halfW * 2, halfH * 2.4, 0, 0),
      top: panel(halfW * 2.4, halfH * 2, 0, 0),
      bottom: panel(halfW * 2.4, halfH * 2, 0, 0)
    };
  }

  setPeek(view) {
    const { halfW, halfH, left, right, top, bottom } = this.peek;
    for (const m of [left, right, top, bottom]) m.visible = false;
    if (!view) return;
    this.peekMat.color.setHex(view.color);
    // Each panel is full size; slide it so it covers `share` of its half.
    if (view.sides) {
      left.position.x = -halfW * (2 - view.sides);
      right.position.x = halfW * (2 - view.sides);
      left.visible = right.visible = true;
    }
    if (view.top) {
      top.position.y = halfH * (2 - view.top);
      top.visible = true;
    }
    if (view.bottom) {
      bottom.position.y = -halfH * (2 - view.bottom);
      bottom.visible = true;
    }
  }

  buildCharacters() {
    const v = person({ shirt: 0x4A5563, trousers: COLORS.trousers, skin: COLORS.skinDark, hair: COLORS.hair });
    this.vikram = v;
    this.scene.add(v.group);
    v.group.visible = false;

    // The Hollow: too tall, too thin, darker than the dark.
    const h = new THREE.Group();
    const black = new THREE.MeshBasicMaterial({ color: COLORS.hollow, fog: false });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.26, 2.1, 10), black);
    body.position.y = 1.05;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), black);
    head.position.y = 2.25;
    this.hollowFace = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26),
      new THREE.MeshBasicMaterial({ color: COLORS.hollowFace, transparent: true, opacity: 0 }));
    this.hollowFace.position.set(0, 2.25, 0.16);
    h.add(body, head, this.hollowFace);
    h.visible = false;
    this.hollow = { group: h, until: 0 };
    this.scene.add(h);

    // Nani's glimpse: pale, warm, a little see-through.
    const n = person({ shirt: COLORS.saree, trousers: COLORS.sareeShade, skin: COLORS.skin, hair: COLORS.greyHair, height: 1.55, eyes: false });
    n.group.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.transparent = true;
        o.material.opacity = 0.3;
        o.material.emissive = new THREE.Color(COLORS.cream);
        o.material.emissiveIntensity = 0.25;
      }
    });
    n.group.visible = false;
    this.nani = { group: n.group, until: 0, alpha: 0.3 };
    this.scene.add(n.group);

    // NG4: the chai Nani offers, on a little stool by you.
    const cup = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.8 });
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 16), wood);
    seat.position.y = 0.45;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.45, 8), wood);
    leg.position.y = 0.22;
    const steel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 14),
      new THREE.MeshStandardMaterial({ color: COLORS.steel, metalness: 0.85, roughness: 0.3,
        emissive: COLORS.lamp, emissiveIntensity: 0.12 }));
    steel.position.y = 0.52;
    cup.add(seat, leg, steel);
    cup.traverse((o) => { if (o.isMesh) o.userData.pick = { type: 'cup' }; });
    const warm = new THREE.PointLight(COLORS.lamp, 0.6, 1.6, 2);
    warm.position.y = 0.7;
    cup.add(warm);
    cup.visible = false;
    this.cup = cup;
    this.scene.add(cup);

    this.steam = [0, 1, 2].map(() => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: COLORS.cream,
        transparent: true, opacity: 0, depthWrite: false }));
      s.scale.set(0.1, 0.16, 1);
      s.raycast = () => {};
      this.scene.add(s);
      return s;
    });
  }

  // --- rooms ----------------------------------------------------------------

  setRoom(roomId) {
    if (this.roomId === roomId) return;
    if (this.roomId) this.rooms.get(this.roomId).group.visible = false;
    if (!this.rooms.has(roomId)) {
      const built = buildRoom(roomId);
      built.group.traverse((o) => { if (o.isSprite) o.raycast = () => {}; });
      this.scene.add(built.group);
      this.rooms.set(roomId, built);
    }
    this.roomId = roomId;
    this.room = this.rooms.get(roomId);
    this.room.group.visible = true;
  }

  // --- input ----------------------------------------------------------------

  look(dx, dy) {
    this.yaw -= dx * LOOK_SPEED;
    this.pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, this.pitch - dy * LOOK_SPEED));
  }

  turn(dir, dt) {
    this.yaw -= dir * TURN_SPEED * dt;
  }

  // Walking is along the room only: forward and strafe keys become -1, 0
  // or +1 along x, from where the camera is facing.
  moveDir(forward, strafe) {
    const dx = forward * -Math.sin(this.yaw) + strafe * Math.cos(this.yaw);
    return Math.abs(dx) < 0.3 ? 0 : Math.sign(dx);
  }

  // What is under a point of the screen (game px): a hotspot, door, hide
  // spot or the cup, else the floor x to walk to.
  pick(px, py) {
    if (!this.room) return null;
    this.ndc.set(px / 480 - 1, 1 - py / 270);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const targets = [this.room.group];
    if (this.cup.visible) targets.push(this.cup);
    const hits = this.raycaster.intersectObjects(targets, true);
    for (const h of hits) {
      const p = h.object.userData.pick;
      if (p === null) continue;
      if (p && p.type !== 'floor') return p;
      const x = Math.max(BALANCE.world.walkMinX, Math.min(BALANCE.world.walkMaxX, h.point.x / S));
      return { type: 'floor', x };
    }
    return null;
  }

  // --- effects --------------------------------------------------------------

  flash(color, alpha, ms) {
    const o = this.overlay;
    o.style.transition = 'none';
    o.style.background = color;
    o.style.opacity = String(alpha);
    void o.offsetWidth;
    o.style.transition = `opacity ${ms}ms`;
    o.style.opacity = '0';
  }

  fadeThrough(ms) {
    const o = this.overlay;
    o.style.background = '#000';
    o.style.transition = `opacity ${ms / 2}ms`;
    o.style.opacity = '1';
    setTimeout(() => { o.style.opacity = '0'; }, ms / 2);
  }

  lampFlicker() {
    this.flickerT = 0.28;
  }

  radioOn(sec) {
    this.radioUntil = this.time + sec;
  }

  tvFace(sec) {
    this.tvFaceUntil = this.time + sec;
  }

  hollowShow(x, sec, face) {
    const h = this.hollow;
    h.group.position.set(x * S, 0, TRACK_Z - 0.9);
    h.until = sec ? this.time + sec : Infinity;
    h.group.visible = true;
    this.hollowFace.material.opacity = face ? 1 : 0;
  }

  hollowHide() {
    this.hollow.group.visible = false;
    this.hollow.until = 0;
  }

  naniShow(x, sec, alpha, y = 0) {
    const n = this.nani;
    n.group.position.set(x * S, y, y ? 0.3 : 0.6);
    n.group.rotation.y = 0;
    n.until = this.time + sec;
    n.alpha = alpha;
    n.group.visible = true;
  }

  // --- frame ----------------------------------------------------------------

  syncSize() {
    const c = this.phaserCanvas;
    const l = c.offsetLeft;
    const t = c.offsetTop;
    const w = c.clientWidth;
    const h = c.clientHeight;
    const r = this.rect;
    if (l === r.l && t === r.t && w === r.w && h === r.h) return;
    Object.assign(r, { l, t, w, h });
    for (const el of [this.renderer.domElement, this.overlay, this.hideShade]) {
      Object.assign(el.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' });
    }
    this.renderer.setSize(w, h, false);
  }

  // info: { windowOpen(id), tvOn, steam, jitter, blackout, busy, hintDist }
  update(state, dt, info) {
    this.time += dt;
    this.syncSize();
    const p = state.player;
    this.setRoom(p.room);

    // Camera: the player's eyes, or inside the hiding place.
    if (p.hidden !== this.wasHidden) {
      this.wasHidden = p.hidden;
      if (p.hidden) {
        this.savedYaw = this.yaw;
        this.savedPitch = this.pitch;
        const spot = ROOMS[p.room].hideSpots.find((s) => s.id === p.hideSpotId) ||
          ROOMS[p.room].hideSpots.reduce((a, b) => (Math.abs(b.x - p.x) < Math.abs(a.x - p.x) ? b : a));
        this.hideView = { x: spot.x * S, ...HIDE_VIEW[spot.id] };
        this.yaw = this.hideView.yaw;
        this.pitch = this.hideView.pitch ?? 0;
        this.setPeek(this.hideView);
      } else {
        this.yaw = this.savedYaw ?? 0;
        this.pitch = this.savedPitch ?? 0;
        this.hideView = null;
        this.setPeek(null);
      }
      this.hideShade.style.opacity = p.hidden ? '1' : '0';
    }
    const cam = this.camera;
    if (this.hideView) {
      cam.position.set(this.hideView.x, this.hideView.y, this.hideView.z);
    } else {
      const eye = p.sneaking ? EYE_SNEAK : EYE;
      this.camY = lerp(this.camY, eye, Math.min(1, dt * 8));
      if (p.moving) this.bobT += dt * (p.sneaking ? 6 : 9);
      const bob = p.moving ? Math.sin(this.bobT) * (p.sneaking ? 0.015 : 0.03) : 0;
      cam.position.set(p.x * S, this.camY + bob, TRACK_Z);
    }
    cam.rotation.set(this.pitch, this.yaw, 0);

    // Torch, phone glow, Presence flicker and blackouts.
    const jitter = info.jitter / T.flickerJitter;
    this.torch.intensity = info.blackout || !state.torchOn ? 0 : TORCH_ON * (1 - Math.abs(jitter) * TORCH_FLICKER);
    this.handLight.intensity = info.blackout ? 0.05 : (state.torchOn ? 0.15 : 0.5);
    const lamp = this.room.refs.lamp;
    let lampK = info.blackout ? 0 : 1;
    if (this.flickerT > 0) {
      this.flickerT -= dt;
      lampK = Math.floor(this.flickerT * 25) % 2 ? 2.2 : 0.2;
    }
    lamp.light.intensity = lamp.base * lampK;
    lamp.tube.material.emissiveIntensity = 0.35 * lampK;
    // Presence turns the room cold and teal.
    this.hemi.color.copy(this.skyBase).lerp(this.skyCold, Math.min(1, state.presence / 100) * 0.6);
    this.hemi.intensity = info.blackout ? 0.1 : 0.95;
    this.room.refs.fan.rotation.y += dt * 1.6;

    this.updateWindows(info, dt);
    this.updateRoomFx(state, info, dt);
    this.updateVikram(state, dt);
    this.updateGhosts(state, dt);
    this.updateLabels(state, info, dt);

    this.renderer.render(this.scene, cam);
  }

  updateWindows(info, dt) {
    for (const w of this.room.refs.windows) {
      const open = info.windowOpen(w.id);
      w.openK = lerp(w.openK, open ? 1 : 0, Math.min(1, dt * 3));
      for (const { hinge, side } of w.panes) hinge.rotation.y = side * -w.openK * 1.25;
      w.rain.visible = w.openK > 0.05;
      if (w.rain.visible) {
        const pos = w.rain.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          let y = pos.getY(i) - dt * 3.2;
          let z = pos.getZ(i) + dt * 0.9;
          if (y < 0.05 || z > 1.4) {
            y = w.y0 + w.h * Math.random();
            z = 0.12;
          }
          pos.setY(i, y);
          pos.setZ(i, z);
        }
        pos.needsUpdate = true;
      }
    }
  }

  updateRoomFx(state, info, dt) {
    const refs = this.room.refs;
    if (refs.tvScreen) {
      const mat = refs.tvScreen.material;
      if (info.tvOn) {
        this.staticT -= dt;
        if (this.staticT <= 0) {
          this.staticT = 0.07;
          this.static.draw(this.time < this.tvFaceUntil);
          mat.emissiveMap = this.static.texture;
          mat.map = this.static.texture;
          mat.needsUpdate = mat.emissiveIntensity === 0 ? true : mat.needsUpdate;
          mat.emissiveIntensity = 0.9;
          mat.color.setHex(0xffffff);
        }
      } else if (mat.emissiveIntensity) {
        mat.emissiveIntensity = 0;
        mat.color.setHex(0x0a0c0c);
      }
    }
    if (refs.radioDial) refs.radioDial.material.emissiveIntensity = this.time < this.radioUntil ? 1.6 : 0.1;
    const at = info.steam && refs.steamAt;
    this.steam.forEach((s, i) => {
      if (!at) { s.material.opacity = 0; return; }
      const k = ((this.time * 0.5 + i / 3) % 1);
      s.position.set(at.x + Math.sin(this.time * 2 + i) * 0.02, at.y + k * 0.25, at.z);
      s.material.opacity = 0.22 * Math.sin(Math.PI * k);
    });
  }

  updateVikram(state, dt) {
    const v = state.vikram;
    const g = this.vikram.group;
    const here = v.room === state.player.room && v.state !== 'AWAY' && v.room;
    g.visible = Boolean(here);
    if (!here) return;
    g.position.set(v.x * S, 0, VIKRAM_Z);
    const close = Math.abs(v.x - state.player.x) < 160 || v.state === 'CHASE';
    const target = close
      ? Math.atan2(state.player.x * S - g.position.x, TRACK_Z - VIKRAM_Z)
      : (v.facing >= 0 ? Math.PI / 2 : -Math.PI / 2);
    g.rotation.y = lerp(g.rotation.y, target, Math.min(1, dt * 6));
    this.vikWalk = (this.vikWalk || 0) + (v.moving ? dt * (v.state === 'CHASE' ? 11 : 7) : 0);
    const swing = v.moving ? Math.sin(this.vikWalk) * 0.5 : 0;
    this.vikram.legs[0].rotation.x = swing;
    this.vikram.legs[1].rotation.x = -swing;
    this.vikram.arms[0].rotation.x = -swing * 0.8;
    this.vikram.arms[1].rotation.x = v.state === 'CHASE' ? -1.3 : swing * 0.8;
  }

  updateGhosts(state, dt) {
    const h = this.hollow;
    if (h.group.visible) {
      if (this.time > h.until) this.hollowHide();
      else h.group.lookAt(this.camera.position.x, 0, this.camera.position.z);
    }
    const n = this.nani;
    if (n.group.visible) {
      const left = n.until - this.time;
      if (left <= 0) n.group.visible = false;
      else n.group.traverse((o) => { if (o.isMesh) o.material.opacity = n.alpha * Math.min(1, left); });
    }
    const offer = state.nani.offer;
    const show = Boolean(offer && offer.room === state.player.room);
    this.cup.visible = show;
    if (show) this.cup.position.set(offer.x * S, 0, TRACK_Z - 0.75);
  }

  // Labels near you, glints a little further (docs/10 section 4 rules).
  updateLabels(state, info, dt) {
    const px = state.player.x;
    for (const l of this.room.refs.labels) {
      const d = Math.abs(l.x - px);
      const range = l.hide ? P.hideRange : P.interactRange * 1.3;
      const near = !info.busy && d <= range;
      const glint = !info.busy && !near && d <= Math.max(info.hintDist, P.interactRange * 2.2);
      l.sprite.material.opacity = lerp(l.sprite.material.opacity, near ? 1 : 0, Math.min(1, dt * 8));
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 3 + l.x * 0.013);
      l.glint.material.opacity = glint ? 0.25 + 0.4 * pulse : 0;
    }
  }

  dispose() {
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.overlay.remove();
    this.hideShade.remove();
    Object.assign(this.phaserCanvas.style, this.prevCanvasStyle);
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
  }
}
