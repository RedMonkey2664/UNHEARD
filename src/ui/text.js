// Shared Phaser text style. Resolution 2 keeps text crisp when FIT scales the
// 960x540 canvas up on large screens.

import { CSS, FONTS, UI } from '../config/constants.js';

export function textStyle(opts = {}) {
  const size = Math.max(UI.minTextPx, opts.size || 18);
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
