// Final-act lines and the four ending scripts (docs/06). Each ending is a
// list of beats played in order by EndingScene:
//   { hold, visual, audio, voice, lines: [{who, text}], text, phone, vm8, epilogue }
// visual: 'black' | 'room:<ID>' | 'still:<key>' | 'phone' | 'text'.
// Missing audio keys fall back silently; missing stills become colour fields.

// docs/06 section 1.2 (8 s, player locked, Vikram frozen). at: seconds.
export const TAPE_MOMENT = [
  { at: 0.0, who: 'SFX', text: '[click of a tape recorder. Hiss.]' },
  { at: 1.0, who: 'VIKRAM', text: "Sign it, Auntie. Or... it won't end well." },
  { at: 4.0, who: 'NANI', text: 'Not while I am alive, Vikram.' },
  { at: 6.5, who: 'VIKRAM', text: "You opened the locker, didn't you? Hmm?" }
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
    lines: [{ who: 'VIKRAM', text: "It's only a phone, kiddo." }] },
  { hold: 8, visual: 'black', audio: ['sfx_flicker'],
    lines: [{ who: 'SFX', text: '[every light in the flat dies, one by one]' },
            { who: 'VIKRAM', text: 'What is this...' }] },
  { hold: 8, visual: 'still:end_blue_flame', audio: ['sfx_gas_whump'],
    lines: [{ who: 'SFX', text: '[a soft whump. The gas burners light by themselves.]' },
            { who: 'VIKRAM', text: 'Auntie...?' },
            { who: 'VIKRAM', text: 'Auntie, I... I only...' }] },
  { hold: 8, visual: 'black', audio: ['sfx_door_slam', 'sfx_fall_stairs'],
    lines: [{ who: 'SFX', text: '[a long fall on the stairs. Then silence.]' }] },
  { hold: 8, visual: 'room:HALL', audio: ['sfx_pounding', 'sfx_siren_loop'], voice: 'police_1',
    lines: [{ who: 'POLICE', text: 'Police! Open the door!' }] },
  { hold: 8, visual: 'text', text: '2:40 AM', voice: 'police_2',
    lines: [{ who: 'POLICE', text: 'Are you all right?' },
            { who: 'MOM', text: 'Sweetheart! Sweetheart, are you okay?' },
            { who: 'MOM', text: 'Have you eaten anything?' },
            { who: 'MOM', text: 'Come.' }] },
  { hold: 14, visual: 'phone', phone: 'Voicemail 8, 7:58 PM, Nani', audio: ['sfx_phone_buzz'],
    vm8: { mode: 'clear', startAt: 3 } },
  { hold: 18, visual: 'still:end_table',
    lines: [{ who: 'MOM', text: 'I only set out one plate...' }] },
  { hold: 6, visual: 'text', text: 'You ate. That was all she wanted.' },
  { hold: 8, visual: 'text', epilogue: true }
];

// --- Ending 2: STATIC (bittersweet), about 70 s ------------------------------

const STATIC = [
  { hold: 6, visual: 'black', audio: ['sfx_step_vik_01'], voice: 'vik_c1',
    lines: [{ who: 'VIKRAM', text: 'Give me the phone, kiddo.' }] },
  { hold: 8, visual: 'room:HALL', audio: ['sfx_flicker'],
    lines: [{ who: 'HOLLOW', text: 'Later, dear... later, dear.' }] },
  { hold: 6, visual: 'black', audio: ['sfx_door_slam'], voice: 'police_1',
    lines: [{ who: 'POLICE', text: 'Police! Open the door!' },
            { who: 'SFX', text: '[a crack of glass]' },
            { who: 'VIKRAM', text: 'This is all a misunderstanding...' }] },
  { hold: 8, visual: 'text', text: '2:40 AM',
    lines: [{ who: 'MOM', text: 'Sweetheart! Sweetheart, are you okay?' },
            { who: 'MOM', text: 'Have you eaten anything?' }] },
  { hold: 16, visual: 'phone', phone: 'Voicemail 8, 7:58 PM, Nani', audio: ['sfx_tv_static'],
    vm8: { mode: 'broken', startAt: 2,
      lines: [{ t: 0.0, who: 'NANI', text: "Dear... it's nothing, I was just thin—" },
              { t: 3.5, who: 'NANI', text: '...eat prop—' },
              { t: 6.5, who: 'NANI', text: '...that is a—' }],
      blanks: 'Dear, ____ ____, okay? That is ____ ____.' } },
  { hold: 12, visual: 'still:end_table',
    texts: ['You will never know exactly how she said it.', 'You only know what she meant.'] },
  { hold: 8, visual: 'text', epilogue: true, extra: true }
];

// --- Ending 3: CAUGHT (thriller bad), about 30 s -----------------------------

const CAUGHT_TAIL = [
  { hold: 5, visual: 'black', audio: ['sfx_door_close'],
    lines: [{ who: 'SFX', text: '[footsteps leaving. A key. A door. A TV murmuring somewhere.]' }] },
  { hold: 6, visual: 'text', text: 'Some things are only heard once.' }
];

const CAUGHT = [
  { hold: 5, visual: 'black', voice: 'vik_caught',
    lines: [{ who: 'VIKRAM', text: "It's only a phone." }],
    ifTape: [{ who: 'VIKRAM', text: 'And the tape.' }] },
  { hold: 8, visual: 'phone', phone: '', dying: true },
  ...CAUGHT_TAIL
];

const CAUGHT_DEAD_AIR = [
  { hold: 6, visual: 'black', audio: ['sfx_key_lock'],
    lines: [{ who: 'SFX', text: '[a key turns in a lock]' },
            { who: 'VIKRAM', text: 'Kiddo? Why is it so dark in here?' }] },
  ...CAUGHT_TAIL
];

// --- Ending 4: LATER (horror bad), about 45 s --------------------------------

const LATER_TAIL = [
  { hold: 6, visual: 'black', voice: 'hol_8',
    lines: [{ who: 'HOLLOW', text: 'Dear, dear... come and eat.' }] },
  { hold: 3, visual: 'black', lines: [{ who: 'YOU', text: 'Coming.' }] },
  { hold: 6, visual: 'phone', audio: ['sfx_phone_buzz'],
    phone: "Mom: Reached your aunt's. Won't be back till tomorrow. Eat something." },
  { hold: 8, visual: 'black', audio: ['sfx_step_vik_02'],
    lines: [{ who: 'SFX', text: '[footsteps on the stairs. Slow. They stop outside the door.]' }] },
  { hold: 6, visual: 'text', text: 'Nani never asked you to stay. Something else did.' }
];

const YOU_LATER = { hold: 8, visual: 'phone', phone: '#8', voice: 'you_later',
  lines: [{ who: 'YOU', text: 'Nani, later. I am studying.' },
          { who: 'YOU', text: 'later... later... later' }] };

const LATER = [
  YOU_LATER,
  { hold: 8, visual: 'still:end_hollow', audio: ['sfx_tv_static'],
    lines: [{ who: 'SFX', text: '[the static thickens. The torch dies.]' }] },
  ...LATER_TAIL
];

const LATER_DOOM = [
  YOU_LATER,
  { hold: 8, visual: 'still:end_hollow', audio: ['sfx_tv_static'],
    lines: [{ who: 'SFX', text: '[the static thickens. The torch dies.]' }] },
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
