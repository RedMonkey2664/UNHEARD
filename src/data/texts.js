// All UI and story text. Copied from docs/05 section 4.

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

  // How to play: shown after BEGIN and from the title's "How to play" button.
  // Each row is a short key (what to press / what it is) and what it does.
  howTo: {
    title: 'How to play',
    pages: [
      { heading: 'Your goal',
        rows: [
          { k: '1', d: "Nani's phone has 7 broken voicemails. Each one needs a fix from the flat." },
          { k: '2', d: 'Look around the four rooms for the clue, fix the voicemail, then play it.' },
          { k: '3', d: "When all 7 are heard, open Nani's steel locker in the kitchen." },
          { k: '4', d: 'Call 112 on the phone and stay hidden until the police arrive.' }
        ] },
      { heading: 'Controls',
        touch: [
          { k: 'Tap the floor', d: 'Walk there.' },
          { k: 'Tap an object', d: 'Walk to it and use it (windows, drawers, the radio...).' },
          { k: 'Torch button', d: 'Light. Uses battery, and he can see it.' },
          { k: 'Footsteps button', d: 'Sneak: slower, but much quieter.' },
          { k: 'Phone button', d: 'Voicemails, messages, notes and the 112 call.' },
          { k: 'HIDE', d: 'Appears when you stand by a hiding place.' }
        ],
        keys: [
          { k: 'A / D or arrows', d: 'Walk. You can also click the floor.' },
          { k: 'E', d: 'Use the nearest object or door (or click it).' },
          { k: 'F', d: 'Torch. Uses battery, and he can see it.' },
          { k: 'Shift or C', d: 'Sneak: slower, but much quieter.' },
          { k: 'H', d: 'Hide, when you stand by a hiding place.' },
          { k: 'P or Tab', d: 'Phone: voicemails, messages, notes, 112.' },
          { k: 'Space', d: 'Pause a voicemail that is playing.' }
        ] },
      { heading: 'Stay alive',
        rows: [
          { k: 'Vikram', d: 'After the 2nd voicemail he lets himself in. He wants the phone.' },
          { k: 'Lamp flicker', d: 'He is about to walk into your room. Torch off, then hide.' },
          { k: 'Noise bar', d: 'Keep it low when he is near. Walking and wrong answers are loud.' },
          { k: 'Battery', d: 'One battery for the torch, the voicemails and the call.' },
          { k: 'Teal voice', d: 'It lies. Never do what it says, and never skip a memory.' }
        ] }
    ],
    back: 'BACK',
    next: 'NEXT',
    start: 'START',
    done: 'DONE',
    open: 'How to play'
  },

  prologue: [
    'The funeral ended at six.',
    "Mom left for your aunt's. You said you'd lock up.",
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
    mom1: { from: 'Mom', text: "Reached your aunt's. Won't be back till tomorrow. Eat something." },
    mom2: { from: 'Mom', text: "Uncle Vikram called. He'll look in on you tonight. He's been such a help. Be nice to him." }
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
    entering:    [ "Hello? It's me. Vikram." ],
    patrol:      [ "Everything okay, kiddo? Have you seen Nani's phone?",
                   'It must be around here somewhere...',
                   'Your mother asked me to bring it. Just hand it over.',
                   'Why is it so dark in here?',
                   '(humming a song, slightly too cheerful)' ],
    investigate: [ "Who's there?", 'I heard something...', 'Kiddo? Is that you?' ],
    search:      [ 'Why are you hiding, kiddo?', "I won't do anything.", 'I just need the phone.' ],
    chase:       [ 'Give me the phone, kiddo.', 'Stop!', 'Kiddo, stop right there.' ],
    caught:      [ "It's only a phone." ],
    hunt:        [ 'I know you have it.', 'The tape too. Give it here.',
                   "It's going to be a long night, kiddo.", "You opened the locker, didn't you? Hmm?" ],
    away:        [ "Yes, yes... I'll find it... I'm looking right now.",
                   "Yes, they're probably asleep. No, nothing yet." ]
                   // 'away' is heard faintly through the front door when the
                   // player stands in the Hall near x = 880 while he is AWAY
  },

  hollow: [   // ambient whispers at Presence >= 60. Note the overuse of 'dear'.
    { id: 'H1', text: 'Later, dear... later... later, dear.' },
    { id: 'H2', text: 'Play the last one first, dear. Why wait, dear?' }, // temptation
    { id: 'H3', text: 'Stay, dear. Stay with me, dear. It is warm here.' },
    { id: 'H4', text: 'You are so tired, dear. So tired, dear. Sit.' },
    { id: 'H5', text: 'He is coming, dear. Make some noise, dear. Make some.' },
    { id: 'H6', text: "Don't open it, dear. Don't open it, dear." },
    { id: 'H7', text: "Say it again, dear. Say 'later', dear." },
    { id: 'H8', text: 'Dear, dear, dear, dear.' }
  ],

  nani: {
    chai:  'Drink your tea.',        // NG1
    touch: 'Slowly. Slowly, dear.'   // NG4
  },

  // The VM5 note, shown in the note reader (docs/04 section 5).
  note: [
    "Dear, if something happens to me, don't trust V.",
    'The tape is in the locker. The code is where I keep my dal.',
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
