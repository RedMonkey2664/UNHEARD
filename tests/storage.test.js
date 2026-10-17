import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../src/config/constants.js';
import { addEnding, loadEndings, loadSettings, saveSettings } from '../src/utils/storage.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    keys: () => [...data.keys()]
  };
}

const blocked = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); }
};

describe('settings storage', () => {
  it('round-trips every title-screen setting', () => {
    const st = memoryStorage();
    const s = { ...DEFAULT_SETTINGS, assist: true, volVoice: 0.4, subtitleSize: 'S',
      hotspotHints: false, vibration: true };
    expect(saveSettings(s, st)).toBe(true);
    expect(loadSettings(st)).toEqual(s);
  });

  it('only writes the two allowed keys', () => {
    const st = memoryStorage();
    saveSettings(DEFAULT_SETTINGS, st);
    addEnding('LATER', st);
    expect(st.keys().sort()).toEqual([STORAGE_KEYS.endings, STORAGE_KEYS.settings].sort());
  });

  it('falls back to defaults when storage is blocked or missing', () => {
    expect(loadSettings(blocked)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(DEFAULT_SETTINGS, blocked)).toBe(false);
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('ignores bad JSON and bad values', () => {
    const st = memoryStorage();
    st.setItem(STORAGE_KEYS.settings, '{not json');
    expect(loadSettings(st)).toEqual(DEFAULT_SETTINGS);
    st.setItem(STORAGE_KEYS.settings, JSON.stringify({ volMaster: 7, assist: 'yes',
      subtitleSize: 'XL' }));
    expect(loadSettings(st)).toEqual({ ...DEFAULT_SETTINGS, volMaster: 1 });
  });
});

describe('endings storage', () => {
  it('adds each ending once and keeps only known ids', () => {
    const st = memoryStorage();
    addEnding('CAUGHT', st);
    addEnding('CAUGHT', st);
    addEnding('NOPE', st);
    expect(loadEndings(st)).toEqual(['CAUGHT']);
  });

  it('survives blocked storage', () => {
    expect(loadEndings(blocked)).toEqual([]);
    expect(addEnding('LATER', blocked)).toEqual(['LATER']);
  });
});
