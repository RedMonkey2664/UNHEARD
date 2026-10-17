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
  text:    0xE8E2D0
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
  minTextPx: 16
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
  subtitleSize: 'M'
};
