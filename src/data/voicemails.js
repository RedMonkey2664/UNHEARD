// VM1-VM8 data. Copied from docs/05 section 2. Costs here are display only;
// balance.js wins.

export const VOICEMAILS = {
  1: {
    id: 1, title: 'Exam Week', stamp: '██:██', durationSec: 14, cost: 6,
    damage: 'static', previewLabel: '[crackling static over a faint voice]',
    fix: { type: 'RADIO' },
    hint1: 'Static. Nani\'s radio is in the living room.',
    hint2: 'Her calendar has a number circled twice.',
    audio: 'vm1',
    lines: [
      { t: 0.0,  who: 'SFX',  text: '[a steel cup set down on a table]' },
      { t: 1.0,  who: 'NANI', text: "Hello? It's me, Nani." },
      { t: 3.5,  who: 'NANI', text: 'How is studying going?' },
      { t: 6.0,  who: 'NANI', text: 'I left some tea outside your door. It must have gone cold.' },
      { t: 10.0, who: 'NANI', text: "Never mind, you're busy. I'll call later." },
      { t: 12.5, who: 'NANI', text: 'Eat something, dear.' }
    ],
    memory: [
      'Exam week. I had a door and a deadline.',
      'She stood outside for ten minutes with a steel cup of tea. I could see her shadow under the door.',
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
      { t: 0.0,  who: 'NANI', text: 'Happy birthday to you... happy birthday to you... (off-key)' },
      { t: 5.0,  who: 'SFX',  text: '[a beep. The call cuts out.]' },
      { t: 6.0,  who: 'NANI', text: 'Oh, did the call drop?' },
      { t: 8.0,  who: 'NANI', text: 'Anyway. I put something inside your card, dear.' },
      { t: 10.5, who: 'NANI', text: "Keep it safe. Don't show anyone." }
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
      { t: 0.0,  who: 'SFX',    text: '[heavy rain, traffic, a metro announcement far away]' },
      { t: 2.0,  who: 'NANI',   text: "The rain is so heavy, dear. Good thing I gave you the umbrella." },
      { t: 6.0,  who: 'NANI',   text: "I'll call when I get home." },
      { t: 8.5,  who: 'VIKRAM', text: "Auntie, just one signature. Sign once and I'll never ask again." },
      { t: 12.0, who: 'NANI',   text: 'No, Vikram. Never.' },
      { t: 14.0, who: 'SFX',    text: '[rain]' }
    ],
    memory: [
      'Monsoon. She came to the metro station just to hand me an umbrella.',
      "I said she would get wet. She said, 'I'm old. A little water won't hurt me.'",
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
      { t: 0.0,  who: 'SFX',  text: '[a pressure cooker hissing, a radio playing low]' },
      { t: 1.5,  who: 'NANI', text: 'How much salt in the dal? By feel, dear.' },
      { t: 4.5,  who: 'NANI', text: 'Measuring never gives the taste.' },
      { t: 7.0,  who: 'NANI', text: 'Four whistles. Four whistles, then turn off the gas.' },
      { t: 10.0, who: 'NANI', text: 'And everything is in the notebook. If you forget, look. The whole account is there.' }
    ],
    memory: [
      'Sundays in her kitchen. Steel plates, steam, the radio low.',
      "I asked for the recipe. She said: 'By feel.'",
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
      { t: 0.0,  who: 'SFX',  text: '[a quiet room. Her breathing]' },
      { t: 2.0,  who: 'NANI', text: "Sorry... I talk too much, don't I." },
      { t: 6.0,  who: 'NANI', text: "You were right. I'm from another time." },
      { t: 11.0, who: 'NANI', text: "I've written something down. I can't say it out loud." },
      { t: 15.0, who: 'NANI', text: 'Read it... when you have time.' },
      { t: 18.0, who: 'NANI', text: "Don't take it to heart, dear." }
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
      { t: 0.0,  who: 'SFX',  text: '[a hospital monitor beeping slowly]' },
      { t: 1.0,  who: 'NANI', text: "Dear... don't tell your mother I called." },
      { t: 5.0,  who: 'NANI', text: "Vikram came. With papers. He wasn't talking right." },
      { t: 9.5,  who: 'NANI', text: "I'm fine. You focus on your studies." }
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
      { t: 0.0, who: 'SFX',    text: '[a TV serial murmuring. Slow breathing]' },
      { t: 4.0, who: 'SFX',    text: '[a key turns in a lock. A door opens]' },
      { t: 6.0, who: 'NANI',   text: 'Vikram? At this hour?' },
      { t: 8.0, who: 'VIKRAM', text: 'Auntie, just this once...' },
      { t: 9.5, who: 'SFX',    text: '[a sharp sound. The TV keeps playing]' }
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
      { t: 0.0, who: 'NANI', text: "Dear... it's nothing, I was just thinking of you." },
      { t: 3.5, who: 'NANI', text: 'Eat properly, okay? Eat properly.' },
      { t: 6.5, who: 'NANI', text: 'That is all I wanted to say.' }
    ]
  }
};
