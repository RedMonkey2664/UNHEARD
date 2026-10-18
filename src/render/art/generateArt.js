// Builds every code-drawn texture once at boot (docs/10 section 8). A key
// that already loaded as a real PNG is left alone, so art can drop in later.

import { generateCharacters } from './characterArt.js';
import { generateFx } from './fxArt.js';
import { generateRooms } from './roomArt.js';
import { generateUi } from './uiArt.js';

// Returns the keys that were generated (not loaded from a file).
export function generateArt(scene) {
  const made = new Set([...generateRooms(scene), ...generateCharacters(scene)]);
  generateFx(scene);
  generateUi(scene);
  return made;
}
