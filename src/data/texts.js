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
  }
};
