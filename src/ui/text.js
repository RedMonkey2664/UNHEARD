// Shared Phaser text style. Resolution 2 keeps text crisp when FIT scales the
// 960x540 canvas up on large screens.

import { CSS, FONTS, UI } from '../config/constants.js';
import { DEVICE } from '../utils/device.js';

const SCALE = DEVICE.touch ? UI.touchTextScale : 1;

export function textStyle(opts = {}) {
  const size = Math.round(Math.max(UI.minTextPx, opts.size || 18) * SCALE);
  return {
    fontFamily: opts.font || FONTS.ui,
    fontSize: size + 'px',
    fontStyle: opts.style || 'normal',
    color: opts.color || CSS.text,
    align: opts.align || 'center',
    resolution: 2,
    ...(opts.wrap ? { wordWrap: { width: opts.wrap, useAdvancedWrap: true } } : {}),
    ...(opts.letterSpacing ? { letterSpacing: opts.letterSpacing } : {})
  };
}
