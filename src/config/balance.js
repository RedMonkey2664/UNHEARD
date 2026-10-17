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
    outlineDistOn: 120     // torch on: hotspot hint outlines (Hotspot hints setting)
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
    whisperNoise: 15       // noise added when a whisper lands during a search
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
    niceEndingMaxPresence: 59   // Presence <= this -> EAT_PROPERLY
  },

  assist: { noiseMult: 0.6, vikramSpeedMult: 0.85, costMult: 0.8 },

  memory: { beatHoldMs: 5000, skipAppearsAfterMs: 4000 },

  vm: { previewSec: 3 }
};
