# 03 - Systems and balance (source of truth for numbers)

All numbers live in src/config/balance.js. Change numbers there only.

## 1. balance.js (copy as is)

```js
export const BALANCE = {
  world: { width: 960, height: 540, floorY: 430,
           walkMinX: 30, walkMaxX: 930 },  // player x bounds in every room

  player: {
    walkSpeed: 130,        // px per second
    sneakSpeed: 65,
    interactRange: 70,     // px from hotspot x
    hideRange: 80,         // px from hide spot x
    doorFadeSec: 0.4       // player door transition fade
  },

  battery: {
    start: 100,
    torchDrainPerSec: 0.08,
    playCost: 6,           // VM1,2,3,4,6,7
    playCostLong: 12,      // VM5 only
    wrongFixCost: 4,
    callCost: 2,
    callMinBattery: 3,
    deadAirDoomSec: 25     // after battery hits 0, Vikram finds you
  },

  torch: {
    radius: 180,
    dimGlowRadius: 40,
    dimGlowAlpha: 0.25,
    darknessAlpha: 0.96,
    flickerJitter: 25,
    blackoutSec: 0.3,      // Presence >= 60 blackout length
    blackoutEvery: [20, 35],// random seconds between blackouts
    outlineDistOff: 80,    // torch off: hotspot outlines within this (always)
    outlineDistOn: 120,    // torch on: hotspot hint outlines (Hotspot hints setting)
    flickerEvery: [0.15, 0.6] // Presence >= 30: seconds between radius jitters
  },

  tint: {                          // warm-to-cold grade by Presence (docs/02 s8)
    warm: 0xFFD79A, warmAlpha: 0.10,
    cold: 0x4FD1C5, coldAlpha: 0.30,
    updateSec: 0.25
  },

  noise: {
    max: 100,
    investigateAt: 60,
    investigateAtHunt: 40,
    catchAt: 100,
    catchDist: 200,        // noise catch only if Vikram is this close, same room
    hideFoundAt: 40,       // noise at which a hidden player is found on check
    callStartMax: 40,      // noise must be below this to start the call
    callFailAt: 60,        // noise at or above this while connecting drops the call
    rise: { walk: 14, sneak: 5, torch: 6, voicemail: 8, puzzle: 6 }, // per sec
    spike: { interact: 8, wrongFix: 12, door: 10, wrongCode: 8 },     // instant
    decayIdle: 8,          // per sec when nothing is adding noise
    decayHiddenSameRoom: 4,// per sec when hidden and Vikram is in your room
    prox: {                // multiplier on rise and spike
      sameClose: 1.5,      // same room, distance < closeDist
      sameMid: 1.0,        // same room, distance < midDist
      sameFar: 0.7,        // same room, farther
      adjacent: 0.35,      // Vikram in a room one door away (via the Hall)
      elsewhere: 0         // Vikram AWAY or farther
    },
    closeDist: 150,
    midDist: 400
  },

  vikram: {
    sightTorchOn: 520,     // sees an unhidden player within this distance
    sightTorchOff: 130,    // ...or within this if torch is off
    seenHidingDist: 260,   // if closer than this when you hide, he saw you
    catchDist: 45,
    chaseMult: 1.3,
    searchTime: 6,
    searchTimeHunt: 4,
    hideCheckTime: 1.5,    // seconds per hide spot checked
    hideCheckRadius: 250,
    investigateTimeout: 10,
    noiseAfterSearch: 30,  // noise is set to this when a search ends
    doorTime: 1.0,         // seconds spent passing through a door
    enterX: 880,           // front door x in the Hall
    barkCooldown: 12,
    keyWarningSec: 3,      // key-in-the-lock warning before ENTERING ends
    huntReenterSec: 2,     // re-entry with a door slam when Hunt starts while AWAY
    investigateRefreshSec: 1, // target refresh while noise stays above threshold
    awayBarkRange: 150,    // 'away' barks heard in the Hall within this of x 880
    acts: {
      2: { away: 30, speed: 110, dwell: 1.0, route: 'A' },
      3: { away: 18, speed: 125, dwell: 1.2, route: 'A' },
      4: { away: 10, speed: 140, dwell: 1.3, route: 'B' },
      5: { away: 0,  speed: 160, dwell: 0.6, route: 'HUNT' }
    },
    routes: {              // [room, stand-x, dwell seconds]
      A: [['LIVING', 450, 6], ['KITCHEN', 420, 6], ['BEDROOM', 400, 8]],
      B: [['BEDROOM', 400, 8], ['KITCHEN', 420, 6], ['LIVING', 450, 6]]
    }
  },

  presence: {
    max: 100,
    rise: { wrongFix: 10, replay: 10, skipMemory: 20,
            idleDarkPer10s: 2, callFail: 5 },
    fall: { memoryDone: 5, naniTouch: 10 },
    thresholds: { flicker: 30, naniHelp: 45, whisper: 60, manifest: 90, doom: 100 },
    idleDarkAfter: 5,      // seconds idle in the dark before accrual starts
    manifestSec: 5,        // time to leave the room when the Hollow manifests
    manifestResetTo: 75,
    maxNaniTouches: 3,
    naniOfferCooldown: 90, // seconds between chai offers
    whisperEvery: [20, 35],// random seconds between ambient whispers
    whisperNoise: 15,      // noise added when a whisper lands during a search
    shapeEvery: [6, 12],   // Presence >= 60: seconds between Hollow-shape glimpses
    shapeSec: 0.8,         // how long a glimpse lasts
    js1Sec: 0.4,           // reflection scare (docs/04 s5)
    js3Sec: 0.5            // TV face flash (docs/05 s3)
  },

  nani: {
    warnLeadSec: 2.5,      // lamp flicker before Vikram enters your room
    warnLeadSecAssist: 4,
    ng2Sec: 8,             // doorway figure visible time
    ng3WindowSec: 30,      // reflection only if player enters Living within this
    ng4Dist: 120,          // chai cup offer distance from the player
    ng4FadeSec: 12         // offer fades if ignored this long
  },

  hints: { hint1Sec: 90, hint2Sec: 180 },  // seconds the current VM is damaged

  final: {
    policeEtaSec: 75,
    cornerAtEta: 8,
    callConnectSec: 6,
    sirenAtEta: 20,
    tapeMomentSec: 8,      // scripted tape moment (docs/06 s1.2)
    endingDelaySec: 0.6,   // pause between ending:trigger and the ending scene
    niceEndingMaxPresence: 59   // Presence <= this -> EAT_PROPERLY
  },

  assist: { noiseMult: 0.6, vikramSpeedMult: 0.85, costMult: 0.8 },

  memory: { beatHoldMs: 5000, skipAppearsAfterMs: 4000,
            fadeMs: 600,           // fade between beats (docs/07 s11)
            endPauseMs: 1000 },    // breath of silence before the room returns

  vm: { previewSec: 3 },

  puzzles: {                       // answers and ranges (section 10)
    radio: { min: 88.0, max: 108.0, step: 0.1, solution: 94.3, tolerance: 0.1,
             nearMhz: 1.0 },       // static quietens within this of the answer
    cooker: { min: 0, max: 9, solution: 4 },
    cardOrder: ['CARD_A', 'CARD_B', 'CARD_C'],
    windowOrder: ['KITCHEN', 'BEDROOM', 'LIVING'],
    lockerCode: '0614'
  },

  beats: { radioTuneSec: 3, windowReopenSec: 4 },   // docs/05 section 3

  footsteps: {                     // Vikram's spatial footsteps (docs/07 s8.5)
    sameFalloff: 700,              // px over which same-room volume falls
    sameMin: 0.45,                 // same-room volume at the far end
    panSpan: 480,                  // px of offset for full pan
    panMax: 0.9,
    adjacentVolume: 0.35,
    adjacentVolumeNoFilter: 0.25,
    adjacentPan: 0.7,              // per room step (LIVING -1, KITCHEN 0, BEDROOM +1)
    stepIntervalAt110: 0.55        // seconds between steps at speed 110
  },

  prologue: {                      // docs/05 section 7
    lineSec: 3,                    // each prologue line
    momTextAtSec: 3,               // after the fade into the Hall
    momTextHoldSec: 6,             // auto-open time (fair-play rule: >= 6)
    hintSec: 4,
    objectiveSec: 5
  }
};
```

## 2. Acts (derived, never stored independently)

completed = number of voicemails with status 'done' (memory finished)
tape = flags.tapeTaken

```
act = 5  if tape
act = 4  if completed == 7 and not tape
act = 3  if completed == 6
act = 2  if completed >= 2 and completed <= 5
act = 1  otherwise (completed 0 or 1)
```

Events tied to completed count (fire once, on memory:end):
  completed == 1  foreshadow: distant footsteps on the stairs, then silence
  completed == 2  Vikram enters (key in the lock, 3 s warning), Act 2 begins
  completed == 4  temptation appears (whisper + PLAY #8 NOW button)
  completed == 6  Mom's second text arrives, Act 3 begins
  completed == 7  Act 4 begins, locker unlocks, objective changes

## 3. Battery

```
battery = clamp(battery, 0, 100)

per second while torch ON and not hidden:  battery -= torchDrainPerSec
playback: cost is spent linearly across the voicemail duration
          perSecond = cost / durationSec   (only while playing, not paused)
wrong fix: battery -= wrongFixCost (instant)
call connect: battery -= callCost at the moment the call connects
all costs multiplied by assist.costMult if Assist is on
```

If battery reaches 0:
  - emit battery:zero, torch forced off permanently, phone shows a dead screen
  - playback in progress stops (voicemail stays 'fixed', not played)
  - if the call has NOT been placed: start flags.deadAirTimer = 25 s and put
    Vikram into HUNT right away. If he is AWAY or has not entered yet (Act 1),
    he re-enters with a door slam within vikram.huntReenterSec (2 s), no key
    warning. When the timer ends -> ending CAUGHT with cause 'dead_air'.
  - if the call HAS connected: nothing else changes (the call stays up).

The same 25 s dead-air timer also starts if the tape has been taken, the call
is not connected, and battery < callMinBattery (3). Otherwise the player would
be stuck with no way to call.

Budget check (so the numbers make sense):
  Voicemails: 6 x 6 + 12 = 48
  Call: 2
  Mandatory total: 50
  Left for torch and mistakes: 50
  Torch: 50 / 0.08 = 625 seconds of torch (about 10 minutes)
  Each wrong fix costs 4 (so 3 mistakes = 12 = 150 s less torch)
  Target: a median player ends with 8 to 15 percent left.

## 4. Noise (what Vikram can hear right now)

Noise is a 0 to 100 bar. It only rises when something noisy is happening AND
Vikram is close. When he is away, noise decays.

Proximity factor (recomputed each frame):

```js
function proximity(player, vikram) {
  if (vikram.state === 'AWAY') return prox.elsewhere;          // 0
  if (vikram.room === player.room) {
    const d = Math.abs(vikram.x - player.x);
    if (d < closeDist) return prox.sameClose;                  // 1.5
    if (d < midDist)   return prox.sameMid;                    // 1.0
    return prox.sameFar;                                       // 0.7
  }
  if (isAdjacent(vikram.room, player.room)) return prox.adjacent; // 0.35
  return prox.elsewhere;                                       // 0
}
```

Adjacent means: exactly one of the two is the Hall and the other is a room
off the Hall (one door apart). Two different non-Hall rooms are "elsewhere".
  HALL <-> LIVING/KITCHEN/BEDROOM   adjacent
  LIVING <-> KITCHEN etc.           elsewhere

Noise tick:

```js
function tickNoise(s, dt, prox) {
  let rate = 0;
  if (s.player.moving) rate += s.player.sneaking ? R.sneak : R.walk;
  if (s.torchOn && !s.player.hidden) rate += R.torch;
  if (s.phone.playing && !s.phone.paused) rate += R.voicemail;
  if (s.ui.puzzleOpen || s.flags.callConnecting) rate += R.puzzle;
  rate *= prox * (assist ? assist.noiseMult : 1);

  if (rate > 0) {
    s.noise = Math.min(max, s.noise + rate * dt);
  } else {
    const decay = (s.player.hidden && vikramInSameRoom) ? decayHiddenSameRoom
                                                         : decayIdle;
    s.noise = Math.max(0, s.noise - decay * dt);
  }
}

function addSpike(s, kind, prox) {          // interact, wrongFix, door, wrongCode
  s.noise = Math.min(max, s.noise + SPIKE[kind] * prox * assistMult);
}
```

Spikes fire on: examining/picking up (interact), a wrong fix, passing through a
door, entering a wrong locker code.

What noise does:
  - noise >= investigateAt (60) AND Vikram in PATROL and prox > 0
      -> Vikram goes to INVESTIGATE
  - in Act 5 (Hunt) investigateAt is 40
  - noise >= catchAt (100) AND Vikram in the same room within catchDist (200 px)
      AND player
      not hidden -> CAUGHT
  - noise >= hideFoundAt (40) when Vikram checks your hide spot -> found

## 5. Presence (the Hollow, hidden from the player)

Starts at 0. Not shown on screen. Shown indirectly (flicker, tint, whispers).

Rises:
  wrong fix            +10
  replaying a voicemail already done, +10 (replay is allowed but costs battery)
  skipping a memory    +20
  idle in the dark     +2 per 10 s (only after 5 s idle, torch OFF, not hidden,
                       not playing, no puzzle open, not in a cutscene)
  failed call          +5
Falls:
  memory finished (not skipped)  -5
  touching Nani's chai cup       -10 (max 3 touches per game)

Clamp 0 to 100.

Thresholds (each fires every time Presence crosses it upward; reset on drop):
  30  flicker   torch radius jitters. First Nani doorway glimpse.
  45  naniHelp  a warm chai cup offering appears near the player
                (if touches < 3 and cooldown 90 s is over)
  60  whisper   Hollow whispers mixed into voicemails and at searches.
                Nani's lamp warning stops working.
  90  manifest  the Hollow steps into the room. Player has 5 seconds to leave
                the room through a door. Hiding does NOT help.
                If they leave: Presence set to 75, Hollow fades.
                If not: Presence = 100.
  100 doom      ending LATER, cause 'presence_doom'.

Jump-scare cap: the FIRST manifestation (flags.manifestCount == 0) is the full
JUMP SCARE 2 (face, stinger, flash). Every later manifestation is sound and the
dark shape only: no face flash, no stinger flash. The 5 s rule is unchanged.

Ambient whispers at Presence >= 60: one random line from the whisper list
(docs/05) every 20 to 35 seconds. If a whisper lands while Vikram is
searching near the player's hide spot, noise +15.

## 6. Vikram AI

States:
  AWAY         outside the flat on a call. Timer = acts[act].away seconds.
  ENTERING     key in the lock (keyWarningSec, 3 s), door opens, appears at
               Hall x = 880.
  PATROL       walks the route, dwells at each stop.
  INVESTIGATE  walks to the last known noise or sight position.
  SEARCH       stands there looking, checks nearby hide spots.
  CHASE        has seen you. Runs at speed x 1.3.
  CAUGHT       reached you. Ends the run.
  LEAVING      walks back to the front door, exits, then AWAY.
  HUNT         Act 5 mode, see below.

State diagram:

```
 AWAY --(timer ends)--> ENTERING --> PATROL --(route done)--> LEAVING --> AWAY
                                       |  ^
                  noise >= threshold   |  |  search over or timeout
                                       v  |
                                   INVESTIGATE --> SEARCH
                                       |
                    sees player        v
                 (from PATROL, INVESTIGATE or SEARCH)
                                     CHASE --(within 45 px)--> CAUGHT
                                       |
                    player breaks line of sight through a door
                                       v
                                  INVESTIGATE (last seen)
```

Movement model:
  - Rooms connect only through the Hall. Every room has one door to the Hall.
  - Going from room A to room B: walk to A's door x, spend doorTime (1.0 s)
    passing through, appear in the Hall at the matching door x, walk to B's
    door x, doorTime, appear in B at its door x, walk to the stand x.
  - Speed in px/s comes from acts[act].speed (x chaseMult in CHASE, x assist
    speed mult if Assist on).
  - Vikram is a point with a facing direction (for drawing only).

Route (Acts 2 to 4):
  enter at Hall x = 880
  for each [room, standX, dwell] in routes[route]:
      walk to room, stand at standX, dwell for dwell x acts[act].dwell seconds
      (during the dwell he pauses, turns, and checks the room; barks play)
  walk to Hall x = 880, state LEAVING, exit, state AWAY for acts[act].away s
  Route A is used in Acts 2 and 3. Route B (reverse order) in Act 4.
  A full patrol takes about 60 seconds at Act 2 speed.

Senses:
  SIGHT: Vikram sees the player if
         same room AND player not hidden AND
         ( (torchOn AND dist < 520) OR dist < 130 )
         -> CHASE (emit vikram:spotted)
  HEARING: noise >= threshold with prox > 0 -> INVESTIGATE, target = player's
           position, refreshed once per second while noise stays above the
           threshold and the player is not hidden.

INVESTIGATE:
  - walk to the target (through doors if needed)
  - if not arrived within 10 s -> SEARCH where he is
  - on arrival -> SEARCH
  - if player seen on the way -> CHASE

SEARCH (look-around time searchTime = 6 s, or 4 s in Hunt):
  - Vikram stands at the target and looks around for searchTime seconds.
  - THEN, for each hide spot in the same room within hideCheckRadius (250 px)
    of him, nearest first, he walks to it and checks it for 1.5 s. Walking and
    checking time is extra, on top of searchTime.
  - In Hunt the radius is ignored: he checks every hide spot in the room.
  - When he checks the spot where the player is hidden:
        found if (vikram.seenHiding) OR (noise >= 40)
        otherwise he moves on
  - At the end: noise set to 30 (so you cannot instantly repeat), state back to
    PATROL (resuming the route where it was) or, in Hunt, picks the next room.

CHASE:
  - runs straight at the player at speed x 1.3
  - CAUGHT when distance < 45 px (ending CAUGHT, cause 'caught')
  - if the player passes through a door: Vikram runs to that door, goes
    through (doorTime), then INVESTIGATE with target = last seen x
  - if the player reaches a hide spot and presses HIDE:
        seenHiding = (distance to Vikram < 260 AND same room)
        if seenHiding he goes straight to that spot and finds you
        otherwise he does not know where you went -> INVESTIGATE then SEARCH

Collision catch also applies in PATROL and INVESTIGATE: if he ends up within
45 px of an unhidden player, CAUGHT.

HUNT (Act 5, after the tape is taken):
  - no AWAY time, no LEAVING
  - picks rooms in a shuffled order, checks every hide spot in each room
    regardless of hideCheckRadius (4 s look-around), speed 160, dwell x 0.6
  - investigateAt noise is 40
  - barks change to the "hunt" set (docs/05)
  - if Vikram was AWAY when the tape was taken, he re-enters within
    huntReenterSec (2 s) with a door slam (no keyWarningSec key warning)

Frozen during memory scenes: Vikram state timers, positions and noise are
paused while MemoryScene is open. The player cannot be caught then.

Nani's warning (only if Presence < 60):
  When Vikram's next step will bring him into the player's CURRENT room,
  nani.warnLeadSec (2.5 s) before he arrives, that room's lamp flickers once
  and a soft "tick" plays. In Assist mode the lead time is
  nani.warnLeadSecAssist (4 s).

## 7. Hiding

Hide spots (positions in docs/04). Pressing HIDE within 80 px of a hide spot:
  - player.hidden = true, hideSpotId set
  - torch forced off, player sprite hidden, vignette on
  - player cannot walk. Can open the phone. Can press UNHIDE any time.
  - Noise rules while hidden: decay 4/s if Vikram is in the same room,
    otherwise 8/s. Playing a voicemail or opening a puzzle while hidden still
    adds noise.
  - Presence idle-dark accrual does NOT count while hidden.
Unhiding while Vikram is in the same room and within 130 px (torch off) or
520 px (torch on) means he sees you.

## 8. Torch

  - Toggle with a button (mobile) or F (desktop).
  - ON: radius 180. Drains battery. Adds noise (6/s x proximity). Lets Vikram
    see you from 520 px.
  - OFF: only a 40 px dim glow around the player. Hotspots within 80 px show a
    faint outline so the player can still find things in the dark.
  - Forced OFF when: hidden, or battery is 0.
  - At playback start the torch switches OFF automatically (the phone glow
    replaces it). The player may turn it on again, but the player is locked in
    place during playback anyway.

## 9. Voicemail flow (status machine)

Statuses per VM: locked -> damaged -> fixed -> playing -> memory -> done

  locked    not yet reachable. Greyed in the phone. Only VM1 starts 'damaged'.
  damaged   the current VM, not yet fixed. PREVIEW works (free, 3 s). PLAY
            is disabled. FIX is available.
  fixed     PLAY enabled. (VM7 starts 'fixed': it has no damage.)
  playing   locks the player in place. Battery drains per second. Can PAUSE.
  memory    MemoryScene runs (Vikram frozen).
  done      next VM becomes 'damaged' (or 'fixed' for VM7).

Gating: only the lowest-numbered not-done VM can be previewed, fixed or
played. Tapping a locked VM shows a toast: "Not yet."

Replay: a done VM can be replayed from the phone. It costs the normal battery
cost, adds Presence +10, and shows no memory scene.

Preview: free, plays the first 3 seconds of the damaged audio. Emits
vm:preview. Does not add Presence.

Pausing: PAUSE stops battery drain and noise. The player may then hide. When
noise >= 60 the phone shows a hint "Pause and hide." (It reacts to noise, not
to Vikram's hidden state, so the AI state is never revealed.)

Memory skip: the SKIP button appears 4 s into a memory scene. Skipping jumps to
the end, Presence +20 (instead of -5), and marks memorySkipped = true.

## 10. Fix types (validators in systems/fixPuzzles.js)

  RADIO     VM1. A dial from 88.0 to 108.0, step 0.1. Solution 94.3 (+-0.1).
  CARD      VM2. Three torn pieces in the Bedroom. Assemble in order
            CARD_A, CARD_B, CARD_C ("Happy", "Birthday,", "beta.").
  WINDOWS   VM3. Close the three windows in the order KITCHEN, BEDROOM,
            LIVING (clue: umbrella tag in the Hall).
  COOKER    VM4. Set the whistle counter to 4 (clue: notebook page 1).
  NOTE      VM5. Use GLASSES on the note on the Bedroom nightstand.
  EARPHONES VM6. In the phone, FIX opens an item picker of tools. The right
            item is EARPHONES.
  NONE      VM7. No fix.

Wrong fix (any type): battery -4, noise spike (wrongFix) x proximity,
Presence +10, a failure sound, stats.wrongFixes++.
Wrong fix resets that puzzle's partial state (for WINDOWS: all three windows
reopen; for CARD: pieces return to the tray).
NOTE without GLASSES: "Too small to read." No penalty.

Fix success: a clean-up sound, the VM becomes 'fixed', evidence flags for
physical items are NOT granted yet (they are granted per docs/04).

## 11. Temptation

When completed == 4 and memory ends:
  - Hollow whisper H2: "Play the last one first, beta. Why wait, beta?"
  - the phone gets a permanent row at the bottom of VOICEMAIL: PLAY #8 NOW
    (pulsing teal), saves battery, "breaks the rules"
  - pressing it: temptation:pressed, endingResolver -> LATER, cause
    'temptation'. Run ends.
Fair-play clue: Mom's first text said she is away. The "Beta, khana kha le"
call in the LATER ending is therefore not Mom. The Hollow overuses "beta".

## 12. Phone rules

  - Opening the phone does not pause the game. It is real time.
  - Tabs: VOICEMAIL, MESSAGES, NOTES. CALL appears after the tape is taken.
  - NOTES shows: the current objective, found evidence, the locker code once
    read.
  - The phone screen glow does not make noise by itself.
  - While the phone is open, the player can still walk (tap in the room area
    above the phone), except during playback.

## 13. Assist mode

  noise rise and spikes x 0.6
  Vikram speed x 0.85
  battery costs (playback, wrong fix, call; not torch drain) x 0.8
  Nani's lamp warning lead time nani.warnLeadSecAssist (4 s)
Toggle in the title screen settings.

## 14. Worked example: Act 2 timing

Act 2 patrol (speed 110): about 34 s of walking (3720 px) plus 20 s of dwell
plus six doors at 1 second: roughly 60 seconds. Then 30 seconds AWAY. A player
who has already found the clue can fix (about 5 s) and play (14 s) a voicemail
inside the AWAY window. VM3 to VM6 are all played in Act 2.
In Act 3 (VM7, 11 s) the window shrinks to 18 s and the patrol is faster. A
player who does not start playback the moment he leaves cannot finish in one
window, so they must PAUSE, hide, and resume. That is intended.
In Act 4 there is no playback left. The 10 s window (route B) is for the walk
to the Kitchen locker and entering the code.

## 15. Tuning table (symptom -> knob)

  Too easy to dodge Vikram         raise vikram.acts[n].speed, lower away
  Players get caught unfairly      lower sightTorchOff, lower speed, lower
                                   seenHidingDist, check footstep audio
  Battery runs out too often       lower torchDrainPerSec to 0.06
  Never reach the Hollow           raise rise.wrongFix or raise idleDarkPer10s
  Hollow shows up too fast         raise thresholds.whisper or raise fall values
  Memory scenes get skipped        shorten beatHoldMs to 4000 or raise
                                   skipAppearsAfterMs
  Final act too easy               raise policeEtaSec to 90 (longer to survive)
  Final act too hard               lower policeEtaSec to 60
