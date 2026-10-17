# 02 - Tech architecture

## 1. Stack

  Phaser 3 (latest 3.x)        game framework (scenes, input, audio, render)
  Vite                         dev server + production build
  Vitest                       unit tests for pure logic
  JavaScript ES modules        no TypeScript, no UI framework

package.json (shape)
  "type": "module"
  scripts: dev, build, preview, test
  dependencies: phaser
  devDependencies: vite, vitest

vite.config.js
  base: './'            (so itch.io and GitHub Pages subfolders work)
  build.outDir: 'dist'
  assetsInlineLimit: 0  (keep audio and images as separate files)

## 2. Display and scaling

  Logical size: 960 x 540 (landscape, 16:9)
  Phaser.Scale.FIT with autoCenter CENTER_BOTH
  Portrait phones: show a full-screen "Rotate your phone" overlay and pause.
  Touch and mouse both supported (Phaser pointer events only).
  Minimum tap target: 44 x 44 CSS px after scaling. Scale hit areas up if the
  canvas is scaled below 1.0.
  Background colour of the page: #050708.

## 3. Folder structure

unheard/
  CLAUDE.md
  docs/                              (this pack)
  index.html
  package.json
  vite.config.js
  public/
    assets/
      img/        bg_hall.png bg_living.png bg_kitchen.png bg_bedroom.png ...
      audio/      voice/ sfx/ amb/ music/
      fonts/      woff2 files (self-hosted)
  src/
    main.js                          Phaser game config, scene list
    config/
      balance.js                     every number (docs/03)
      constants.js                   ids, enums, colour tokens (docs/07)
    data/
      rooms.js                       rooms, doors, hotspots, hide spots
      items.js                       tools and evidence definitions
      voicemails.js                  VM1-VM8 data, lines, memory beats
      texts.js                       messages, barks, whispers, hints
      endings.js                     ending scripts (beat lists)
      assets.js                      asset manifest with fallback durations
    systems/                         PURE LOGIC, no Phaser imports
      eventBus.js
      gameState.js                   createState(), helpers, act derivation
      battery.js
      noise.js
      presence.js
      vikramAI.js
      hideSystem.js
      voicemailFlow.js               gating, fix, play, memory transitions
      fixPuzzles.js                  validators for the 6 fix types
      finalAct.js                    tape, call, police ETA, corner event
      endingResolver.js
    scenes/
      BootScene.js                   preload, fallback textures
      TitleScene.js                  title, content notes, settings
      HeadphoneGateScene.js          "Tap to begin. Wear headphones."
      RoomScene.js                   the world (rooms, player, Vikram)
      UIScene.js                     HUD + phone overlay (runs in parallel)
      MemoryScene.js                 20-second flashback
      EndingScene.js                 plays an ending beat list
      DebugScene.js                  debug panel overlay (dev only)
    entities/
      Player.js  VikramSprite.js  NaniGlimpse.js  HollowEntity.js
      Hotspot.js  HideSpot.js  Door.js
    render/
      DarknessLayer.js               torch mask render texture
      TintLayer.js                   warm-to-cold colour grade
      FlickerController.js           torch flicker + blackouts
    audio/
      AudioDirector.js               voice, sfx, ambience, spatial footsteps
      Subtitles.js
    ui/
      Hud.js  PhoneUI.js  Keypad.js  RadioDial.js  CardAssembler.js
      CounterDial.js  ItemPicker.js  Button.js  Toast.js
    utils/
      math.js  timers.js  rng.js
  tests/
    battery.test.js  noise.test.js  presence.test.js  vikram.test.js
    ending.test.js  voicemailFlow.test.js  fixPuzzles.test.js

## 4. Pure logic versus Phaser

Systems in src/systems/ are plain modules:
  - input: the GameState object, dt in seconds, a small context object
  - output: mutate GameState and emit events on the bus
  - no Phaser, no DOM, no Date.now (time comes from dt)
  - random numbers come from utils/rng.js (seedable, so tests are repeatable)

Scenes and entities:
  - read GameState each frame to draw
  - translate input into system calls (for example voicemailFlow.attemptFix)
  - subscribe to events to play audio, shake the screen, show toasts

## 5. GameState shape

```js
{
  clock: { runSeconds: 0 },                 // real seconds since start
  act: 1,                                   // derived, see act rules in docs/03
  battery: 100,
  noise: 0,
  presence: 0,
  torchOn: false,

  player: {
    room: 'HALL', x: 560,                   // ROOMS.HALL.start.x (docs/04)
    moving: false, sneaking: false,
    hidden: false, hideSpotId: null,
    locked: false,                          // true during playback/memory/final cinematics
    facing: 1
  },

  vikram: {
    state: 'AWAY',                          // see docs/03
    room: null, x: 0,
    stateTimer: 0, awayTimer: 0,
    routeIndex: 0, routeId: 'A', cycle: 0,
    target: null, lastSeen: null,
    seenHiding: false, doorTimer: 0,
    path: [],                               // ops: {walk: x} | {door: room, toX}
    phase: null,                            // PATROL walk|dwell, SEARCH look|goto|check
    searchSpots: [],                        // hide spot ids left to check
    refreshTimer: 0,                        // INVESTIGATE target refresh
    huntQueue: [],                          // HUNT: rooms left in the shuffled order
    moving: false, facing: -1
  },

  phone: {
    open: false, tab: 'VOICEMAIL',
    playing: false, paused: false,
    playingId: null, playPos: 0,
    replay: false                            // current playback is a replay
  },

  voicemails: {                              // keyed 1..7
    1: { status: 'damaged', playCount: 0, memorySkipped: false },
    // status: locked | damaged | fixed | playing | memory | done
    ...
  },

  ui: { puzzleOpen: false },                 // a puzzle modal is open

  inventory: { tools: [], evidence: [] },    // tools: GLASSES, EARPHONES only
  cardPieces: [],                            // collected CARD_A/B/C (not tools)
  windowsClosed: [],                         // order closed, for the VM3 puzzle
  cookerWhistles: 0,
  flags: {
    arrivalShown: false, momText1Sent: false, momText2Sent: false,
    foreshadowDone: false, vikramEntered: false,
    temptationShown: false, temptationPressed: false,
    readUmbrellaTag: false, readCalendar: false, readNotebookPage1: false,
    cardAssembled: false,                    // VM2 card fixed (rooms.js uses it)
    livingWindowReopened: false,             // WINDOW_REOPENS beat has fired
    lockerOpened: false, tapeTaken: false,
    callConnecting: false, callConnected: false, policeEta: null,
    callConnectTimer: 0,                     // seconds into the 6 s connect
    deadAirTimer: null, manifestTimer: null,
    manifestCount: 0,                        // full JS2 only when this is 0
    manifestRoom: null,                      // room the Hollow manifested in
    cornerActive: false,                     // corner event cinematic running
    tapeMoment: null,                        // seconds left in the 8 s tape moment
    sirenStarted: false,                     // ETA <= 20 siren cue fired
    caught: false, endingId: null, endingCause: null
  },
  presenceState: {
    idleDarkTimer: 0,                        // seconds idle in the dark
    armed: { flicker: true, naniHelp: true, whisper: true,
             manifest: true, doom: true },   // re-arm on drop below threshold
    nextWhisperAt: null,                     // runSeconds of next ambient whisper
    ng2Shown: false                          // NG2 fires on first crossing only
  },
  hints: { currentVm: 1, damagedSeconds: 0 },// for hint1 / hint2 timers
  nani: { touchesUsed: 0, lastOfferAt: -999,
          offer: null,                       // NG4 chai cup: {room, x, left}
          ng3Until: null },                  // NG3 reflection window end
  messages: [],                              // {from, text, time}
  stats: { wrongFixes: 0, replays: 0, skippedMemories: 0, hides: 0,
           investigations: 0, evidenceCount: 0 },
  settings: { assist: false, reduceFlash: false,
              volMaster: 1, volVoice: 1, volSfx: 1,
              hotspotHints: true, vibration: false, subtitleSize: 'M' },
  debug: { godMode: false }                  // debug panel only
}
```

## 6. Frame update order (RoomScene.update)

  1. Read input; update player intent (move target, torch, sneak, hide)
  2. If a modal is open (memory, ending, final cinematic) -> skip to step 9
  3. Move player (speed from sneak state, blocked while locked)
  4. voicemailFlow.tick(dt)        playback progress, battery drain per second
  5. vikramAI.tick(dt, ctx)        movement, senses, state changes
  6. noise.tick(dt, ctx)           rise, decay, spikes applied
  7. presence.tick(dt, ctx)        idle-dark accrual, threshold events
  8. battery.tick(dt)              torch drain, zero check
  9. finalAct.tick(dt)             call progress, ETA countdown, corner event
 10. endingResolver.check()        immediate-ending causes
 11. Render: room, entities, darkness layer, tint layer, HUD update

Fixed or variable step: variable dt, clamped to 0.05 s maximum to avoid
tunnelling after a tab switch.

## 7. Event bus

A tiny pub/sub in systems/eventBus.js: on(name, fn), off(name, fn),
emit(name, payload). Event names (colon style):

  room:enter {room, from}
  hotspot:interact {id}
  item:added {id, kind}
  fix:attempt {vmId}          fix:success {vmId}       fix:fail {vmId}
  vm:preview {vmId}
  vm:play:start {vmId}        vm:play:pause {vmId}     vm:play:end {vmId}
  memory:start {vmId}         memory:end {vmId}        memory:skip {vmId}
  evidence:added {id}
  noise:changed {value}       noise:spike {kind}
  presence:changed {value}
  presence:threshold {name}   (flicker | whisper | naniHelp | manifest | doom)
  vikram:state {state, prev}  vikram:spotted {}        vikram:bark {id}
  player:hide {spotId, seen}  player:unhide {}
  nani:glimpse {id}           nani:touch {}            nani:warn {room}
  hollow:whisper {id}         hollow:manifest {}
  battery:changed {value}     battery:zero {}
  message:received {id}
  temptation:shown {}         temptation:pressed {}
  act:changed {act, prev}
  final:start {}              call:connecting {}       call:failed {}
  call:connected {}           police:arrive {}         corner:start {}
  ending:trigger {id, cause}

  UI and debug events (scene to scene only, systems never listen):
  ui:torch {}  ui:sneak {}  ui:phone {}      HUD button taps
  ui:subtitle {who, text, sec}               show a subtitle line
  ui:toast {text}                            show a toast
  debug:teleport {room}                      debug panel (dev only)
  ui:phone:show {tab, sec}                   open the phone on a tab for sec
  ui:objective {}                            show the objective line

  Gameplay events added in Stage 2:
  puzzle:open {type}          RADIO | CARD | COOKER | NOTE | EARPHONES | KEYPAD
  windows:open {}             VM3 windows swing open (or reopen after a wrong order)
  window:closed {id}          a window was closed during the VM3 puzzle
  beat:fire {id}              a small horror beat (docs/05 section 3)
  locker:wrong {}             wrong locker code (noise spike in Stage 3)
  vikram:keyInLock {}         key warning starts (ENTERING)
  vikram:door {room, from}    he passed a door (from/room null = outside)
  vikram:dwell {room}         he stopped at a route stop
  vikram:check {spotId}       he is checking a hide spot
  player:caught {cause}       a catch happened (rules turn it into ending:trigger)
  ui:hide {}                  HIDE / COME OUT tapped
  vikram:doorSlam {}          he is back in at once (battery dead / Hunt)
  vikram:bark {set, index, text}
  presence:doom {}            Presence reached 100
  hollow:fade {}              the player escaped a manifestation
  nani:offerFade {}           an ignored chai cup faded
  tape:start {}               the 8 s tape moment begins
  siren:start {}              ETA reached sirenAtEta
  corner:reached {}           Vikram reached the player in the corner event

## 8. Darkness and torch rendering

Everything in the world (background, objects, player, Vikram, Nani, Hollow)
is drawn UNDER a full-screen darkness layer. HUD and phone are drawn above it.

DarknessLayer:
  - one RenderTexture the size of the canvas (960 x 540)
  - each frame: fill it with colour 0x050708 at alpha darknessAlpha (0.96)
  - erase a radial gradient sprite ('light_mask', generated at boot with a
    canvas gradient) at the player's position:
        torch ON  : scaled to radius torch.radius (180), full strength
        torch OFF : scaled to radius torch.dimGlowRadius (40), alpha 0.25
  - at Presence >= 30 the radius jitters by +-25 px at irregular intervals
  - at Presence >= 60 add total blackouts of torch.blackoutSec (0.3 s) every
    torch.blackoutEvery (20-35) seconds
  - while hidden: torch forced off, plus an extra vignette (see docs/07)
  - Memory scenes and ending scenes do not use the darkness layer

TintLayer:
  - a full-screen rectangle drawn above the darkness layer with MULTIPLY blend
  - colour lerps from warm (0xFFD79A at alpha 0.10) at Presence 0 to cold teal
    (0x4FD1C5 at alpha 0.30) at Presence 100
  - update at most once every 0.25 s

If RenderTexture erase is unavailable on a device, fall back to a Graphics
mask with a gradient texture. Keep both code paths behind one interface.

## 9. Audio architecture (summary; details in docs/07)

AudioDirector wraps Phaser's sound manager.
  - Browsers block audio until a user gesture, so HeadphoneGateScene's tap
    unlocks audio and then starts the game.
  - Channels: voice, sfx, ambience, music, hollowLayer, footsteps.
  - Every play call goes through AudioDirector.play(key, opts). If the asset
    is missing it uses data/assets.js durations and emits the same
    start/end events on a timer. Subtitles still show.
  - Vikram's footsteps are spatial: volume by distance, pan by relative room
    position (docs/07 section 8).
  - Ducking: when voice plays, ambience drops to 40% and music to 25%.

## 10. Asset loading and fallbacks

  - data/assets.js lists every asset key, file path and fallback duration.
  - BootScene tries to load them. A failed load is logged and ignored.
  - If a background image is missing, draw a flat colour rectangle with the
    room name and draw hotspot hit areas as faint outlines (debug aid).
  - Player, Vikram, Nani and Hollow have placeholder rectangles with letters
    (P, V, N, H) so the game is playable with zero art.

## 11. Performance targets

  - 60 fps on a mid-range Android phone (2022 class) in Chrome.
  - Total shipped assets under 20 MB. Voice and ambience as 96 kbps mono.
  - First playable frame under 5 seconds on 4G after the title is shown.
  - One RenderTexture, no per-frame allocations in hot paths.

## 12. Persistence

localStorage keys only:
  unheard.settings   {assist, reduceFlash, volMaster, volVoice, volSfx,
                      hotspotHints, vibration, subtitleSize}
  unheard.endings    ["EAT_PROPERLY", "STATIC", "CAUGHT", "LATER"] (found ones)
Wrap every access in try/catch. The game must work with storage blocked.

## 13. Build and deploy

  npm run build -> dist/
  itch.io: zip the CONTENTS of dist/ (index.html at the zip root), upload as
           HTML5, enable "SharedArrayBuffer" off, set viewport 960 x 540,
           tick "Mobile friendly" and "Fullscreen button".
  GitHub Pages: publish dist/ via an Action or the gh-pages branch.
  Vercel: framework preset Vite.

## 14. Testing approach

  - Vitest for all of src/systems/. See docs/09 for the case list.
  - Systems accept a seeded rng and explicit dt so tests are deterministic.
  - A debug "time scale" key (x1, x3) exists for manual playtesting.

## 15. System public APIs (filled in as stages are built)

All take the GameState as the first argument; bus is injected at creation.

  gameState    createState(settings), completedCount(s), deriveAct(s),
               setCompleted(s, n)  (debug/presets: statuses only)
  eventBus     createEventBus() -> {on, off, emit, clear}; shared `bus`
  battery      createBattery(bus) -> {tick(s, dt), spend(s, amount),
               playCost(vmId), tickPlayback(s, dt), setTorch(s, on), set(s, v)}
  movement     createMovement() -> {move(s, dt, {dir, targetX}) -> arrived}
  interaction  checkWhen(when, s), pickVariant(hotspot, s), currentVmId(s),
               createInteraction(bus) -> {interact(s, hotspotId) -> {text, action},
               useDoor(s, doorId) -> {passed, text}, teleport(s, room, x)}
  fixPuzzles   createFixPuzzles() -> {validate(type, input, s), checkLocker(code),
               closeWindow(s, id) -> null | {order}}
  messages     createMessages(bus) -> {send(s, 'mom1'|'mom2')}; clockLabel(sec)
  voicemailFlow createVoicemailFlow(bus, {battery, puzzles, messages}) ->
               {preview, fixButton, attemptFix, closeWindow, play, togglePause,
               endMemory(s, id, skipped), tick(s, dt), hintsFor(s), debugComplete(s, n)}
               Results are {ok} or {ok: false, reason} where reason is a
               texts.toasts key (notYet, nothingToFix, lowBattery, wrongFix).
  finalAct     createFinalAct(bus, {puzzles}) -> {lockerUsable(s), tryCode(s, code)}
  noise        proximity(s), isAdjacent(a, b), createNoise(bus) -> {tick(s, dt),
               spike(s, kind), set(s, v)}
  vikramAI     planPath(from, to, x), actParams(s), createVikramAI(bus, {noise, rng}) ->
               {enter(s), tick(s, dt), force(s, state)}
  rules        connectRules(bus, systems, getState) -> unsubscribe
  hideSystem   nearestHideSpot(s), createHideSystem(bus, {battery}) -> {hide(s), unhide(s)}
  naniWarning  secondsUntilEnters(s, room), createNaniWarning(bus) -> {tick(s)}
  vikramAI     also canSee(s), vikramSpeed(s), reenterNow(s)
  barks        createBarks(bus) -> {say(s, set), tick(s, dt), onState(s, name), onEnterHall(s)}
  presets      applyPreset(s, act, systems)
  finalAct     createFinalAct(bus, {puzzles, battery, vikram}) -> {lockerUsable, tryCode,
               skipTapeMoment, inCinematic, canCall, call, tick, cornerReached}
  endingResolver resolveEnding(cause, s), physicalEvidenceCount(s), epilogueKey(s),
               createEndingResolver(bus, {deferred}) -> {request(s, cause), flush(s)}
  vikramAI     also startHunt(s), startCorner(s)
  presence     createPresence(bus, {noise, rng}) -> {rise(s, kind), fall(s, kind), set(s, v),
               touchChai(s), tick(s, dt)}; createTemptation(bus) -> {show(s), press(s)}
  footsteps    footstepMix(s, hasFilter) -> {volume, pan, muffled} | null
