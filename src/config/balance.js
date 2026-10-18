// Every tunable number. Copied from docs/03 section 1: change the doc first.

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
    torchDrainPerSec: 0.06,      // eased from 0.08 (tuning table)
    playCost: 6,           // VM1,2,3,4,6,7
    playCostLong: 12,      // VM5 only
    wrongFixCost: 3,
    callCost: 2,
    callMinBattery: 3,
    deadAirDoomSec: 35     // after battery hits 0, Vikram finds you
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
    hideFoundAt: 50,       // noise at which a hidden player is found on check
    callStartMax: 40,      // noise must be below this to start the call
    callFailAt: 60,        // noise at or above this while connecting drops the call
    rise: { walk: 11, sneak: 4, torch: 4, voicemail: 7, puzzle: 5 }, // per sec
    spike: { interact: 6, wrongFix: 10, door: 8, wrongCode: 6 },      // instant
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
    sightTorchOn: 440,     // sees an unhidden player within this distance
    sightTorchOff: 130,    // ...or within this if torch is off
    seenHidingDist: 210,   // if closer than this when you hide, he saw you
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
      2: { away: 40, speed: 100, dwell: 1.0, route: 'A' },
      3: { away: 25, speed: 112, dwell: 1.2, route: 'A' },
      4: { away: 15, speed: 125, dwell: 1.3, route: 'B' },
      5: { away: 0,  speed: 145, dwell: 0.6, route: 'HUNT' }
    },
    routes: {              // [room, stand-x, dwell seconds]
      A: [['LIVING', 450, 6], ['KITCHEN', 420, 6], ['BEDROOM', 400, 8]],
      B: [['BEDROOM', 400, 8], ['KITCHEN', 420, 6], ['LIVING', 450, 6]]
    }
  },

  presence: {
    max: 100,
    rise: { wrongFix: 7, replay: 8, skipMemory: 15,
            idleDarkPer10s: 1, callFail: 4 },
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
    warnLeadSec: 3.5,      // lamp flicker before Vikram enters your room
    warnLeadSecAssist: 4,
    ng2Sec: 8,             // doorway figure visible time
    ng3WindowSec: 30,      // reflection only if player enters Living within this
    ng4Dist: 120,          // chai cup offer distance from the player
    ng4FadeSec: 12         // offer fades if ignored this long
  },

  hints: { hint1Sec: 60, hint2Sec: 120 },  // seconds the current VM is damaged

  final: {
    policeEtaSec: 60,      // eased from 75 (tuning table)
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

  audio: {                         // mix levels (docs/07 s8.4), in dB
    voicemailDb: -6,
    barkDb: -9,
    footstepDb: -8,                // Vikram, at 0 distance
    playerStepDb: -14,             // player steps: softer than his
    whisperDbAt60: -18,
    whisperDbAt100: -8,
    ambienceDb: -24,
    musicDb: -20,
    eerieDb: -22,                  // low eerie bed under the whole game and the title
    stingerDb: -6,
    stingerDbReduced: -12,         // with Reduce flash
    duckAmbience: 0.4,             // multipliers while a voice plays
    duckMusic: 0.25,
    heartbeatMax: 0.8,             // heartbeat volume = noise/100 x this
    awayBarkGain: 0.3,             // 'away' barks through the front door
    lowBatteryToneEvery: 20,       // seconds, below 15 percent
    fadeSec: 0.4,                  // loop fades and ducking smoothing
    rainDb: -18,                   // VM3 rain loop while windows are open
    radioStaticDb: -12,            // radio dial static at full
    radioStaticFloor: 0.15,        // static level right on 94.3
    hiddenMuffle: 0.5,             // ambience multiplier while hidden
    sneakStepGain: 0.5,            // player steps while sneaking
    sirenMinGain: 0.1,             // siren level when it first fades in
    smallSfxGain: 0.5,             // whistles, operator, low-battery tone
    foreshadowGain: 0.15,          // distant stair steps after VM1
    foreshadowStepMs: 600,
    whistleGapMs: 900
  },

  prologue: {                      // docs/05 section 7
    lineSec: 3,                    // each prologue line
    momTextAtSec: 3,               // after the fade into the Hall
    momTextHoldSec: 6,             // auto-open time (fair-play rule: >= 6)
    hintSec: 4,
    objectiveSec: 5
  }
};
