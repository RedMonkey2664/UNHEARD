# 04 - World, rooms, items and puzzles

All data below goes into src/data/rooms.js and src/data/items.js.

## 1. Map

Four single-screen rooms. Every room is 960 x 540. The player walks left and
right on one floor line (y = 430). Rooms connect only through the Hall.

```
            HALL (corridor)
   x=130      x=420        x=700      x=880
  [D_LIVING] [D_KITCHEN]  [D_BEDROOM] [D_FRONT locked]
      |          |            |
      v          v            v
   LIVING     KITCHEN       BEDROOM
  (door at   (door at      (door at
   x=880)     x=70)         x=70)
```

Player start: HALL, x = 560 (next to the steel cup of chai).
Vikram enters at HALL, x = 880 (the front door).
The front door cannot be used by the player: "Locked. The key is with Vikram."

Passing through a door: player.doorFadeSec (0.4 s) fade, player appears at the matching door x in
the other room, noise spike (door) x proximity.

## 2. Condition mini-language (used in the data below)

A "when" object passes only if every key passes.

  vmCurrent: n         VM n is the current VM and its status is 'damaged'
  vmFixed: n           VM n status is fixed, playing, memory or done
  vmDone: n            VM n status is done
  completedAtLeast: n  at least n voicemails are done
  flag: name           flags[name] is true
  notFlag: name        flags[name] is false
  hasTool: id          tool in inventory
  hasEvidence: id      evidence collected
  notHasEvidence: id
  hasCardPiece: id     notHasCardPiece: id     hasAllCardPieces: true
  windowClosed: id     id is in windowsClosed (VM3 puzzle in progress)

A hotspot has "variants". The first variant whose "when" passes is used.
A variant has: examine (text), and optional action:
  setFlag: 'name'
  giveTool: 'ID'            giveEvidence: 'ID'
  giveCardPiece: 'ID'       openFix: 'RADIO'|'CARD'|'COOKER'|'NOTE'
  closeWindow: 'KITCHEN'|'BEDROOM'|'LIVING'
  openKeypad: true          glimpse: 'NG1'

Every examine or pickup emits noise spike "interact" x proximity.
Examine text appears as a short line near the bottom (3 s) and as a subtitle.

## 3. rooms.js (copy as is, then wire to art)

```js
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
```

Notes for the implementer:
  - Hotspot hit area: x +- w/2, from y = 280 to the floor line.
  - Hide spots use hideRange 80 (balance.js). Their art is part of the room.
  - D_FRONT is drawn but only gives its examine text.
  - Windows exist visually in all three rooms. They start "Latched shut".
    When VM3 becomes the current VM (after VM2's memory ends) they swing open
    with rain audio. See puzzle WINDOWS.
  - H_CHAI is also the first Nani glimpse (NG1). See section 6.

## 4. items.js

```js
export const TOOLS = {
  GLASSES:   { name: "Nani's glasses",   desc: 'Reading glasses mended with cello-tape.', icon: 'it_glasses' },
  EARPHONES: { name: 'Earphones',        desc: 'Tangled white earphones.',                icon: 'it_earphones' }
};

// Stored in state.cardPieces, NOT in inventory.tools, so the VM6 item picker
// never lists them. Consumed when the card is assembled.
export const CARD_PIECES = {
  CARD_A: { name: "Card scrap: 'Happy'",     icon: 'it_card_a' },
  CARD_B: { name: "Card scrap: 'Birthday,'", icon: 'it_card_b' },
  CARD_C: { name: "Card scrap: 'beta.'",     icon: 'it_card_c' }
};

export const EVIDENCE = {
  E1: { name: "Vikram's lighter",      kind: 'physical', desc: "Silver, engraved V.M. Found in Nani's ashtray." },
  E2: { name: 'Torn property deed',    kind: 'physical', desc: 'Hidden inside the birthday card.' },
  E3: { name: 'Voicemail: the argument in the rain', kind: 'audio',
        desc: "Vikram's voice, begging her to sign." },
  E4: { name: 'Notebook page 2',       kind: 'physical', desc: 'Locker code 0614.' },
  E5: { name: "Nani's unsent note",    kind: 'physical', desc: "'If something happens, don't trust V.'" },
  E6: { name: 'Hospital visitor slip', kind: 'physical', desc: "'V. Mehra - ICU 2 - 9:40 PM'" },
  E7: { name: 'Voicemail: the night she fell', kind: 'audio',
        desc: 'A key in the lock. His voice. A thud.' },
  E8: { name: "Nani's tape recorder",  kind: 'physical', desc: 'The real proof.' }
};
```

Card pieces are consumed when the card is assembled.
Evidence counting for the epilogue (see docs/06):
  physical evidence = E1, E2, E4, E5, E6 (5 items). E4 and E5 are required by
  the puzzles, so the minimum is 2. Audio evidence E3 and E7 are automatic.
  The tape (E8) is mandatory for the final act.

## 5. Puzzles (exact rules)

### VM1 RADIO (Living room)
  Clue: calendar (94.3).
  UI: dial 88.0 to 108.0, step 0.1, CONFIRM button.
  Correct: |value - 94.3| <= 0.1 -> fixed.
  Wrong: standard wrong-fix penalty. Dial stays where it is.
  After fix (beat): the radio plays a faint tune for 3 s and switches off.

### VM2 CARD (Bedroom)
  Pieces: CARD_A (desk), CARD_B (bed), CARD_C (dresser). Collect all three.
  Then at the desk: UI shows three pieces shuffled in a tray and three slots.
  Player taps pieces into slots left to right. Correct order A, B, C
  ("Happy" "Birthday," "beta.").
  Wrong order on the third placement: wrong-fix penalty, pieces return to tray.
  On success: flag cardAssembled, VM2 fixed, pieces removed. Then the desk
  hotspot yields E2 (the deed).
  After fix (beat): the card's back shows one word in the player's own
  handwriting: "later". Toast: "On the back, in your handwriting: 'later'."

### VM3 WINDOWS (Kitchen, Bedroom, Living room; clue in the Hall)
  Clue: umbrella tag "Rasoi - Kamra - Baithak" = Kitchen, Bedroom, Living.
  When VM3 becomes current, the three windows swing open with rain audio.
  Tap each window to close it. The order is recorded in windowsClosed.
  After the third window: if order is [KITCHEN, BEDROOM, LIVING] -> fixed.
  Otherwise wrong-fix penalty and all three windows swing open again.
  Closing a window makes a small noise spike (interact).
  After fix (beat): 4 seconds later the LIVING window is open again, the
  curtain moving, and flags.livingWindowReopened = true. Nothing else
  happens. (Slow dread.) After the fix the Kitchen and Bedroom windows say
  "Closed."; the Living window says "Open again. The curtain is moving.
  You closed it." Tapping a window already closed during the puzzle says
  "Closed." and does not record it again.

### VM4 COOKER (Kitchen)
  Clue: notebook page 1 ("4 siti").
  UI: a counter 0 to 9 with plus and minus, CONFIRM.
  Correct: 4. Wrong: standard penalty.
  After fix (beat): four whistles blow in the kitchen, but the cooker is cold.
  After VM4's memory ends the notebook yields E4 (page 2, locker code).

### VM5 NOTE (Bedroom nightstand; tool from the Living room drawer)
  Needs GLASSES. Tapping the note with GLASSES in inventory opens the note
  reader: the text is shown in large handwriting:
     "Beta, if something happens to me, don't trust V.
      The tape is in the almari. Code is where I keep my dal.
      - Nani"
  Reading it sets E5 and fixes VM5.
  NOTE without GLASSES: "Too small to read." (no penalty).
  After fix (beat, JUMP SCARE 1): the glasses lens shown in the reader reflects
  a silhouette standing behind you for 0.4 s with a stinger. Reduce-flash
  setting replaces the flash with a darker silhouette and no flash frame.

### VM6 EARPHONES (phone item picker)
  Needs EARPHONES from the Kitchen drawer.
  In the phone, FIX opens an item picker showing the tool list. Choose
  EARPHONES -> fixed. Any other tool -> standard wrong-fix penalty.
  After fix (beat): toast "The earphone wire is warm. As if someone just
  held it."

### VM7 (no fix)
  Starts 'fixed' when it becomes current.
  After its memory ends: the Living room TV turns on to static (JUMP SCARE 3,
  see docs/05). Evidence E7 is granted at the end of playback.

### Locker (Kitchen)
  Unlocked for use when completed >= 7.
  UI: 4-digit keypad. Code 0614 (from E4).
  Wrong code: noise spike wrongCode x proximity. No battery cost.
  Correct: flags.lockerOpened = true, tape recorder E8 added, flags.tapeTaken =
  true, final act begins (docs/06).

## 6. Ghost placements

Nani (never harmful):
  NG1  Hall, x = 520. The steel cup of chai, steaming. Present from the start
       until VM1 is done. Tapping it plays "Chai pee lo." No Presence change.
  NG2  Presence >= 30 (first crossing). In the room the player is in: a thin
       figure standing in the doorway at the far side, nani.ng2Sec (8 s), then gone.
       Not tappable.
  NG3  After VM3 is done: in the LIVING window glass, a reflection a second
       late. Cosmetic. Only if the player is in the Living room within nani.ng3WindowSec (30 s),
       otherwise skip.
  NG4  Presence >= 45 and touches used < 3: a steel cup of chai fades in nani.ng4Dist
       (120 px) from the player. Tapping it: Presence -10, plays "Dheere. Dheere,
       beta.", touches used + 1. If ignored for nani.ng4FadeSec (12 s) it fades.
  NG5  Lamp warning (not a glimpse): see docs/03 (only if Presence < 60).

The Hollow:
  Sound only below Presence 60.
  At Presence >= 60: a tall, thin dark shape glimpsed at the edge of the torch
  light, never at the same place twice.
  At Presence >= 90: manifest. It steps into the torch light in the player's
  room wearing Nani's face. JUMP SCARE 2. Player has 5 s to use a door.

## 7. Evidence timeline

  E1  after VM1 done, tap the ashtray (Living room)
  E2  after the card is assembled, tap the desk (Bedroom)
  E3  automatic at the end of VM3 playback
  E4  after VM4 done, tap the notebook (Kitchen)
  E5  when the note is read (VM5 fix)
  E6  after VM6 done, tap the coat (Hall)
  E7  automatic at the end of VM7 playback
  E8  when the locker opens

## 8. Phone NOTES tab content

  OBJECTIVE   current objective line (docs/05 texts.objectives)
  HINT        shown after the current VM has been damaged for hints.hint1Sec (90 s,
              hint1) and hints.hint2Sec (180 s, hint2). From data/voicemails.js.
  EVIDENCE    list of collected evidence with name and one-line desc
  LOCKER CODE appears once E4 is collected: "0614"
