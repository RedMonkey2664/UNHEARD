// The four rooms in 3D, built from code (low-poly, like the 2D art is drawn
// from code). Every hotspot, door and hide spot sits at its docs/04 x along
// the back wall, so the gameplay numbers are unchanged:
//   1 px of room x = 1 cm; the back wall is z = 0, the player walks at
//   z = TRACK_Z. Pickable meshes carry userData.pick = { type, id, x }.

import * as THREE from 'three';
import { COLORS } from '../config/constants.js';
import { ROOMS } from '../data/rooms.js';
import { ROOM_LAMP_X } from '../render/art/roomArt.js';
import { calendarTexture, floorTexture, glowTexture, labelSprite, notebookTexture, wallTexture } from './textures3d.js';

export const S = 0.01;          // metres per room px
export const ROOM_L = 9.6;
export const ROOM_D = 3.4;
export const ROOM_H = 2.8;
export const TRACK_Z = 1.9;

const WALL_TINT = { HALL: 0x2F4F4C, LIVING: 0x34504A, KITCHEN: 0x2E4C52, BEDROOM: 0x3A4A4E };

const mats = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!mats.has(key)) {
    mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...opts }));
  }
  return mats.get(key);
}

// A box whose bottom sits at y0 and whose back face touches z0.
function box(w, h, d, color, x, y0, z0, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), opts?.material || mat(color, opts));
  m.position.set(x, y0 + h / 2, z0 + d / 2);
  return m;
}

function cyl(r, h, color, x, y0, z, opts) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, opts?.r2 ?? r, h, opts?.seg || 16), mat(color, opts?.m));
  m.position.set(x, y0 + h / 2, z);
  return m;
}

function pickable(obj, pick) {
  obj.traverse((o) => { if (o.isMesh) o.userData.pick = pick; });
  return obj;
}

// --- the shell ------------------------------------------------------------

function shell(group, roomId) {
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture(roomId.length * 97, WALL_TINT[roomId]),
    roughness: 0.95 });
  const sideMat = new THREE.MeshStandardMaterial({ map: wallTexture(roomId.length * 31 + 5, WALL_TINT[roomId]),
    roughness: 0.95 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_L, ROOM_H), wallMat);
  back.position.set(ROOM_L / 2, ROOM_H / 2, 0);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_L, ROOM_H), wallMat);
  front.position.set(ROOM_L / 2, ROOM_H / 2, ROOM_D);
  front.rotation.y = Math.PI;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), sideMat);
  left.position.set(0, ROOM_H / 2, ROOM_D / 2);
  left.rotation.y = Math.PI / 2;
  const right = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), sideMat);
  right.position.set(ROOM_L, ROOM_H / 2, ROOM_D / 2);
  right.rotation.y = -Math.PI / 2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_L, ROOM_D),
    new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.7 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(ROOM_L / 2, 0, ROOM_D / 2);
  floor.userData.pick = { type: 'floor' };
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_L, ROOM_D), mat(COLORS.ceiling));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(ROOM_L / 2, ROOM_H, ROOM_D / 2);
  group.add(back, front, left, right, floor, ceiling);
  // Skirting along the back wall.
  group.add(box(ROOM_L, 0.1, 0.02, COLORS.skirting, ROOM_L / 2, 0, 0));
  // A ceiling fan in the middle of the room.
  const fan = new THREE.Group();
  fan.add(cyl(0.02, 0.35, COLORS.steelDark, 0, -0.35, 0));
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.01, 0.12), mat(COLORS.woodDark));
    blade.position.x = 0.4;
    const arm = new THREE.Group();
    arm.add(blade);
    arm.rotation.y = (i * Math.PI * 2) / 3;
    arm.position.y = -0.36;
    fan.add(arm);
  }
  fan.position.set(ROOM_L / 2, ROOM_H, ROOM_D / 2);
  group.add(fan);
  return fan;
}

// The tube light on the back wall and its warm light.
function tubeLight(group, roomId) {
  const x = ROOM_LAMP_X[roomId] * S;
  const tube = box(0.9, 0.05, 0.06, COLORS.bulb, x, 2.35, 0,
    { emissive: COLORS.bulb, emissiveIntensity: 0.35 });
  group.add(tube);
  const light = new THREE.PointLight(COLORS.lamp, 1.8, 10, 1.25);
  light.position.set(x, 2.2, 0.5);
  group.add(light);
  return { tube, light, base: 1.8 };
}

// --- doors, windows, hide spots ------------------------------------------

function door(group, d) {
  const x = d.x * S;
  const g = new THREE.Group();
  g.add(box(1.04, 2.2, 0.06, COLORS.woodDark, x, 0, 0));
  const slab = box(0.9, 2.1, 0.05, d.locked ? 0x3A2418 : COLORS.wood, x, 0, 0.04);
  g.add(slab);
  g.add(cyl(0.035, 0.05, COLORS.brass, x + 0.35, 1.0, 0.12, { m: { metalness: 0.8, roughness: 0.35 } }));
  if (d.locked) {
    g.add(box(0.3, 0.03, 0.02, COLORS.steel, x + 0.25, 1.45, 0.1, { metalness: 0.7, roughness: 0.4 }));
  }
  group.add(pickable(g, { type: 'door', id: d.id, x: d.x }));
}

function windowFrame(group, hs, { curtains = false } = {}) {
  const x = hs.x * S;
  const w = 0.84;
  const h = 1.15;
  const y0 = 1.0;
  const g = new THREE.Group();
  // The night outside: a dim blue glow behind the glass.
  const night = box(w, h, 0.01, COLORS.night, x, y0, 0.005,
    { emissive: COLORS.nightGlow, emissiveIntensity: 0.55 });
  g.add(night);
  for (const [fx, fy, fw, fh] of [[0, -0.04, w + 0.12, 0.08], [0, h - 0.04, w + 0.12, 0.08],
    [-w / 2 - 0.02, 0, 0.08, h], [w / 2 + 0.02, 0, 0.08, h]]) {
    g.add(box(fw, fh, 0.1, COLORS.woodDark, x + fx, y0 + fy, 0.01));
  }
  for (let i = 1; i < 5; i++) {
    g.add(box(0.015, h, 0.015, COLORS.steelDark, x - w / 2 + (i * w) / 5, y0, 0.11));
  }
  // Two glass panes on hinges at the outer edges; they swing in when open.
  const panes = [-1, 1].map((side) => {
    const hinge = new THREE.Group();
    hinge.position.set(x + side * (w / 2), y0 + h / 2, 0.12);
    const pane = new THREE.Mesh(new THREE.BoxGeometry(w / 2, h - 0.04, 0.02),
      mat(COLORS.glass, { transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0.2 }));
    pane.position.x = -side * (w / 4);
    hinge.add(pane);
    const sash = new THREE.Mesh(new THREE.BoxGeometry(w / 2, 0.03, 0.03), mat(COLORS.woodLight));
    sash.position.set(-side * (w / 4), h / 2 - 0.03, 0);
    hinge.add(sash);
    g.add(hinge);
    return { hinge, side };
  });
  if (curtains) {
    g.add(box(0.3, 1.5, 0.05, COLORS.fabric, x - w / 2 - 0.15, 0.8, 0.14));
    g.add(box(0.3, 1.5, 0.05, COLORS.fabric, x + w / 2 + 0.15, 0.8, 0.14));
  }
  // Rain blowing in when the window is open.
  const count = 160;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = x + (Math.random() - 0.5) * w;
    pos[i * 3 + 1] = y0 + Math.random() * h;
    pos[i * 3 + 2] = 0.15 + Math.random() * 0.9;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: COLORS.glass, size: 0.02,
    transparent: true, opacity: 0.6 }));
  rain.visible = false;
  g.add(rain);
  group.add(pickable(g, { type: 'hotspot', id: hs.id, x: hs.x }));
  rain.userData.pick = null;
  return { id: hs.id, panes, rain, night, x, y0, h, w, openK: 0 };
}

function hideSpot(group, roomId, spot) {
  const x = spot.x * S;
  let g;
  if (spot.id === 'LIVING_CURTAIN') {
    g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      g.add(box(0.2, 2.35, 0.06, i % 2 ? COLORS.fabric : COLORS.fabricDark, x - 0.4 + i * 0.2, 0.05, 0.25 + (i % 2) * 0.04));
    }
    g.add(cyl(0.015, 1.2, COLORS.brass, x, 2.42, 0.28, { m: { metalness: 0.7 } }));
    g.children[g.children.length - 1].rotation.z = Math.PI / 2;
  } else if (spot.id === 'LIVING_SOFA') {
    g = new THREE.Group();
    g.add(box(1.9, 0.42, 0.85, COLORS.fabric, x, 0.08, 0.35));
    g.add(box(1.9, 0.5, 0.2, COLORS.fabricDark, x, 0.45, 0.3));
    g.add(box(0.18, 0.6, 0.85, COLORS.fabricDark, x - 0.95, 0.08, 0.35));
    g.add(box(0.18, 0.6, 0.85, COLORS.fabricDark, x + 0.95, 0.08, 0.35));
    for (const dx of [-0.85, 0.85]) g.add(box(0.06, 0.08, 0.06, COLORS.woodDark, x + dx, 0, 0.4));
  } else if (spot.id === 'KITCHEN_PANTRY') {
    g = new THREE.Group();
    g.add(box(1.0, 2.2, 0.6, COLORS.woodDark, x, 0, 0));
    g.add(box(0.46, 2.1, 0.03, COLORS.wood, x - 0.24, 0.05, 0.6));
    g.add(box(0.46, 2.1, 0.03, COLORS.wood, x + 0.24, 0.05, 0.6));
    g.add(box(0.03, 0.18, 0.03, COLORS.brass, x - 0.04, 1.0, 0.63, { metalness: 0.8 }));
    g.add(box(0.03, 0.18, 0.03, COLORS.brass, x + 0.04, 1.0, 0.63, { metalness: 0.8 }));
  } else if (spot.id === 'BEDROOM_WARDROBE') {
    g = new THREE.Group();
    g.add(box(1.2, 2.25, 0.62, COLORS.wood, x, 0, 0));
    g.add(box(0.02, 2.0, 0.02, COLORS.woodDark, x, 0.12, 0.62));
    g.add(box(0.03, 0.2, 0.03, COLORS.brass, x - 0.06, 1.05, 0.64, { metalness: 0.8 }));
    g.add(box(0.03, 0.2, 0.03, COLORS.brass, x + 0.06, 1.05, 0.64, { metalness: 0.8 }));
    g.add(box(0.5, 0.7, 0.01, COLORS.glass, x + 0.3, 1.2, 0.63, { metalness: 0.9, roughness: 0.15 }));
  } else {
    // BEDROOM_UNDERBED: the gap under the bed (the bed itself is H_BED). An
    // unseen volume, so it can be tapped and the camera can sit inside it.
    g = box(1.3, 0.28, 0.95, 0x030404, x, 0.01, 0.06,
      { material: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }) });
  }
  group.add(pickable(g, { type: 'hide', id: spot.id, x: spot.x }));
}

// --- hotspots -------------------------------------------------------------

function table(g, x, w, h, d, color = COLORS.woodDark) {
  g.add(box(w, 0.05, d, color, x, h - 0.05, 0.05));
  for (const [dx, dz] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) {
    g.add(box(0.04, h - 0.05, 0.04, color, x + dx * (w / 2 - 0.04), 0, 0.07 + dz * (d - 0.08)));
  }
}

function hotspot(group, roomId, hs, refs) {
  const x = hs.x * S;
  const pick = { type: 'hotspot', id: hs.id, x: hs.x };
  const g = new THREE.Group();
  switch (hs.id) {
    case 'H_UMBRELLA': {
      const u = cyl(0.05, 0.9, 0x0B0C0E, x, 0, 0.12, { r2: 0.02 });
      u.rotation.z = 0.12;
      g.add(u, cyl(0.012, 0.15, COLORS.woodDark, x + 0.06, 0.88, 0.12));
      g.add(box(0.06, 0.08, 0.005, COLORS.paper, x + 0.07, 0.75, 0.16));
      break;
    }
    case 'H_CLOCK': {
      const face = cyl(0.19, 0.04, COLORS.paper, x, 0, 0, { seg: 24 });
      face.rotation.x = Math.PI / 2;
      face.position.set(x, 2.0, 0.03);
      const rim = cyl(0.21, 0.03, COLORS.woodDark, x, 0, 0, { seg: 24 });
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, 2.0, 0.015);
      // Stopped at 11:42.
      const hour = box(0.015, 0.1, 0.01, 0x111111, 0, 0, 0);
      hour.geometry.translate(0, 0.05, 0);
      hour.position.set(x, 2.0, 0.06);
      hour.rotation.z = (11.7 / 12) * -Math.PI * 2;
      const min = box(0.01, 0.15, 0.01, 0x111111, 0, 0, 0);
      min.geometry.translate(0, 0.075, 0);
      min.position.set(x, 2.0, 0.065);
      min.rotation.z = (42 / 60) * -Math.PI * 2;
      g.add(face, rim, hour, min);
      break;
    }
    case 'H_CHAI': {
      table(g, x, 0.55, 0.72, 0.4);
      g.add(cyl(0.04, 0.09, COLORS.steel, x, 0.72, 0.25, { m: { metalness: 0.85, roughness: 0.3 } }));
      refs.steamAt = new THREE.Vector3(x, 0.9, 0.25);
      break;
    }
    case 'H_COAT':
      g.add(box(0.12, 0.04, 0.12, COLORS.brass, x, 1.85, 0.02, { metalness: 0.7 }));
      g.add(box(0.5, 0.95, 0.14, 0x585C5E, x, 0.9, 0.06));
      g.add(box(0.56, 0.2, 0.16, 0x4C5052, x, 1.65, 0.05));
      break;
    case 'H_SHOES':
      g.add(box(0.11, 0.04, 0.26, 0x6B4A33, x - 0.08, 0, 0.12), box(0.11, 0.04, 0.26, 0x6B4A33, x + 0.08, 0, 0.12));
      break;
    case 'H_RADIO': {
      table(g, x, 0.6, 0.7, 0.42);
      g.add(box(0.42, 0.24, 0.18, COLORS.woodLight, x, 0.7, 0.12));
      g.add(box(0.2, 0.14, 0.01, COLORS.jute, x - 0.08, 0.75, 0.3));
      const dial = cyl(0.035, 0.02, COLORS.dialAmber, x + 0.12, 0, 0, { m: { emissive: COLORS.dialAmber, emissiveIntensity: 0.1 } });
      dial.rotation.x = Math.PI / 2;
      dial.position.set(x + 0.12, 0.82, 0.31);
      dial.material = dial.material.clone();
      refs.radioDial = dial;
      g.add(dial);
      break;
    }
    case 'H_WINDOW_LIVING':
    case 'H_WINDOW_KITCHEN':
      refs.windows.push(windowFrame(group, hs));
      return;
    case 'H_WINDOW_BEDROOM':
      refs.windows.push(windowFrame(group, hs, { curtains: true }));
      return;
    case 'H_CALENDAR': {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.55),
        new THREE.MeshStandardMaterial({ map: calendarTexture(), roughness: 0.9 }));
      p.position.set(x, 1.6, 0.02);
      g.add(p);
      break;
    }
    case 'H_ASHTRAY':
      table(g, x, 0.5, 0.6, 0.42);
      g.add(cyl(0.08, 0.035, COLORS.glass, x, 0.6, 0.24, { r2: 0.06, m: { transparent: true, opacity: 0.55, roughness: 0.1 } }));
      break;
    case 'H_TV': {
      g.add(box(1.05, 0.5, 0.45, COLORS.woodDark, x, 0, 0.02));
      g.add(box(0.82, 0.55, 0.32, 0x1A1C1D, x, 0.5, 0.06));
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.44),
        new THREE.MeshStandardMaterial({ color: 0x0A0C0C, roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0 }));
      screen.position.set(x, 0.775, 0.385);
      refs.tvScreen = screen;
      g.add(screen);
      break;
    }
    case 'H_DRAWER_L':
    case 'H_DRAWER_K': {
      if (hs.id === 'H_DRAWER_L') {
        g.add(box(0.6, 0.8, 0.45, COLORS.wood, x, 0, 0.02));
        for (const y of [0.15, 0.42, 0.66]) g.add(box(0.12, 0.025, 0.03, COLORS.brass, x, y, 0.47, { metalness: 0.8 }));
      } else {
        // A drawer in the counter: a lighter face so it stands out.
        g.add(box(0.5, 0.22, 0.02, COLORS.woodLight, x, 0.62, 0.61));
        g.add(box(0.14, 0.025, 0.03, COLORS.steel, x, 0.72, 0.63, { metalness: 0.8 }));
      }
      break;
    }
    case 'H_NOTEBOOK': {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.25),
        new THREE.MeshStandardMaterial({ map: notebookTexture(), roughness: 0.9 }));
      p.rotation.x = -Math.PI / 2 + 0.15;
      p.position.set(x, 0.915, 0.35);
      g.add(p);
      break;
    }
    case 'H_COOKER':
      g.add(box(0.6, 0.05, 0.45, 0x1F2224, x, 0.9, 0.1, { metalness: 0.5 }));
      g.add(cyl(0.14, 0.24, COLORS.steel, x, 0.95, 0.32, { m: { metalness: 0.85, roughness: 0.3 } }));
      g.add(cyl(0.15, 0.03, COLORS.steelDark, x, 1.19, 0.32, { m: { metalness: 0.8 } }));
      g.add(cyl(0.025, 0.07, 0x111111, x, 1.22, 0.32));
      g.add(box(0.28, 0.025, 0.04, 0x111111, x + 0.24, 1.17, 0.3));
      break;
    case 'H_LOCKER':
      g.add(box(0.72, 1.6, 0.5, COLORS.steelDark, x, 0, 0.02, { metalness: 0.75, roughness: 0.4 }));
      g.add(box(0.02, 1.5, 0.01, 0x2A2F31, x, 0.05, 0.52));
      g.add(cyl(0.06, 0.03, COLORS.steel, x + 0.18, 0, 0, { m: { metalness: 0.9, roughness: 0.25 } }));
      g.children[g.children.length - 1].rotation.x = Math.PI / 2;
      g.children[g.children.length - 1].position.set(x + 0.18, 0.95, 0.535);
      break;
    case 'H_DESK':
      table(g, x, 0.95, 0.76, 0.55);
      g.add(box(0.3, 0.005, 0.22, COLORS.paper, x - 0.15, 0.76, 0.2));
      g.add(box(0.22, 0.005, 0.3, COLORS.paperDim, x + 0.2, 0.76, 0.15));
      break;
    case 'H_NIGHTSTAND':
      g.add(box(0.45, 0.55, 0.42, COLORS.wood, x, 0, 0.02));
      g.add(cyl(0.05, 0.28, COLORS.brass, x - 0.1, 0.55, 0.2));
      g.add(cyl(0.13, 0.15, COLORS.paper, x - 0.1, 0.83, 0.2, { r2: 0.17, m: { emissive: COLORS.lamp, emissiveIntensity: 0.15 } }));
      g.add(box(0.12, 0.01, 0.09, COLORS.paper, x + 0.1, 0.55, 0.2));
      break;
    case 'H_BED':
      g.add(box(1.9, 0.18, 1.0, COLORS.woodDark, x + 0.3, 0.28, 0.02));
      g.add(box(1.85, 0.16, 0.96, COLORS.sheet, x + 0.3, 0.46, 0.04));
      g.add(box(0.5, 0.12, 0.5, COLORS.paper, x - 0.35, 0.62, 0.25));
      g.add(box(0.06, 0.9, 1.0, COLORS.woodDark, x - 0.68, 0, 0.02));
      for (const dx of [0.6, 1.2]) g.add(box(0.05, 0.28, 0.05, COLORS.woodDark, x + dx, 0, 0.92));
      break;
    case 'H_DRESSER':
      g.add(box(0.85, 0.95, 0.45, COLORS.wood, x, 0, 0.02));
      g.add(box(0.6, 0.75, 0.02, COLORS.glass, x, 1.15, 0.02, { metalness: 0.9, roughness: 0.12 }));
      for (const dx of [-0.25, -0.1, 0.1]) g.add(cyl(0.03, 0.06, COLORS.brass, x + dx, 0.95, 0.25, { m: { metalness: 0.8 } }));
      break;
    default:
      g.add(box(hs.w * S, 0.5, 0.3, COLORS.wood, x, 0, 0.02));
  }
  group.add(pickable(g, pick));
}

// The wall behind the player (what you see from a hiding place): family
// photos in old frames and a shelf with steel tins.
function frontWall(group, roomId) {
  const z = ROOM_D - 0.03;
  const photos = { HALL: [2.0, 3.2, 6.4], LIVING: [2.4, 3.4, 6.0, 7.6], KITCHEN: [3.0, 6.8], BEDROOM: [2.2, 5.0, 7.2] }[roomId];
  photos.forEach((x, i) => {
    const w = i % 2 ? 0.34 : 0.42;
    const h = i % 2 ? 0.44 : 0.32;
    group.add(box(w + 0.06, h + 0.06, 0.03, COLORS.woodDark, x, 1.45 + (i % 2) * 0.12, z - 0.03));
    group.add(box(w, h, 0.01, i % 2 ? COLORS.paperDim : COLORS.sheet, x, 1.48 + (i % 2) * 0.12, z - 0.045,
      { emissive: COLORS.paper, emissiveIntensity: 0.03 }));
  });
  const shelfX = { HALL: 4.8, LIVING: 4.8, KITCHEN: 4.8, BEDROOM: 3.6 }[roomId];
  group.add(box(1.4, 0.04, 0.25, COLORS.wood, shelfX, 1.1, z - 0.25));
  for (let i = 0; i < 4; i++) {
    group.add(cyl(0.06, 0.16 + (i % 2) * 0.06, COLORS.steel, shelfX - 0.5 + i * 0.33, 1.14, z - 0.13,
      { m: { metalness: 0.8, roughness: 0.35 } }));
  }
}

// Furniture that is not a hotspot: the kitchen counter, a rug.
function extras(group, roomId) {
  frontWall(group, roomId);
  if (roomId === 'KITCHEN') {
    group.add(box(3.6, 0.9, 0.6, COLORS.wood, 4.2, 0, 0.02));
    group.add(box(3.64, 0.04, 0.64, COLORS.tile, 4.2, 0.9, 0.0));
    group.add(box(3.6, 0.5, 0.01, COLORS.tile, 4.2, 0.94, 0.0));
  }
  if (roomId === 'LIVING' || roomId === 'BEDROOM') {
    const rug = box(2.6, 0.01, 1.4, roomId === 'LIVING' ? COLORS.clay : COLORS.jute, 4.6, 0.001, 1.2);
    group.add(rug);
  }
  if (roomId === 'HALL') {
    // A garland of dried marigolds over the front door.
    for (let i = 0; i < 14; i++) {
      const m = cyl(0.03, 0.03, i % 2 ? COLORS.marigold : COLORS.marigoldDry, 8.25 + i * 0.09, 2.3 - Math.sin((i / 13) * Math.PI) * 0.12, 0.08);
      group.add(m);
    }
  }
}

// Builds one room; returns what the view animates.
export function buildRoom(roomId) {
  const room = ROOMS[roomId];
  const group = new THREE.Group();
  const refs = { windows: [], tvScreen: null, radioDial: null, steamAt: null, labels: [] };
  refs.fan = shell(group, roomId);
  refs.lamp = tubeLight(group, roomId);
  extras(group, roomId);
  for (const d of room.doors) {
    door(group, d);
    refs.labels.push({ id: d.id, x: d.x, y: 2.35, text: d.to ? ROOMS[d.to].label : 'Front door' });
  }
  for (const spot of room.hideSpots) {
    hideSpot(group, roomId, spot);
    refs.labels.push({ id: spot.id, x: spot.x, y: spot.id === 'BEDROOM_UNDERBED' ? 0.45 : 2.0, text: spot.label, hide: true });
  }
  for (const hs of room.hotspots) {
    hotspot(group, roomId, hs, refs);
    refs.labels.push({ id: hs.id, x: hs.x, y: labelHeight(hs.id), text: hs.label });
  }
  for (const l of refs.labels) {
    l.sprite = labelSprite(l.text);
    l.sprite.position.set(l.x * S, l.y, 0.5);
    group.add(l.sprite);
    l.glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: COLORS.cream,
      blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false }));
    l.glint.scale.set(0.12, 0.12, 1);
    l.glint.position.set(l.x * S, l.y - 0.22, 0.45);
    group.add(l.glint);
  }
  return { group, refs };
}

const LABEL_Y = {
  H_CLOCK: 2.35, H_CALENDAR: 2.0, H_WINDOW_LIVING: 2.35, H_WINDOW_KITCHEN: 2.35, H_WINDOW_BEDROOM: 2.35,
  H_COAT: 2.05, H_LOCKER: 1.8, H_COOKER: 1.45, H_NOTEBOOK: 1.2, H_DRAWER_K: 1.15, H_TV: 1.25, H_DESK: 1.1,
  H_DRESSER: 2.05, H_BED: 1.0, H_NIGHTSTAND: 1.2, H_UMBRELLA: 1.15, H_SHOES: 0.4, H_CHAI: 1.05,
  H_RADIO: 1.15, H_ASHTRAY: 0.9, H_DRAWER_L: 1.05
};
function labelHeight(id) {
  return LABEL_Y[id] ?? 1.2;
}
