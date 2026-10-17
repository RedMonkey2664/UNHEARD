# 06 - Final act and endings

## 1. The final act (Act 5): "The Long Minute"

### 1.1 Trigger
The final act starts when the locker opens (flags.tapeTaken = true).
Requirement to open the locker: completed >= 7 and the code 0614.

### 1.2 The tape moment (scripted, 8 s, player locked, Vikram frozen)
  - Click of a tape recorder. Hiss.
  - Tape audio (tinny, from the recorder), subtitles:
      VIKRAM: "Sign kar do, Maasi. Warna... accha nahi hoga."
      NANI:   "Mere jeete ji nahi, Vikram."
  - The recorder is added to inventory as E8.
  - Cut. From the Hall, Vikram's voice, no longer soft:
      VIKRAM: "Locker khola na? Hmm?"
  - Act 5 begins. Objective: "Call 112. Stay hidden until they arrive."
  - A CALL button appears on the phone and as a small button on the HUD.

### 1.3 Vikram in Act 5 (HUNT)
Exactly as docs/03 section 6, HUNT. If he was AWAY he re-enters within 2 s
with a door slam. He now checks every hide spot in every room, speaks the
"hunt" barks, and investigates noise at 40 instead of 60.

### 1.4 Placing the call
Conditions to press CALL:
  - battery >= 3 (balance.battery.callMinBattery)
  - noise < 40 (balance.noise.callStartMax)
  - the player is standing still or hidden (not walking)
Process:
  - connecting takes 6 s (balance.final.callConnectSec), shown as a progress
    ring on the CALL button. Whispered "112" subtitle in YOU grey.
  - while connecting, noise gains +6/s x proximity (like a puzzle)
  - if noise >= 60 during connecting: the call drops. Toast "The call
    dropped.", Presence +5, no battery cost. The player may try again.
  - on connect: battery -2, flags.callConnected = true, the ETA starts at 75 s
    and counts down on the HUD ("POLICE 1:15") and in the phone.
  - phone voice (operator, tiny): "Police are on their way. Stay where you are
    and stay quiet." (voice file op_1)
If tapeTaken and battery < 3 and the call is not connected: start the 25 s
dead-air timer (see docs/03 section 3).

### 1.5 Surviving the countdown
  - ETA 75 to 9: normal HUNT rules. Caught or dead-air still apply.
  - ETA <= final.sirenAtEta (20): a distant siren fades in.
  - ETA <= 8: CORNER EVENT (below).
  - The player may move, hide, and use doors as usual until the corner event.

### 1.6 Corner event (ETA <= 8)
  - corner:start. The player is locked in place. Vikram's AI is suspended.
  - Vikram walks straight to the player at speed 160, even if hidden (he knows
    now). CAUGHT checks are disabled. This is a cinematic, not a test.
  - When Vikram is within 45 px of the player, or ETA reaches 0 (whichever
    comes first), resolve with cause 'police_arrived':
        Presence <= final.niceEndingMaxPresence (59) -> EAT PROPERLY
        otherwise                                    -> STATIC

## 2. Ending resolution

Causes and results (src/systems/endingResolver.js):

```
cause              result
temptation         LATER
presence_doom      LATER
caught             CAUGHT
dead_air           CAUGHT
police_arrived     EAT_PROPERLY if presence <= niceEndingMaxPresence (59)
                   else STATIC
```

Priority if two causes arrive in the same frame:
  LATER > CAUGHT > police_arrived

Rules:
  - Once ending:trigger fires, further presence, noise, battery and Vikram
    changes are ignored. The EndingScene takes over.
  - The corner event disables 'caught' and 'dead_air'.
  - Manifestation timer (Presence 90) still runs during the final act. If it
    expires: presence_doom -> LATER.
  - PLAY #8 NOW stays on the phone until the end. Pressing it in any act ->
    LATER.
  - Replay of voicemails is disabled in Act 5.

```js
export function resolveEnding(cause, state) {
  if (cause === 'temptation' || cause === 'presence_doom') return 'LATER';
  if (cause === 'caught' || cause === 'dead_air') return 'CAUGHT';
  if (cause === 'police_arrived') {
    return state.presence <= BALANCE.final.niceEndingMaxPresence
      ? 'EAT_PROPERLY' : 'STATIC';
  }
  throw new Error('unknown ending cause: ' + cause);
}
```

Evidence count for the epilogue:
  physical = number of collected items among E1, E2, E4, E5, E6 (0..5)

## 3. Ending scene format (src/data/endings.js)

An ending is a list of beats played in order by EndingScene. No darkness
layer. Each beat:

```js
{
  at: 0.0,               // seconds from ending start (or use hold chaining)
  visual: 'black',       // 'black' | 'room:KITCHEN' | 'still:<key>' | 'phone' | 'text'
  audio: ['sfx_xxx'],    // zero or more keys (missing keys just fall back)
  voice: 'vik_x',        // optional voice key
  lines: [ { who:'VIKRAM', hi:'...' } ],   // subtitles
  text: 'optional big centre text',
  hold: 4.0              // seconds this beat lasts
}
```

All ending text below goes into endings.js. Visuals can be plain colour fields
with text when art is missing. The sound design is what carries these scenes.

## 4. Ending 1: EAT PROPERLY (good), about 95 s

Conditions: police_arrived and Presence <= niceEndingMaxPresence (59).

Beats:
 1. (6 s) CORNER. Footsteps stop right beside you. A hide-spot door opens a
    crack, or he stands in front of you. Torch is off.
       VIKRAM: "Bas ek phone hi toh hai, beta."
 2. (8 s) COLD. Your breath fogs. Every bulb in the flat dies, one by one.
    Ambience cuts out. [every light in the flat dies, one by one]
       VIKRAM: "Yeh kya..."
 3. (8 s) FLAME. A soft whump: the gas burners in the kitchen light by
    themselves. Blue light creeps along the floor. A smell of cardamom.
    Vikram looks at something behind you. We never see it.
       VIKRAM: "Maasi...?"
       VIKRAM: "Maasi, main... main sirf..."
 4. (8 s) FALL. Keys rattle, a door slams, a long fall down the stairs,
    then silence. [a long fall on the stairs. Then silence.]
 5. (8 s) The lamps return, soft and warm. Pounding on the door. Sirens
    outside.
       POLICE: "Police! Darwaza kholiye!"
 6. (8 s) Text card: "2:40 AM". Police at the door, voice softer.
       POLICE: "Aap theek hain?"
       MOM:    "Beta! Beta, tu theek hai?"
       MOM:    "Tune kuch khaya?"   (the player shakes their head: SFX)
       MOM:    "Chal."
 7. (14 s) The phone buzzes on the hall table. Visual 'phone': "Voicemail 8,
    7:58 PM, Nani". It plays automatically (no battery cost). Voicemail 8 plays
    in clear audio with subtitles from docs/05 (VM8 lines).
 8. (18 s) The kitchen table. Two steel plates, two cups. Visual: warm still
    of the table, steam from the second cup.
       MOM: "Maine toh ek hi plate nikaali thi..."
    She looks at the second cup. Says nothing. Sits. You sit. You take a
    bite. The steam from the second cup rises, curls, and stops.
 9. (6 s) Centre text: "You ate. That was all she wanted."
10. (8 s) Epilogue card, choose by physical evidence count:
       5   "Vikram Mehra was arrested that night. The lighter, the deed, the
            note, the slip and the tape. The case closed within a week."
       3-4 "Vikram Mehra was arrested that night. It took a few months, but
            it held."
       0-2 "Vikram Mehra was arrested that night. The tape was all there was.
            It was enough."
11. End card: "ENDING 1 OF 4: EAT PROPERLY". Buttons: PLAY AGAIN, TITLE.
    Save "EAT_PROPERLY" in unheard.endings.

## 5. Ending 2: STATIC (bittersweet), about 70 s

Conditions: police_arrived and Presence above niceEndingMaxPresence (60 to 99).

Beats:
 1. (6 s) CORNER, as in Ending 1, beat 1, but VIKRAM says:
       VIKRAM: "Phone do, beta."
 2. (8 s) The lights flicker. Teal bleeds into the room. No Nani. A whisper
    underneath: HOLLOW: "Later, beta... later, beta." Vikram's hand closes on the
    phone. You do not let go.
 3. (6 s) POLICE (outside): "Police! Darwaza kholiye!" The door bursts. The
    phone slips and cracks on the tiles. [a crack of glass]
       VIKRAM: "Yeh sab galat samajh rahe hain..."
 4. (8 s) Text card: "2:40 AM". Mom's voice at the door:
       MOM: "Beta! Beta, tu theek hai?"
       MOM: "Tune kuch khaya?"
 5. (16 s) The cracked phone on the table, flickering. Voicemail 8 plays, but
    only in pieces. Static eats most of it. Subtitles show gaps:
       NANI: "Beta... kuch nahi, bas ya—"
       NANI: "...theek se kha—"
       NANI: "...bas it—"
    The screen then shows the sentence with blanks and holds:
       "Beta, ____ ____, bas ____ ____."
 6. (12 s) The kitchen. One plate. The chair across is empty.
       Centre text: "You will never know exactly how she said it."
       Centre text: "You only know what she meant."
 7. (8 s) Epilogue card: same text as Ending 1 for the evidence count, plus
    the line: "The phone never worked properly again."
 8. End card: "ENDING 2 OF 4: STATIC". Save "STATIC".

## 6. Ending 3: CAUGHT (thriller bad), about 30 s

Conditions: cause 'caught' or 'dead_air'.

Beats (cause 'caught'):
 1. (5 s) Footsteps stop in front of you. Silence.
       VIKRAM: "Bas ek phone hi toh hai."
    If tapeTaken: add VIKRAM: "Aur tape bhi."
 2. (8 s) Visual 'phone': the phone leaves your hand. The voicemail icon, the
    battery bar. The icon dies like a lamp running out of oil.
 3. (5 s) Footsteps leaving. A key. A door. A TV murmuring somewhere. Black.
 4. (6 s) Centre text: "Some things are only heard once."
 5. End card: "ENDING 3 OF 4: CAUGHT". Save "CAUGHT".

Variant, cause 'dead_air':
 1. (6 s) The phone screen goes black. In the dark: [a key turns in a lock]
       VIKRAM: "Beta? Andhera kyun hai yahan?"
 2. Continue from beat 3 above.

## 7. Ending 4: LATER (horror bad), about 45 s

Conditions: cause 'temptation' or 'presence_doom'.

Beats (cause 'temptation'):
 1. (8 s) Visual 'phone': #8 starts playing. It is NOT Nani. A young voice,
    gender-neutral, the player's own:
       YOU (voice): "Nani, later. I am studying."
    then again, "later... later... later", each slower and lower until it is
    only a vibration. (voice file you_later)
 2. (8 s) The static in the room thickens. The torch dies. The Hollow steps
    out of the static wearing Nani's face. Not quite right. It tilts its head.
    Visual: a still of a dark room, a thin shape, a pale face.
 3. (6 s) From the kitchen, warm and wrong:
       HOLLOW: "Beta, beta... khana kha le."
 4. (3 s) YOU (grey, small): "Coming."
 5. (6 s) The phone buzzes. Full-screen text message, held on screen:
       Mummy: "Reached Mausi's. Won't be back till tomorrow. Eat something."
 6. (8 s) Black. Footsteps on the stairs. Slow. They stop outside the door.
    It is not Mom. It is not Vikram. Silence.
 7. (6 s) Centre text: "Nani never asked you to stay. Something else did."
 8. End card: "ENDING 4 OF 4: LATER". Save "LATER".

Variant, cause 'presence_doom':
 1. (8 s) The Hollow manifested (already played in the room; it was the
    full JUMP SCARE 2 only if it was the first manifestation).
    Your phone begins playing #8 by itself. Same audio as beat 1 above.
 2. Continue from beat 2 above (skip the "steps out" description; it is
    already in front of you).

## 8. End card and replay

End card shows:
  - the ending title and number
  - "Endings found: n of 4" from localStorage
  - buttons: PLAY AGAIN (reset all state, go to HeadphoneGate) and TITLE
  - after all 4 found, a small line: "Thank you for listening."

## 9. Test matrix for endings (all must pass in Vitest + manual)

  1. Press PLAY #8 NOW at any time                    -> LATER
  2. Presence reaches 100                             -> LATER
  3. Hollow manifests, player stays 5 s               -> LATER
  4. Hollow manifests, player leaves in time          -> no ending; Presence 75
  5. Vikram catches the player (collision)            -> CAUGHT
  6. Noise 100 with Vikram within 200 px, not hidden  -> CAUGHT
  7. Battery 0 and 25 s pass (call not connected)     -> CAUGHT (dead_air)
  8. Battery 0 after call connected                   -> no change
  9. Full run, Presence 20 at ETA 0                   -> EAT_PROPERLY
 10. Full run, Presence 70 at ETA 0                   -> STATIC
 11. Caught during corner event                       -> not possible
 12. LATER and CAUGHT same frame                      -> LATER
 13. Tape taken, battery 2.5, call never connected    -> dead-air timer starts
 14. Epilogue chooses text by physical evidence 5, 3, 0
