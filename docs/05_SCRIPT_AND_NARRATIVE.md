# 05 - Script and narrative

Everything the player reads or hears. Voice is Hinglish. Each spoken line has
"hi" (what is spoken and shown in subtitles) and "en" (English meaning, for
whoever records the voices and for a future translation toggle).

Voice casting guide (for the person recording):
  Nani    warm, a little breathy, never rushed, apologetic. Older woman.
  Vikram  soft, friendly, patient. Turns cold only in the hunt.
  Hollow  the same voice as Nani but wrong: slightly too slow, odd stress,
          says "beta" too many times, a faint second voice underneath.

## 1. Subtitle speakers and colours

  NANI    #F3DDB1  (warm cream)
  VIKRAM  #E58C79  (pale coral)
  HOLLOW  #5FE0D3  (teal, small jitter animation)
  SFX     #9AA0A6  (grey, italic, in square brackets)
  YOU     #C9C9C9  (memory scene inner voice)

## 2. voicemails.js (copy as is)

Timing: "t" is seconds from the start of the voicemail audio.
Cost and duration are repeated here for convenience; balance.js wins.

```js
export const VOICEMAILS = {
  1: {
    id: 1, title: 'Exam Week', stamp: '██:██', durationSec: 14, cost: 6,
    damage: 'static', previewLabel: '[crackling static over a faint voice]',
    fix: { type: 'RADIO' },
    hint1: 'Static. Nani\'s radio is in the living room.',
    hint2: 'Her calendar has a number circled twice.',
    audio: 'vm1',
    lines: [
      { t: 0.0,  who: 'SFX',  hi: '[a steel cup set down on a table]', en: '' },
      { t: 1.0,  who: 'NANI', hi: 'Hello? Main hoon, Nani.', en: "Hello? It's me, Nani." },
      { t: 3.5,  who: 'NANI', hi: 'Padhai kaisi chal rahi hai?', en: 'How is studying going?' },
      { t: 6.0,  who: 'NANI', hi: 'Maine darwaze ke bahar chai rakhi thi. Thandi ho gayi hogi.', en: 'I left chai outside your door. It must have gone cold.' },
      { t: 10.0, who: 'NANI', hi: 'Chalo, tum busy ho. Main baad mein phone karungi.', en: "Never mind, you're busy. I'll call later." },
      { t: 12.5, who: 'NANI', hi: 'Beta, kuch kha lena.', en: 'Beta, eat something.' }
    ],
    memory: [
      'Exam week. I had a door and a deadline.',
      'She stood outside for ten minutes with a steel cup of chai. I could see her shadow under the door.',
      "I said: 'Nani, later. I'm studying.'",
      'She said okay. She always said okay.'
    ],
    beats: [ { when: 'afterFix', id: 'RADIO_TURNS_ON' } ]
  },

  2: {
    id: 2, title: 'Birthday', stamp: '██:██', durationSec: 12, cost: 6,
    damage: 'skipping', previewLabel: '[a voice, skipping and stuttering]',
    fix: { type: 'CARD' },
    hint1: 'The audio skips. Something is torn in the bedroom.',
    hint2: 'Three scraps: the desk, the bed, the dresser.',
    audio: 'vm2',
    lines: [
      { t: 0.0,  who: 'NANI', hi: 'Happy birthday to you... happy birthday to you...', en: 'Happy birthday to you... (off-key singing)' },
      { t: 5.0,  who: 'SFX',  hi: '[a beep. The call cuts out.]', en: '' },
      { t: 6.0,  who: 'NANI', hi: 'Arre, phone kat gaya?', en: 'Oh, did the call drop?' },
      { t: 8.0,  who: 'NANI', hi: 'Chalo. Beta, card ke andar kuch rakha hai tumhare liye.', en: 'Anyway. Beta, I put something inside your card.' },
      { t: 10.5, who: 'NANI', hi: 'Sambhal ke rakhna. Kisi ko mat dikhana.', en: 'Keep it safe. Do not show anyone.' }
    ],
    memory: [
      'My birthday. Friends, loud music, a cake I did not even like.',
      'She started singing. Off-key, loud, completely unashamed.',
      'My friends were laughing. So I cut the call.',
      'I found out afterwards she had practised for a week.'
    ],
    beats: [ { when: 'afterFix', id: 'HANDWRITING_LATER' } ]
  },

  3: {
    id: 3, title: 'Monsoon', stamp: '██:██', durationSec: 15, cost: 6,
    damage: 'rain', previewLabel: '[heavy rain noise drowning a voice]',
    fix: { type: 'WINDOWS' },
    hint1: 'Rain noise. The windows are open.',
    hint2: 'Her umbrella has a tag tied to it.',
    audio: 'vm3',
    lines: [
      { t: 0.0,  who: 'SFX',    hi: '[heavy rain, traffic, a metro announcement far away]', en: '' },
      { t: 2.0,  who: 'NANI',   hi: 'Beta, barish bahut tez hai. Chhatri tumhe de di, theek hi hua.', en: 'Beta, the rain is heavy. Good that I gave you the umbrella.' },
      { t: 6.0,  who: 'NANI',   hi: 'Ghar pahunch ke phone karungi.', en: "I'll call when I reach home." },
      { t: 8.5,  who: 'VIKRAM', hi: 'Maasi, bas ek sign. Ek sign kar do, phir kuch nahi maangunga.', en: "Maasi, just one signature. Sign once and I'll never ask again." },
      { t: 12.0, who: 'NANI',   hi: 'Nahi, Vikram. Kabhi nahi.', en: 'No, Vikram. Never.' },
      { t: 14.0, who: 'SFX',    hi: '[rain]', en: '' }
    ],
    memory: [
      'Monsoon. She came to the metro station just to hand me an umbrella.',
      "I said she would get wet. She said, 'Main toh purani hoon. Paani se kuch nahi hota.'",
      'She walked home in the rain. She caught a fever. She never told me.',
      'There was someone with her. I never asked who.'
    ],
    beats: [ { when: 'afterFix', id: 'WINDOW_REOPENS' } ]
  },

  4: {
    id: 4, title: 'Dal', stamp: '██:██', durationSec: 14, cost: 6,
    damage: 'whistle', previewLabel: '[a shrill whistle over a voice]',
    fix: { type: 'COOKER' },
    hint1: 'A whistle. Think kitchen.',
    hint2: 'Her notebook says how many.',
    audio: 'vm4',
    lines: [
      { t: 0.0,  who: 'SFX',  hi: '[a pressure cooker hissing, a radio playing low]', en: '' },
      { t: 1.5,  who: 'NANI', hi: 'Dal mein namak? Andaaz se, beta.', en: 'Salt in the dal? By feel, beta.' },
      { t: 4.5,  who: 'NANI', hi: 'Naap ke daalne se swaad nahi aata.', en: 'Measuring never gives the taste.' },
      { t: 7.0,  who: 'NANI', hi: 'Chaar siti. Chaar siti aur gas band.', en: 'Four whistles. Four whistles, then gas off.' },
      { t: 10.0, who: 'NANI', hi: 'Aur copy mein sab likha hai. Kabhi bhool jao toh dekh lena. Poora hisaab wahin hai.', en: 'And everything is in the notebook. If you forget, look. The whole account is there.' }
    ],
    memory: [
      'Sundays in her kitchen. Steel plates, steam, the radio low.',
      "I asked for the recipe. She said: 'Andaaz se.'",
      'I wrote nothing down. She wrote everything.',
      'The cooker whistled four times. That is the only measurement I remember.'
    ],
    beats: [ { when: 'afterFix', id: 'PHANTOM_WHISTLES' } ],
    onDone: 'TEMPTATION'
  },

  5: {
    id: 5, title: 'The Argument', stamp: '██:██', durationSec: 20, cost: 12,
    damage: 'muffled', previewLabel: '[a voice as if through a pillow]',
    fix: { type: 'NOTE' },
    hint1: 'Too muffled. She wrote you a note.',
    hint2: "You'll need her glasses to read it.",
    audio: 'vm5',
    lines: [
      { t: 0.0,  who: 'SFX',  hi: '[a quiet room. Her breathing]', en: '' },
      { t: 2.0,  who: 'NANI', hi: 'Sorry... main bahut bolti hoon na.', en: "Sorry... I talk too much, don't I." },
      { t: 6.0,  who: 'NANI', hi: 'Tumhari baat sahi thi. Main purane zamane ki hoon.', en: 'You were right. I belong to another era.' },
      { t: 11.0, who: 'NANI', hi: 'Ek baat likh ke rakhi hai. Kehni nahi aati mujhse.', en: "I've written something down. I can't say it aloud." },
      { t: 15.0, who: 'NANI', hi: 'Padh lena... jab time ho.', en: 'Read it... when you have time.' },
      { t: 18.0, who: 'NANI', hi: 'Beta, bura mat maanna.', en: "Beta, don't take it to heart." }
    ],
    memory: [
      'The argument. It was about nothing: a phone, a visit, a tone.',
      "I said: 'Nani, you never stop talking.'",
      'She laughed it off. Her laugh went thin.',
      'That night she called to apologise. To me.'
    ],
    beats: [ { when: 'afterFix', id: 'REFLECTION_SCARE' } ]
  },

  6: {
    id: 6, title: 'Hospital', stamp: '██:██', durationSec: 12, cost: 6,
    damage: 'quiet', previewLabel: '[almost silence. A monitor beeping]',
    fix: { type: 'EARPHONES' },
    hint1: 'Too quiet. What did she keep in the kitchen drawer?',
    hint2: 'Earphones. Use them from the phone.',
    audio: 'vm6',
    lines: [
      { t: 0.0,  who: 'SFX',  hi: '[a hospital monitor beeping slowly]', en: '' },
      { t: 1.0,  who: 'NANI', hi: 'Beta... Mummy ko mat batana ki maine phone kiya.', en: "Beta... don't tell Mummy I called." },
      { t: 5.0,  who: 'NANI', hi: 'Vikram aaya tha. Papers lekar. Theek se baat nahi kar raha tha.', en: "Vikram came. With papers. He wasn't speaking properly." },
      { t: 9.5,  who: 'NANI', hi: 'Main theek hoon. Tum padhai karo.', en: "I'm fine. You focus on studying." }
    ],
    memory: [
      'The hospital. The week before. Her voice was thinner than I remembered.',
      "I said, 'I'll come on Sunday.'",
      'Sunday became the week after. The week after became too late.',
      'She asked me to keep a secret. I kept it. I am good at keeping the wrong things.'
    ],
    beats: [ { when: 'afterFix', id: 'WARM_WIRE' } ],
    onDone: 'MOM_TEXT_2'
  },

  7: {
    id: 7, title: 'The Silent One', stamp: '11:42 PM', durationSec: 11, cost: 6,
    damage: null, previewLabel: '',
    fix: { type: 'NONE' },
    hint1: '', hint2: '',
    audio: 'vm7',
    lines: [
      { t: 0.0, who: 'SFX',    hi: '[a TV serial murmuring. Slow breathing]', en: '' },
      { t: 4.0, who: 'SFX',    hi: '[a key turns in a lock. A door opens]', en: '' },
      { t: 6.0, who: 'NANI',   hi: 'Vikram? Itni raat ko?', en: 'Vikram? At this hour?' },
      { t: 8.0, who: 'VIKRAM', hi: 'Maasi, bas ek baar...', en: 'Maasi, just once...' },
      { t: 9.5, who: 'SFX',    hi: '[a sharp sound. The TV keeps playing]', en: '' }
    ],
    memory: [
      '11:42 PM. Her name on my screen.',
      'I looked at it. I thought: later.',
      'It rang until it stopped.',
      'Later never came.'
    ],
    beats: [ { when: 'afterMemory', id: 'TV_STATIC_SCARE' } ]
  },

  8: {
    id: 8, title: 'Eat Properly', stamp: '7:58 PM', durationSec: 8, cost: 0,
    audio: 'vm8',
    note: 'Played only inside an ending. It was left hours before the fall: the last time she ever spoke to you.',
    lines: [
      { t: 0.0, who: 'NANI', hi: 'Beta... kuch nahi, bas yaad aaya.', en: 'Beta... nothing, I just remembered you.' },
      { t: 3.5, who: 'NANI', hi: 'Theek se khaana, okay? Eat properly.', en: 'Eat properly, okay? Eat properly.' },
      { t: 6.5, who: 'NANI', hi: 'Bas itna hi kehna tha.', en: 'That is all I wanted to say.' }
    ]
  }
};
```

Memory scene format: each memory entry is shown as its own beat for
memory.beatHoldMs (5000 ms) with a soft fade between beats. 4 beats = 20 s.
Voice: none. Music: music_memory loop. Ambient: only a warm room tone.
Visual: dark warm background, a single simple silhouette illustration or a
blurred still per beat (optional art), text in Lora italic at the centre.

## 3. Small horror beats (what the "beats" ids do)

  RADIO_TURNS_ON      After VM1 fix: the radio plays a faint tune for 3 s,
                      then switches off by itself.
  HANDWRITING_LATER   After VM2 fix: toast "On the back, in your handwriting:
                      'later'."
  WINDOW_REOPENS      After VM3 fix: 4 s later the Living room window is open
                      again, curtain moving, no other effect.
  PHANTOM_WHISTLES    After VM4 fix: four whistles blow in the kitchen. The
                      cooker is cold. (Heard from anywhere, quietly.)
  REFLECTION_SCARE    JUMP SCARE 1. After VM5 fix, the note reader shows the
                      glasses lens reflecting a silhouette behind you for
                      0.4 s with a stinger.
  WARM_WIRE           After VM6 fix: toast "The earphone wire is warm. As if
                      someone just held it."
  TV_STATIC_SCARE     JUMP SCARE 3. After VM7's memory ends, the Living room TV
                      turns on to static. If the player is in the Living
                      room, the Hollow's face flashes in the static for
                      0.5 s. Otherwise it is audio only.
  (JUMP SCARE 2 is the Hollow's FIRST manifestation at Presence 90. Later
  manifestations are sound and shape only.)

## 4. texts.js (copy as is)

```js
export const TEXTS = {

  title: {
    name: 'UNHEARD',
    tagline: 'Some things can only be heard once.',
    notes: [
      'Contains: implied violence, psychological horror, 3 jump scares.',
      'Flashing lights (can be reduced in settings).',
      'Best played with headphones.'
    ],
    gate: 'Tap to begin. Wear headphones.'
  },

  prologue: [
    'The funeral ended at six.',
    "Mummy left for Mausi's. You said you'd lock up.",
    "Nani's flat smells of cardamom and old paper.",
    'You have her phone. Seven voicemails. You never played them.',
    'It is fully charged. Not for long.'
  ],

  objectives: {
    1: "Restore Nani's voicemails, in order.",
    2: 'Keep going. Someone has a key.',
    3: 'Find out who she was afraid of.',
    4: "Open Nani's locker. The code is in her notebook.",
    5: 'Call 112. Stay hidden until they arrive.'
  },

  hints: {
    start:     'Tap the floor to walk. Tap objects to look.',
    phone:     'Your phone is your torch. Open it at the bottom right.',
    torch:     'Light costs battery. Light also shows you to others.',
    damaged:   'A damaged voicemail needs a fix from the house.',
    vikram:    'Torch off. Stay still. Hide.',
    hide:      'Tap again to come out when it is quiet.'
  },

  messages: {
    mom1: { from: 'Mummy', text: "Reached Mausi's. Won't be back till tomorrow. Eat something." },
    mom2: { from: 'Mummy', text: "Vikram bhaiya called. He'll look in on you tonight. He's been such a help. Be nice to him." }
  },

  toasts: {
    notYet: 'Not yet.',
    nothingToFix: 'Nothing to fix here.',
    tooSmall: 'Too small to read.',
    lowBattery: 'Battery too low.',
    wrongFix: 'That did not work.',
    noItem: 'You need something for that.',
    locked: 'Locked.',
    callTooLoud: 'Too loud. Hold still.',
    callDropped: 'The call dropped.',
    callNeedsBattery: 'Not enough battery to call.'
  },

  barks: {   // Vikram. Each has a cooldown of vikram.barkCooldown seconds.
    entering:    [ 'Beta? Main hoon. Vikram.' ],
    patrol:      [ 'Beta? Sab theek? Nani ka phone dekha kya?',
                   'Yahin kahin rakha hoga...',
                   'Mummy ne mangwaya hai. Bas ek baar de do.',
                   'Itna andhera kyun hai yahan?',
                   '(humming a song, slightly too cheerful)' ],
    investigate: [ 'Kaun hai?', 'Kuch awaaz aayi thi...', 'Beta? Tum ho?' ],
    search:      [ 'Chhup kyun rahe ho, beta?', 'Main kuch nahi karunga.', 'Bas phone chahiye.' ],
    chase:       [ 'Phone do, beta.', 'Ruko!', 'Beta, ruk jao.' ],
    caught:      [ 'Bas ek phone hi toh hai.' ],
    hunt:        [ 'Mujhe pata hai tumhare paas hai.', 'Tape bhi de do.',
                   'Aaj raat bahut lambi hai, beta.', 'Locker khola na? Hmm?' ],
    away:        [ 'Haan haan... mil jayega... abhi dhoondh raha hoon.',
                   'Haan, so gaya hoga. Nahi, kuch nahi mila abhi tak.' ]
                   // 'away' is heard faintly through the front door when the
                   // player stands in the Hall near x = 880 while he is AWAY
  },

  hollow: [   // ambient whispers at Presence >= 60. Note the overuse of 'beta'.
    { id: 'H1', hi: 'Later, beta... later... later, beta.' },
    { id: 'H2', hi: 'Play the last one first, beta. Why wait, beta?' }, // temptation
    { id: 'H3', hi: 'Stay, beta. Stay with me, beta. It is warm here.' },
    { id: 'H4', hi: 'You are so tired, beta. So tired, beta. Sit.' },
    { id: 'H5', hi: 'He is coming, beta. Make some noise, beta. Make some.' },
    { id: 'H6', hi: "Don't open it, beta. Don't open it, beta." },
    { id: 'H7', hi: "Say it again, beta. Say 'later', beta." },
    { id: 'H8', hi: 'Beta, beta, beta, beta.' }
  ],

  nani: {
    chai:  'Chai pee lo.',          // NG1
    touch: 'Dheere. Dheere, beta.'  // NG4
  },

  // The VM5 note, shown in the note reader (docs/04 section 5).
  note: [
    "Beta, if something happens to me, don't trust V.",
    'The tape is in the almari. Code is where I keep my dal.',
    '- Nani'
  ],

  // SFX captions for the small horror beats (subtitles are always on).
  captions: {
    RADIO_TURNS_ON:   '[the radio plays a faint tune. Then it clicks off by itself.]',
    HANDWRITING_LATER: "On the back, in your handwriting: 'later'.",   // toast
    WINDOW_REOPENS:   '[somewhere, a window creaks open]',
    PHANTOM_WHISTLES: '[four pressure-cooker whistles from the kitchen]',
    REFLECTION_SCARE: '[a sharp sting of sound]',
    WARM_WIRE:        'The earphone wire is warm. As if someone just held it.', // toast
    TV_STATIC_SCARE:  '[the living room TV turns on by itself. Static.]',
    FORESHADOW:       '[far away: footsteps on the stairs. They stop. They go away.]',
    KEY_IN_LOCK:      '[a key in the lock]',
    LAMP_TICK:        '[the lamp flickers. A soft tick.]',   // Nani's warning
    DOOR_SLAM:        '[the front door slams]',
    MANIFEST_FULL:    '[a sting of sound. Something steps into the light.]',  // JS2
    MANIFEST:         '[the static thickens. Something is in the room.]',
    HOLLOW_FADE:      '[the static drains away]',
    PREVIEW_CLEAN:    '[the first seconds, clear]'
  },

  // Short interface lines.
  ui: {
    pickedUp: 'Picked up: ',
    evidence: 'Evidence: ',
    pauseHint: 'Pause and hide.',
    skipWarning: 'Skipping lets it in.',
    temptationSub: 'Saves battery.',
    callTip: 'Hold still while it connects.',
    emptyNotes: 'Nothing yet.',
    hide: 'HIDE',
    comeOut: 'COME OUT',
    temptation: 'PLAY #8 NOW'
  }
};
```

## 5. Narrative rules to protect

  1. Nani says "beta" at most once per voicemail and per whisper. The Hollow
     says it two or more times in a line, or in a pattern ("beta, beta").
  2. Subtitles show the "hi" text. The "en" text is for recording and a
     future translation toggle.
  3. No line of Vikram's ever says outright that he killed her. Evidence does.
  4. The word "later" appears in: VM1 (Nani), VM1 memory (you), the card
     handwriting, VM7 memory, the Hollow's whispers, and the LATER ending.
     Do not use it casually elsewhere.
  5. Mom's first text must remain readable in the MESSAGES tab all game.

## 6. Jump scares (maximum 3, all optional to soften)

  JS1  REFLECTION_SCARE  (VM5 fix)
  JS2  Hollow manifestation (Presence 90), FIRST manifestation only. Later
       manifestations are sound and the dark shape only: no face, no
       flash, no stinger flash (docs/03 section 5).
  JS3  TV_STATIC_SCARE   (after VM7)
Reduce-flash setting: no white or bright frames, flash replaced by a short
dark silhouette fade, stingers capped at -12 dB.

## 7. Prologue sequence (scripted, 25 s)

  0:00  black. Headphone gate tap. Ambience fades in (flat hum, fan, far
        traffic).
  0:02  prologue lines appear one at a time (3 s each), white-cream text, centre.
  0:14  fade into the Hall at x = 560. The chai cup is steaming (NG1).
  0:17  phone buzzes (sfx). Toast: new message. Mom text 1 arrives and is
        auto-opened for 6 seconds, then collapses to a notification.
  0:25  hint "start" appears for 4 s. Objective line (Act 1) appears at the
        top for 5 s. Control is given to the player.

## 8. Act transition moments

  Completed 1:  after the memory ends, from far away: footsteps on the stairs.
                They climb, stop, go away. (Foreshadow, 6 s audio.)
  Completed 2:  silence. Then a key in the front door lock. Subtitle
                [a key in the lock]. 3 s later Vikram enters. Act 2 starts and
                the windows swing open (VM3 becomes current).
  Completed 4:  temptation whisper H2 and the PLAY #8 NOW row appears.
  Completed 6:  phone buzzes: Mom text 2. Act 3.
  Completed 7:  Act 4. TV static (JS3). Objective changes to the locker.
  Tape taken:   Act 5 (see docs/06).
