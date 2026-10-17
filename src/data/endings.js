// Final-act lines and the four ending scripts (docs/06). Each ending is a
// list of beats played in order by EndingScene:
//   { hold, visual, audio, voice, lines: [{who, hi}], text, phone, vm8, epilogue }
// visual: 'black' | 'room:<ID>' | 'still:<key>' | 'phone' | 'text'.
// Missing audio keys fall back silently; missing stills become colour fields.

// docs/06 section 1.2 (8 s, player locked, Vikram frozen). at: seconds.
export const TAPE_MOMENT = [
  { at: 0.0, who: 'SFX', hi: '[click of a tape recorder. Hiss.]' },
  { at: 1.0, who: 'VIKRAM', hi: 'Sign kar do, Maasi. Warna... accha nahi hoga.' },
  { at: 4.0, who: 'NANI', hi: 'Mere jeete ji nahi, Vikram.' },
  { at: 6.5, who: 'VIKRAM', hi: 'Locker khola na? Hmm?' }
];

export const CALL_TEXT = {
  whisper: '112',                                                       // YOU grey
  operator: 'Police are on their way. Stay where you are and stay quiet.', // op_1
  siren: '[a siren, far away, getting closer]'
};

export const EPILOGUE = {
  '5': 'Vikram Mehra was arrested that night. The lighter, the deed, the note, the slip and the tape. The case closed within a week.',
  '3-4': 'Vikram Mehra was arrested that night. It took a few months, but it held.',
  '0-2': 'Vikram Mehra was arrested that night. The tape was all there was. It was enough.',
  staticExtra: 'The phone never worked properly again.'
};

export const END_CARD = {
  found: (n) => `Endings found: ${n} of 4`,
  thanks: 'Thank you for listening.',
  playAgain: 'PLAY AGAIN',
  title: 'TITLE'
};

// --- Ending 1: EAT PROPERLY (good), about 95 s -------------------------------

const EAT_PROPERLY = [
  { hold: 6, visual: 'black', audio: ['sfx_step_vik_01'], voice: 'vik_caught',
    lines: [{ who: 'VIKRAM', hi: 'Bas ek phone hi toh hai, beta.' }] },
  { hold: 8, visual: 'black', audio: ['sfx_flicker'],
    lines: [{ who: 'SFX', hi: '[every light in the flat dies, one by one]' },
            { who: 'VIKRAM', hi: 'Yeh kya...' }] },
  { hold: 8, visual: 'still:end_blue_flame', audio: ['sfx_gas_whump'],
    lines: [{ who: 'SFX', hi: '[a soft whump. The gas burners light by themselves.]' },
            { who: 'VIKRAM', hi: 'Maasi...?' },
            { who: 'VIKRAM', hi: 'Maasi, main... main sirf...' }] },
  { hold: 8, visual: 'black', audio: ['sfx_door_slam', 'sfx_fall_stairs'],
    lines: [{ who: 'SFX', hi: '[a long fall on the stairs. Then silence.]' }] },
  { hold: 8, visual: 'room:HALL', audio: ['sfx_pounding', 'sfx_siren_loop'], voice: 'police_1',
    lines: [{ who: 'POLICE', hi: 'Police! Darwaza kholiye!' }] },
  { hold: 8, visual: 'text', text: '2:40 AM', voice: 'police_2',
    lines: [{ who: 'POLICE', hi: 'Aap theek hain?' },
            { who: 'MOM', hi: 'Beta! Beta, tu theek hai?' },
            { who: 'MOM', hi: 'Tune kuch khaya?' },
            { who: 'MOM', hi: 'Chal.' }] },
  { hold: 14, visual: 'phone', phone: 'Voicemail 8, 7:58 PM, Nani', audio: ['sfx_phone_buzz'],
    vm8: { mode: 'clear', startAt: 3 } },
  { hold: 18, visual: 'still:end_table',
    lines: [{ who: 'MOM', hi: 'Maine toh ek hi plate nikaali thi...' }] },
  { hold: 6, visual: 'text', text: 'You ate. That was all she wanted.' },
  { hold: 8, visual: 'text', epilogue: true }
];

// --- Ending 2: STATIC (bittersweet), about 70 s ------------------------------

const STATIC = [
  { hold: 6, visual: 'black', audio: ['sfx_step_vik_01'], voice: 'vik_c1',
    lines: [{ who: 'VIKRAM', hi: 'Phone do, beta.' }] },
  { hold: 8, visual: 'room:HALL', audio: ['sfx_flicker'],
    lines: [{ who: 'HOLLOW', hi: 'Later, beta... later, beta.' }] },
  { hold: 6, visual: 'black', audio: ['sfx_door_slam'], voice: 'police_1',
    lines: [{ who: 'POLICE', hi: 'Police! Darwaza kholiye!' },
            { who: 'SFX', hi: '[a crack of glass]' },
            { who: 'VIKRAM', hi: 'Yeh sab galat samajh rahe hain...' }] },
  { hold: 8, visual: 'text', text: '2:40 AM',
    lines: [{ who: 'MOM', hi: 'Beta! Beta, tu theek hai?' },
            { who: 'MOM', hi: 'Tune kuch khaya?' }] },
  { hold: 16, visual: 'phone', phone: 'Voicemail 8, 7:58 PM, Nani', audio: ['sfx_tv_static'],
    vm8: { mode: 'broken', startAt: 2,
      lines: [{ t: 0.0, who: 'NANI', hi: 'Beta... kuch nahi, bas ya—' },
              { t: 3.5, who: 'NANI', hi: '...theek se kha—' },
              { t: 6.5, who: 'NANI', hi: '...bas it—' }],
      blanks: 'Beta, ____ ____, bas ____ ____.' } },
  { hold: 12, visual: 'still:end_table',
    texts: ['You will never know exactly how she said it.', 'You only know what she meant.'] },
  { hold: 8, visual: 'text', epilogue: true, extra: true }
];

// --- Ending 3: CAUGHT (thriller bad), about 30 s -----------------------------

const CAUGHT_TAIL = [
  { hold: 5, visual: 'black', audio: ['sfx_door_close'],
    lines: [{ who: 'SFX', hi: '[footsteps leaving. A key. A door. A TV murmuring somewhere.]' }] },
  { hold: 6, visual: 'text', text: 'Some things are only heard once.' }
];

const CAUGHT = [
  { hold: 5, visual: 'black', voice: 'vik_caught',
    lines: [{ who: 'VIKRAM', hi: 'Bas ek phone hi toh hai.' }],
    ifTape: [{ who: 'VIKRAM', hi: 'Aur tape bhi.' }] },
  { hold: 8, visual: 'phone', phone: '', dying: true },
  ...CAUGHT_TAIL
];

const CAUGHT_DEAD_AIR = [
  { hold: 6, visual: 'black', audio: ['sfx_key_lock'],
    lines: [{ who: 'SFX', hi: '[a key turns in a lock]' },
            { who: 'VIKRAM', hi: 'Beta? Andhera kyun hai yahan?' }] },
  ...CAUGHT_TAIL
];

// --- Ending 4: LATER (horror bad), about 45 s --------------------------------

const LATER_TAIL = [
  { hold: 6, visual: 'black', voice: 'hol_8',
    lines: [{ who: 'HOLLOW', hi: 'Beta, beta... khana kha le.' }] },
  { hold: 3, visual: 'black', lines: [{ who: 'YOU', hi: 'Coming.' }] },
  { hold: 6, visual: 'phone', audio: ['sfx_phone_buzz'],
    phone: "Mummy: Reached Mausi's. Won't be back till tomorrow. Eat something." },
  { hold: 8, visual: 'black', audio: ['sfx_step_vik_02'],
    lines: [{ who: 'SFX', hi: '[footsteps on the stairs. Slow. They stop outside the door.]' }] },
  { hold: 6, visual: 'text', text: 'Nani never asked you to stay. Something else did.' }
];

const YOU_LATER = { hold: 8, visual: 'phone', phone: '#8', voice: 'you_later',
  lines: [{ who: 'YOU', hi: 'Nani, later. I am studying.' },
          { who: 'YOU', hi: 'later... later... later' }] };

const LATER = [
  YOU_LATER,
  { hold: 8, visual: 'still:end_hollow', audio: ['sfx_tv_static'],
    lines: [{ who: 'SFX', hi: '[the static thickens. The torch dies.]' }] },
  ...LATER_TAIL
];

const LATER_DOOM = [
  YOU_LATER,
  { hold: 8, visual: 'still:end_hollow', audio: ['sfx_tv_static'],
    lines: [{ who: 'SFX', hi: '[the static thickens. The torch dies.]' }] },
  ...LATER_TAIL
];

export const ENDINGS = {
  EAT_PROPERLY: { number: 1, title: 'EAT PROPERLY', beats: EAT_PROPERLY },
  STATIC: { number: 2, title: 'STATIC', beats: STATIC },
  CAUGHT: { number: 3, title: 'CAUGHT', beats: CAUGHT, byCause: { dead_air: CAUGHT_DEAD_AIR } },
  LATER: { number: 4, title: 'LATER', beats: LATER, byCause: { presence_doom: LATER_DOOM } }
};

export function endingBeats(id, cause) {
  const e = ENDINGS[id];
  return (e.byCause && e.byCause[cause]) || e.beats;
}
