// Ids, enums, colour tokens and UI constants (docs/07). Gameplay numbers live
// in balance.js, not here.

export const COLORS = {
  void:    0x050708,
  wall:    0x1F3A3A,
  lamp:    0xF2B35A,
  cream:   0xF3DDB1,
  cold:    0x4FD1C5,
  danger:  0xC0392B,
  panel:   0x101617,
  line:    0x2B3B3B,
  text:    0xE8E2D0,

  // Visual pass (docs/10). Room shell.
  wallTop:    0x070B0C,
  wainscot:   0x14262A,
  rail:       0x2E4A48,
  plaster:    0x41605B,
  stain:      0x0A1416,
  skirting:   0x2A1C14,
  ceiling:    0x040606,
  floorA:     0x2B2A26,
  floorB:     0x1E1D1A,
  grout:      0x0E0D0B,
  // Materials.
  wood:       0x4A3122,
  woodDark:   0x2C1D14,
  woodLight:  0x6B4A33,
  steel:      0x8C969A,
  steelDark:  0x4C5558,
  brass:      0xC59A4B,
  fabric:     0x5A3B32,       // sofa
  fabricDark: 0x3A2620,
  jute:       0x7A6646,
  paper:      0xD8CDB4,
  paperDim:   0x9E967F,
  redPencil:  0xB8352A,
  marigold:   0xD98A1E,
  marigoldDry: 0x7E5A22,
  clay:       0x8A4E2C,
  sheet:      0xC9C3B3,
  glass:      0x8FB8B4,
  tile:       0x2F4A4A,
  // Outside and emissives.
  night:      0x0A1622,
  nightGlow:  0x2C4B66,
  street:     0xF0C27A,
  headlight:  0xFFF2D0,
  diya:       0xFFB347,
  ledRed:     0xFF3B30,
  pilotBlue:  0x4FA3FF,
  dialAmber:  0xFFB25C,
  bulb:       0xFFE7B8,
  torchWarm:  0xFFE3B0,
  // Characters.
  hoodie:     0x2A3236,
  hoodieRim:  0x56636A,
  skin:       0x8A6047,
  skinDark:   0x5E3F2E,
  shirt:      0x7D8A99,
  trousers:   0x23262B,
  hair:       0x15110F,
  saree:      0xEDE7DA,
  sareeShade: 0xB9B2A3,
  greyHair:   0x9A9A96,
  hollow:     0x030304,
  hollowFace: 0xE6E0D2,
  phoneGlow:  0xBFE8FF,
  // UI.
  glassHi:    0xFFFFFF,
  amber:      0xE8A33D,
  green:      0x6FCF7F,
  greenDark:  0x1E5A2C,
  chipDone:   0x2E3A39,
  chipDamaged: 0x6A4A1A,
  chipFixed:  0x2F5A3A,
  chipLocked: 0x1A2122,
  bezel:      0x0B0E0F,
  hollowDeep: 0x0E3B38        // PLAY #8 NOW fill
};

// CSS strings for Phaser text styles.
export const CSS = {
  void: '#050708',
  cream: '#F3DDB1',
  text: '#E8E2D0',
  dim: '#8A8F8C',
  cold: '#4FD1C5',
  lamp: '#F2B35A'
};

// Self-hosted woff2 files are optional; these stacks are the fallback.
export const FONTS = {
  ui: 'Inter, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  memory: 'Lora, Georgia, "Times New Roman", serif',
  notes: 'Caveat, "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive'
};

export const BOOT = {
  fontsTimeoutMs: 1500     // never hold the game hostage to font loading
};

export const UI = {
  minTapPx: 44,            // CSS px after scaling (docs/02 section 2)
  minTextPx: 16,
  examineSec: 3,           // examine line duration (docs/04 section 2)
  toastSec: 2.5,           // docs/07 section 1
  subtitlePx: { S: 18, M: 22, L: 26 },
  subtitleWrap: 560,
  roundButton: 56,         // torch, sneak, phone (docs/07 section 1)
  roundButtonTouch: 72,    // mobile layout: bigger thumbs targets
  touchTextScale: 1.12     // mobile layout: text a little larger
};

// The phone panel's screen rectangle. Touch devices get a taller panel with
// bigger rows; both stay above the HUD buttons.
export const PHONE_LAYOUT = {
  desk:  { x0: 646, y0: 76, w: 300, h: 384, rowH: 24, btnH: 40 },
  touch: { x0: 596, y0: 14, w: 348, h: 430, rowH: 30, btnH: 44 }
};

// Greybox geometry (render only; gameplay numbers are in balance.js).
export const LAYOUT = {
  hotspotTopY: 280,        // hotspot hit area top (docs/04 section 3 notes)
  hotspotArtPad: 10,       // taller objects: the hit area reaches this far above the art
  doorTopY: 240,
  doorW: 70,
  hideW: 90,
  playerW: 36,
  playerH: 110,
  playerSneakH: 84,
  lightY: 70,              // torch centre above the floor line
  spriteH: 190             // character art height at 1x (docs/07 section 7)
};

// Visual pass (docs/10): presentation-only numbers. Gameplay is untouched.
export const ART = {
  seed: 0x5a71,            // room details are seeded so they never change
  torchBias: 22,           // px the torch centre leans in the facing direction
  torchWarmAlpha: 0.14,    // warm-white wash over the lit circle
  emissiveAlpha: 0.38,     // tiny lights above the darkness
  grainFps: 8,
  grainAlpha: 0.05,
  vignetteAlpha: 0.55,     // texture fallback (canvas renderer)
  vignetteRadius: 0.72,    // shader vignette (WebGL), normalised
  vignetteStrength: 0.6,
  hiddenRadius: 0.55,      // while hiding (docs/02 section 8)
  hiddenStrength: 0.75,
  dustCount: 22,
  dustSpeed: 9,            // px per second drift
  fanSpeed: 0.9,           // radians per second
  curtainSway: 0.018,      // radians
  sweepEvery: [7, 13],     // seconds between headlight sweeps
  sweepSec: 1.6,
  steamCount: 6,
  rainSpeed: 140,          // px per second
  glintPulseSec: 1.8,
  labelGap: 90,            // two labels closer than this: only the nearest
  labelFadeSec: 0.25,
  roomCaptionSec: 2,
  walkFps: 8,
  searchTurnSec: 0.8,
  glitchEvery: [2.5, 6],   // title letter glitch
  glitchMs: 90,
  handX: 20,               // phone glow in the player's hand, from the feet
  handY: 86,
  handXSneak: 22,
  handYSneak: 60
};

// Scales an art image to a display height, keeping its aspect.
export function fitHeight(img, h) {
  return img.setScale(h / Math.max(1, img.height));
}

export const ROOM_COLORS = {
  HALL: 0x1C2626,
  LIVING: 0x2A231E,
  KITCHEN: 0x1D2924,
  BEDROOM: 0x25212B
};

// Subtitle speaker colours (docs/05 section 1).
export const SPEAKER_CSS = {
  NANI: '#F3DDB1',
  VIKRAM: '#E58C79',
  HOLLOW: '#5FE0D3',
  SFX: '#9AA0A6',
  YOU: '#C9C9C9',
  MOM: '#E8E2D0',      // not in docs/05; neutral text colour
  POLICE: '#C9C9C9'
};

export const ROOM_IDS = ['HALL', 'LIVING', 'KITCHEN', 'BEDROOM'];

export const VM_STATUS = {
  LOCKED: 'locked',
  DAMAGED: 'damaged',
  FIXED: 'fixed',
  PLAYING: 'playing',
  MEMORY: 'memory',
  DONE: 'done'
};

export const ENDING_IDS = ['EAT_PROPERLY', 'STATIC', 'CAUGHT', 'LATER'];

export const SUBTITLE_SIZES = ['S', 'M', 'L'];

export const STORAGE_KEYS = {
  settings: 'unheard.settings',
  endings: 'unheard.endings'
};

export const DEFAULT_SETTINGS = {
  assist: false,
  reduceFlash: false,
  volMaster: 1,
  volVoice: 1,
  volSfx: 1,
  hotspotHints: true,
  vibration: false,
  subtitleSize: 'M',
  view3d: true             // first person 3D; false = 2D classic
};
