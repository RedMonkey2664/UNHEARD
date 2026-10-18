// Asset manifest (docs/07 section 7 and 8). Every key has a path and, for
// audio, a fallback duration so the game runs in silence on timers.
// Missing files are fine: BootScene only requests files that exist.

import { VOICEMAILS } from './voicemails.js';

const IMG = 'assets/img/';
const AUD = 'assets/audio/';

function img(key) {
  return { key, url: IMG + key + '.png' };
}

// ogg first, mp3 for Safari, then the code-generated wav (scripts/
// make-audio.mjs) when no recording exists. Only files that exist are loaded.
// duration in seconds; 0 means a loop with no end.
function audio(folder, key, duration) {
  const base = AUD + folder + '/' + key;
  return { key, urls: [base + '.ogg', base + '.mp3', base + '.wav'], duration };
}

function range(prefix, from, to) {
  const keys = [];
  for (let i = from; i <= to; i++) keys.push(prefix + i);
  return keys;
}

function pad2(prefix, from, to) {
  const keys = [];
  for (let i = from; i <= to; i++) keys.push(prefix + String(i).padStart(2, '0'));
  return keys;
}

const DUR = { sfx: 1, bark: 2.5, whisper: 3, voiceShort: 3 };

export const IMAGES = [
  ...['bg_hall', 'bg_living', 'bg_kitchen', 'bg_bedroom'],
  ...['spr_player', 'spr_vikram', 'spr_nani_far', 'spr_nani_cup', 'spr_hollow',
      'spr_hollow_face'],
  ...['ov_window_open_living', 'ov_window_open_kitchen', 'ov_window_open_bedroom',
      'ov_tv_static', 'ov_radio_on'],
  ...['it_glasses', 'it_earphones', 'it_card_a', 'it_card_b', 'it_card_c',
      'ev_lighter', 'ev_deed', 'ev_page', 'ev_note', 'ev_slip', 'ev_tape'],
  ...['ui_phone_frame', 'ui_battery', 'ui_torch', 'ui_sneak'],
  ...range('mem_', 1, 7),
  ...['end_corner', 'end_blue_flame', 'end_table', 'end_hollow', 'end_phone_dead']
].map(img);

const vmVoice = Object.values(VOICEMAILS)
  .map((vm) => audio('voice', vm.audio, vm.durationSec));

const vmDamaged = range('vm', 1, 6)
  .map((k) => audio('voice', k + '_damaged', VOICEMAILS[Number(k.slice(2))].durationSec));

export const AUDIO = [
  ...vmVoice,
  ...vmDamaged,
  audio('voice', 'tape_clip', 8),
  audio('voice', 'you_later', 8),
  audio('voice', 'op_1', 4),
  ...['mom_1', 'mom_2', 'mom_3', 'police_1', 'police_2']
    .map((k) => audio('voice', k, DUR.voiceShort)),
  ...['vik_entering', ...range('vik_p', 1, 5), ...range('vik_i', 1, 3),
      ...range('vik_s', 1, 3), ...range('vik_c', 1, 3), 'vik_caught',
      ...range('vik_h', 1, 4), ...range('vik_a', 1, 2)]
    .map((k) => audio('voice', k, DUR.bark)),
  ...range('hol_', 1, 8).map((k) => audio('voice', k, DUR.whisper)),
  audio('voice', 'nani_chai', 2),
  audio('voice', 'nani_touch', 2),

  ...pad2('sfx_step_vik_', 1, 4).map((k) => audio('sfx', k, 0.3)),
  ...pad2('sfx_step_player_', 1, 4).map((k) => audio('sfx', k, 0.3)),
  audio('sfx', 'sfx_key_lock', 3),
  ...['sfx_door_open', 'sfx_door_close', 'sfx_door_slam', 'sfx_pickup',
      'sfx_interact', 'sfx_wrong', 'sfx_fix_ok', 'sfx_phone_buzz', 'sfx_phone_tap',
      'sfx_battery_low', 'sfx_window_open', 'sfx_breath_hold', 'sfx_flicker',
      'sfx_lamp_tick', 'sfx_stinger_1', 'sfx_stinger_2', 'sfx_stinger_3',
      'sfx_gas_whump', 'sfx_pounding', 'sfx_tape_click']
    .map((k) => audio('sfx', k, DUR.sfx)),
  audio('sfx', 'sfx_radio_static', 0),
  audio('sfx', 'sfx_radio_tune', 3),
  audio('sfx', 'sfx_cooker_whistle', 1.5),
  audio('sfx', 'sfx_rain_loop', 0),
  audio('sfx', 'sfx_heartbeat_loop', 0),
  audio('sfx', 'sfx_tv_static', 0),
  audio('sfx', 'sfx_fall_stairs', 4),
  audio('sfx', 'sfx_siren_loop', 0),

  audio('amb', 'amb_flat_loop', 0),
  audio('amb', 'amb_cold_loop', 0),
  audio('music', 'music_memory_loop', 0),
  audio('music', 'music_dread_loop', 0)
];

// Loaded with the FontFace API, and only if the file exists (no 404s).
export const FONT_FILES = [
  { family: 'Inter', url: 'assets/fonts/inter-400.woff2', weight: '400', style: 'normal' },
  { family: 'Inter', url: 'assets/fonts/inter-600.woff2', weight: '600', style: 'normal' },
  { family: 'Lora', url: 'assets/fonts/lora-italic.woff2', weight: '400', style: 'italic' },
  { family: 'Caveat', url: 'assets/fonts/caveat-400.woff2', weight: '400', style: 'normal' }
];

export function fallbackDuration(key) {
  const a = AUDIO.find((x) => x.key === key);
  return a ? a.duration : DUR.sfx;
}
