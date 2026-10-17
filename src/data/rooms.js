// Rooms, doors, hide spots, hotspots. Copied from docs/04 section 3.

export const ROOMS = {
  HALL: {
    label: 'Hall', bg: 'bg_hall',
    start: { x: 560 },
    doors: [
      { id: 'D_LIVING',  x: 130, to: 'LIVING',  toX: 880 },
      { id: 'D_KITCHEN', x: 420, to: 'KITCHEN', toX: 70 },
      { id: 'D_BEDROOM', x: 700, to: 'BEDROOM', toX: 70 },
      { id: 'D_FRONT',   x: 880, to: null, locked: true,
        examine: 'Locked. The key is with Vikram.' }
    ],
    hideSpots: [],
    hotspots: [
      { id: 'H_UMBRELLA', x: 230, w: 70, label: 'Umbrella', variants: [
        { examine: "Nani's black umbrella. A paper tag is tied to the handle: 'Rasoi - Kamra - Baithak'.",
          action: { setFlag: 'readUmbrellaTag' } } ] },
      { id: 'H_CLOCK', x: 330, w: 50, label: 'Wall clock', variants: [
        { examine: 'The wall clock stopped at 11:42. Nobody changed the battery.' } ] },
      { id: 'H_CHAI', x: 520, w: 60, label: 'Cup of chai', variants: [
        { when: { vmDone: 1 }, examine: 'The cup is empty now.' },
        { examine: 'A steel cup of chai. Still warm. Nobody else is home.',
          action: { glimpse: 'NG1' } } ] },
      { id: 'H_COAT', x: 600, w: 70, label: 'Grey coat', variants: [
        { when: { vmDone: 6, notHasEvidence: 'E6' },
          examine: "In the pocket, folded small: a hospital visitor slip. 'V. Mehra - ICU 2 - 9:40 PM'.",
          action: { giveEvidence: 'E6' } },
        { when: { hasEvidence: 'E6' }, examine: 'Her coat. The pockets are empty now.' },
        { examine: "Nani's grey coat. Tissues and a peppermint." } ] },
      { id: 'H_SHOES', x: 790, w: 70, label: 'Chappals', variants: [
        { examine: "Her chappals, side by side. Neat, as if she had just stepped out." } ] }
    ]
  },

  LIVING: {
    label: 'Living room', bg: 'bg_living',
    doors: [ { id: 'D_HALL', x: 880, to: 'HALL', toX: 130 } ],
    hideSpots: [
      { id: 'LIVING_CURTAIN', x: 70,  label: 'Behind the curtain' },
      { id: 'LIVING_SOFA',    x: 720, label: 'Behind the sofa' }
    ],
    hotspots: [
      { id: 'H_RADIO', x: 170, w: 70, label: 'Radio', variants: [
        { when: { vmCurrent: 1 },
          examine: "Nani's old radio. Static and a crackle. The dial is loose.",
          action: { openFix: 'RADIO' } },
        { when: { vmFixed: 1 }, examine: 'The radio hums a song you do not recognise.' },
        { examine: "Nani's old radio. It crackles when you come near." } ] },
      { id: 'H_WINDOW_LIVING', x: 270, w: 70, label: 'Window', variants: [
        { when: { flag: 'livingWindowReopened' },
          examine: 'Open again. The curtain is moving. You closed it.' },
        { when: { vmCurrent: 3, windowClosed: 'LIVING' }, examine: 'Closed.' },
        { when: { vmCurrent: 3 }, examine: 'The window is open. Rain blows in.',
          action: { closeWindow: 'LIVING' } },
        { when: { vmFixed: 3 }, examine: 'Closed.' },
        { examine: 'Latched shut.' } ] },
      { id: 'H_CALENDAR', x: 360, w: 60, label: 'Calendar', variants: [
        { examine: "The grocer's calendar. One number is circled twice in red pencil beside a radio station: 94.3.",
          action: { setFlag: 'readCalendar' } } ] },
      { id: 'H_ASHTRAY', x: 450, w: 60, label: 'Ashtray', variants: [
        { when: { vmDone: 1, notHasEvidence: 'E1' },
          examine: 'Something glints in the ashtray: a silver lighter engraved V.M. Nani never allowed smoking indoors.',
          action: { giveEvidence: 'E1' } },
        { when: { hasEvidence: 'E1' }, examine: 'Scrubbed glass. Somebody smoked here until recently.' },
        { examine: 'A glass ashtray. Nani kept paperclips in it.' } ] },
      { id: 'H_TV', x: 540, w: 80, label: 'TV', variants: [
        { when: { vmDone: 7 }, examine: 'The TV is on. Static. You did not turn it on.' },
        { examine: "The TV is off. Her serial's channel is still set." } ] },
      { id: 'H_DRAWER_L', x: 630, w: 60, label: 'Side drawer', variants: [
        { when: { hasTool: 'GLASSES' }, examine: 'Empty. Rubber bands and a dead pen.' },
        { examine: 'Her reading glasses, one arm mended with cello-tape.',
          action: { giveTool: 'GLASSES' } } ] }
    ]
  },

  KITCHEN: {
    label: 'Kitchen', bg: 'bg_kitchen',
    doors: [ { id: 'D_HALL', x: 70, to: 'HALL', toX: 420 } ],
    hideSpots: [ { id: 'KITCHEN_PANTRY', x: 780, label: 'In the pantry' } ],
    hotspots: [
      { id: 'H_WINDOW_KITCHEN', x: 190, w: 70, label: 'Window', variants: [
        { when: { vmCurrent: 3, windowClosed: 'KITCHEN' }, examine: 'Closed.' },
        { when: { vmCurrent: 3 }, examine: 'The window is open. Rain blows in.',
          action: { closeWindow: 'KITCHEN' } },
        { when: { vmFixed: 3 }, examine: 'Closed.' },
        { examine: 'Latched shut.' } ] },
      { id: 'H_NOTEBOOK', x: 300, w: 60, label: 'Recipe notebook', variants: [
        { when: { vmDone: 4, notHasEvidence: 'E4' },
          examine: "Page 2 is different now. A column of numbers, one row circled in her pencil: 0 6 1 4. Beside it: 'almari'.",
          action: { giveEvidence: 'E4' } },
        { when: { hasEvidence: 'E4' }, examine: "Her notebook. The locker code is 0614." },
        { examine: "Nani's recipe notebook. Page 1: 'Dal - namak andaaz se. 4 siti. Gas band.'",
          action: { setFlag: 'readNotebookPage1' } } ] },
      { id: 'H_COOKER', x: 420, w: 80, label: 'Pressure cooker', variants: [
        { when: { vmCurrent: 4 },
          examine: 'The pressure cooker, lid on. Its whistle counter is a loose steel dial.',
          action: { openFix: 'COOKER' } },
        { examine: 'The pressure cooker. Cold.' } ] },
      { id: 'H_DRAWER_K', x: 540, w: 60, label: 'Kitchen drawer', variants: [
        { when: { hasTool: 'EARPHONES' }, examine: 'Empty. A rubber band and a stub of pencil.' },
        { examine: 'Tangled white earphones. They still smell of her perfume.',
          action: { giveTool: 'EARPHONES' } } ] },
      { id: 'H_LOCKER', x: 650, w: 80, label: 'Steel locker', variants: [
        { when: { flag: 'lockerOpened' }, examine: 'The locker is open and empty.' },
        { when: { completedAtLeast: 7 }, examine: 'The steel locker with a four-digit dial.',
          action: { openKeypad: true } },
        { examine: "A steel locker with a four-digit dial. 'Not yet,' something whispers. 'Hear her out first.'" } ] }
    ]
  },

  BEDROOM: {
    label: 'Nani\'s bedroom', bg: 'bg_bedroom',
    doors: [ { id: 'D_HALL', x: 70, to: 'HALL', toX: 700 } ],
    hideSpots: [
      { id: 'BEDROOM_UNDERBED',  x: 500, label: 'Under the bed' },
      { id: 'BEDROOM_WARDROBE',  x: 790, label: 'In the wardrobe' }
    ],
    hotspots: [
      { id: 'H_WINDOW_BEDROOM', x: 160, w: 70, label: 'Window', variants: [
        { when: { vmCurrent: 3, windowClosed: 'BEDROOM' }, examine: 'Closed.' },
        { when: { vmCurrent: 3 }, examine: 'The window is open. Rain blows in.',
          action: { closeWindow: 'BEDROOM' } },
        { when: { vmFixed: 3 }, examine: 'Closed.' },
        { examine: 'Latched shut.' } ] },
      { id: 'H_DESK', x: 250, w: 70, label: 'Desk', variants: [
        { when: { flag: 'cardAssembled', notHasEvidence: 'E2' },
          examine: 'A folded paper has slipped out of the card: a property deed, torn at one corner.',
          action: { giveEvidence: 'E2' } },
        { when: { hasEvidence: 'E2' },
          examine: 'Newspaper cuttings about the building. She was collecting something.' },
        { when: { vmCurrent: 2, hasAllCardPieces: true },
          examine: 'Three scraps of a torn birthday card. They fit together.',
          action: { openFix: 'CARD' } },
        { when: { notHasCardPiece: 'CARD_A', notFlag: 'cardAssembled' },
          examine: "On the desk, a scrap of a birthday card: 'Happy'.",
          action: { giveCardPiece: 'CARD_A' } },
        { examine: 'Newspaper cuttings about the building.' } ] },
      { id: 'H_NIGHTSTAND', x: 340, w: 60, label: 'Folded note', variants: [
        { when: { hasEvidence: 'E5' },
          examine: "The note says: 'If something happens, don't trust V.'" },
        { when: { vmCurrent: 5, hasTool: 'GLASSES' },
          examine: 'A folded note under the lamp. With her glasses on, you can read it.',
          action: { openFix: 'NOTE' } },
        { when: { vmCurrent: 5 },
          examine: 'A folded note under the lamp. The handwriting is far too small to read.' },
        { examine: "A folded note under the lamp. You can't bring yourself to open it yet." } ] },
      { id: 'H_BED', x: 440, w: 90, label: 'Bed', variants: [
        { when: { notHasCardPiece: 'CARD_B', notFlag: 'cardAssembled' },
          examine: "Under the pillow, another scrap of the card: 'Birthday,'.",
          action: { giveCardPiece: 'CARD_B' } },
        { examine: 'Her bed. Made, with hospital-corner precision.' } ] },
      { id: 'H_DRESSER', x: 620, w: 70, label: 'Dresser', variants: [
        { when: { notHasCardPiece: 'CARD_C', notFlag: 'cardAssembled' },
          examine: "Between her bangles: a last scrap of the card. 'beta.'",
          action: { giveCardPiece: 'CARD_C' } },
        { examine: 'Bangles, a comb, a bottle of coconut oil.' } ] }
    ]
  }
};
