// localStorage access for the two allowed keys only (docs/02 section 12).
// Every access is wrapped: the game must work with storage blocked.

import { DEFAULT_SETTINGS, ENDING_IDS, STORAGE_KEYS, SUBTITLE_SIZES }
  from '../config/constants.js';
import { clamp } from './math.js';

// Reading globalThis.localStorage itself can throw (Safari private mode,
// blocked cookies), so the lookup is inside try too.
function defaultStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function readJson(key, storage) {
  try {
    const raw = storage ? storage.getItem(key) : null;
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key, value, storage) {
  try {
    if (!storage) return false;
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// Unknown or malformed fields fall back to defaults, so an old or hand-edited
// save can never break the title screen.
export function sanitizeSettings(raw) {
  const s = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return s;
  for (const key of ['assist', 'reduceFlash', 'hotspotHints', 'vibration']) {
    if (typeof raw[key] === 'boolean') s[key] = raw[key];
  }
  for (const key of ['volMaster', 'volVoice', 'volSfx']) {
    if (typeof raw[key] === 'number' && Number.isFinite(raw[key])) {
      s[key] = clamp(raw[key], 0, 1);
    }
  }
  if (SUBTITLE_SIZES.includes(raw.subtitleSize)) s.subtitleSize = raw.subtitleSize;
  return s;
}

// True once the player has saved settings (first run on a phone gets mobile defaults).
export function hasSavedSettings(storage = defaultStorage()) {
  return readJson(STORAGE_KEYS.settings, storage) !== null;
}

export function loadSettings(storage = defaultStorage()) {
  return sanitizeSettings(readJson(STORAGE_KEYS.settings, storage));
}

export function saveSettings(settings, storage = defaultStorage()) {
  return writeJson(STORAGE_KEYS.settings, sanitizeSettings(settings), storage);
}

export function loadEndings(storage = defaultStorage()) {
  const raw = readJson(STORAGE_KEYS.endings, storage);
  if (!Array.isArray(raw)) return [];
  return ENDING_IDS.filter((id) => raw.includes(id));
}

export function addEnding(id, storage = defaultStorage()) {
  const found = loadEndings(storage);
  if (ENDING_IDS.includes(id) && !found.includes(id)) found.push(id);
  writeJson(STORAGE_KEYS.endings, found, storage);
  return found;
}
