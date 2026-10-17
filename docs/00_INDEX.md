# UNHEARD - Spec pack index

Pack version 1.0 (17 Oct 2026)
Design: Somi. Written with Claude.

## How to use this pack

  1. Make an empty folder called unheard.
  2. Put CLAUDE.md in the root of that folder.
  3. Put every other file in unheard/docs/.
  4. Open a terminal inside unheard and run: claude
  5. Say: "Read CLAUDE.md and docs/00_INDEX.md, then start Stage 0 from
     docs/08_BUILD_PLAN_AND_PROMPTS.md."
  6. Do ONE stage at a time. Playtest after each stage. Commit after each.
  7. When a stage is done, paste the next stage prompt from docs/08.

Never ask Claude Code to "build the whole game". It will produce a mess.
The stage prompts in docs/08 are written to avoid that.

## File list

  CLAUDE.md                          project rules Claude Code reads first
  00_INDEX.md                        this file
  01_GAME_DESIGN.md                  story, characters, motive, constraints
  02_TECH_ARCHITECTURE.md            stack, folders, state, events, rendering
  03_SYSTEMS_AND_BALANCE.md          every number and formula, Vikram AI
  04_WORLD_ROOMS_AND_ITEMS.md        rooms, coordinates, puzzles, items, data
  05_SCRIPT_AND_NARRATIVE.md         all text and voice lines, data modules
  06_ENDINGS_AND_FINAL_ACT.md        final act, ending logic, 4 ending scripts
  07_UI_UX_ART_AUDIO.md              HUD, phone UI, art, audio, accessibility
  08_BUILD_PLAN_AND_PROMPTS.md       8 stages with prompts and checklists
  09_TEST_QA_AND_DEBUG.md            debug panel, tests, tuning, release

## Glossary

  Nani        the player's grandmother (mother's mother). Dead. Ghost helper.
  Vikram      Mom's cousin. Nani's nephew (she calls him by name, he calls her
              Maasi). The human villain. Has a key to the flat.
  The Hollow  a ghost in the voicemail static. Imitates Nani badly. Wants you
              to rush, stay, and stop listening.
  Mom         called "Mummy". Away at Mausi's. Only appears as text messages
              and (in the good ending) in person.
  VM          voicemail. VM1 to VM7 are puzzles. VM8 is the last one, played
              only in an ending.
  Presence    hidden 0-100 meter. How close the Hollow is.
  Noise       visible 0-100 bar. How much Vikram can hear right now.
  Battery     visible %. Powers torch, voicemail playback and the call.
  Hotspot     a tappable object in a room.
  Hide spot   a place the player can hide (wardrobe, curtain, etc).
  Act         1 to 5. Derived from how many voicemails are done.
  Hunt        Act 5 behaviour of Vikram after the tape recorder is taken.
  Memory      the 20-second flashback after each voicemail.
  Evidence    proof items E1 to E8 (see docs/04).

## Locked decisions (do not re-debate)

  1. Browser game, Phaser 3, JavaScript, mobile and desktop.
  2. Side-view single-screen rooms, tap-to-walk on one horizontal floor line.
  3. Four rooms: Hall, Living room, Kitchen, Bedroom.
  4. Voicemails are played in a fixed order, 1 to 7. The list shows them in
     that order. (The "season clue ordering puzzle" is a stretch goal.)
  5. Vikram is frozen and the player cannot be caught during memory scenes.
  6. Pressing PLAY #8 NOW ends the run immediately with the "Later" ending.
  7. Four endings (see below).
  8. Maximum 3 jump scares.
  9. Subtitles are always on. Voice is Hinglish.
 10. Protagonist is gender-neutral. Nani says "beta" at most once per
     voicemail. The Hollow overuses it. This is the fair-play tell.

## The four endings

  EAT PROPERLY  good ending. Survive, Presence under 60.
  STATIC        bittersweet. Survive, Presence 60 to 99.
  CAUGHT        thriller bad ending. Vikram catches you, or the battery dies.
  LATER         horror bad ending. Pressed PLAY #8 NOW, or Presence hit 100.

Note: the original brief had three endings (good, thriller-bad, horror-bad).
A rule gap existed for "finished everything but Presence 60-99". STATIC closes
that gap. It is derived, so it costs almost no extra work.

## Stretch goals (only when the user asks)

  - Season-clue ordering puzzle for the voicemails (smudged dates).
  - Hindi / English subtitle toggle.
  - Phone haptics on mobile when Vikram investigates.
  - A fill-in-the-blank mini-moment in the STATIC ending.
  - Peek-slit view while hiding.
  - Second route for Vikram in Act 3.
  - Achievements screen for the 4 endings.

## Decisions made during build

(Claude Code: append here, one line each, with the date.)

  2026-10-17  localStorage unheard.settings holds every title-screen setting (assist, reduceFlash, volMaster, volVoice, volSfx, hotspotHints, vibration, subtitleSize). CLAUDE.md updated.
  2026-10-17  GameState.settings gains hotspotHints (true), vibration (false), subtitleSize ('M').
  2026-10-17  GameState.flags gains cardAssembled (used by rooms.js desk variants).
  2026-10-17  GameState.flags gains livingWindowReopened (WINDOW_REOPENS beat, Living window text).
  2026-10-17  GameState.flags gains callConnectTimer (seconds into the 6 s call connect).
  2026-10-17  GameState.flags gains manifestCount (full JS2 only on the first manifestation).
  2026-10-17  GameState.flags gains cornerActive (corner event running; disables caught and dead_air).
  2026-10-17  GameState.flags gains endingCause (cause passed to ending:trigger).
  2026-10-17  GameState gains presenceState.idleDarkTimer (idle-in-the-dark accrual).
  2026-10-17  GameState gains presenceState.armed (per-threshold re-arm on drop).
  2026-10-17  GameState gains presenceState.nextWhisperAt (ambient whisper schedule).
  2026-10-17  GameState gains presenceState.ng2Shown (NG2 on first 30 crossing only).
  2026-10-17  GameState gains hints {currentVm, damagedSeconds} (hint1/hint2 timers).
  2026-10-17  Ending cause name is 'presence_doom' everywhere; seen-hiding lives in vikram.seenHiding.
  2026-10-17  Ending resolver: EAT_PROPERLY iff presence <= final.niceEndingMaxPresence (59).
  2026-10-17  JS2 full scare only on the first manifestation; later ones are sound and shape only.
  2026-10-17  Hollow whispers H1-H8 (and the STATIC ending Hollow line) say "beta" at least twice.
  2026-10-17  VM7 is played in Act 3; Act 4 is the locker walk. docs/01 pacing and docs/03 s14 fixed.
  2026-10-17  SEARCH: searchTime is look-around only; hide-spot checks within the radius follow; Hunt ignores the radius.
  2026-10-17  Battery 0 before Vikram has entered or while AWAY: he re-enters with a door slam within huntReenterSec; dead-air 25 s applies.
  2026-10-17  New condition windowClosed: id; window hotspots say "Closed." once closed; reopened Living window has its own text.
  2026-10-17  FIX toast for house-fixed VMs shows voicemails[n].previewLabel.
  2026-10-17  Prose numbers moved to balance.js: player.doorFadeSec, torch.blackoutSec/blackoutEvery, noise.catchDist, vikram.keyWarningSec/huntReenterSec/investigateRefreshSec, nani.warnLeadSecAssist/ng2Sec/ng3WindowSec/ng4Dist/ng4FadeSec, hints.hint1Sec/hint2Sec, final.sirenAtEta.
  2026-10-17  Fonts: system fallback stack; Phaser waits on document.fonts.ready for at most 1.5 s (boot.fontsTimeoutMs in constants.js).
  2026-10-17  Project root is the folder containing CLAUDE.md; git initialised there.
  2026-10-17  Player start x is 560 (docs/04 wins over the 480 in the docs/02 shape; docs/02 fixed).
  2026-10-17  Phaser pinned to 3.90.0 (latest 3.x; npm "latest" is 4.x, which CLAUDE.md rules out).
  2026-10-17  Fonts load via the FontFace API, not @font-face in index.html, and only if the woff2 exists (no 404 console errors).
  2026-10-17  vite.config.js plugin exposes virtual:asset-files (files present in public/assets); BootScene requests only those. Restart dev server after adding assets.
  2026-10-17  Extra small modules: utils/storage.js, utils/fonts.js, utils/orientation.js, ui/text.js. DEFAULT_SETTINGS lives in config/constants.js.
  2026-10-17  Stage 0: rotate overlay is a DOM element over the canvas (shown via CSS orientation media query + JS); Phaser game loop pauses while it shows.
  2026-10-17  Stage 1: balance.world.walkMinX/walkMaxX (30/930) and torch.outlineDistOff/outlineDistOn (80/120) added to docs/03 and balance.js.
  2026-10-17  Stage 1: systems/movement.js and systems/interaction.js added (pure; player movement, conditions, hotspot actions, doors).
  2026-10-17  Stage 1: E interacts with the nearest hotspot OR door in range (keyboard players need doors too).
  2026-10-17  Stage 1: tapping a hotspot walks until within interactRange then interacts; tapping a door walks to the door x then passes.
  2026-10-17  Stage 1: examine text shows as a YOU-grey subtitle for 3 s; toasts are used for pickups and evidence.
  2026-10-17  Stage 1: hotspot actions openFix, closeWindow, openKeypad and glimpse are returned but not run until Stages 2 and 4.
  2026-10-17  Stage 1: debug panel is a DOM overlay managed by DebugScene, loaded via dynamic import in dev only. window.__game is exposed in dev only.
  2026-10-17  Stage 1: debug "VMs done 0-7" sets statuses only (no memory consequences) until Stage 2 adds "Complete voicemail N".
  2026-10-17  Stage 1: battery:changed fires when the shown whole percent changes (and on spend/set), not every frame.
  2026-10-17  index.html gets an empty inline favicon so the browser logs no 404.
  2026-10-17  Stage 2: puzzle answers, beat timings and prologue timings added to balance.js (puzzles, beats, prologue, memory.fadeMs/endPauseMs).
  2026-10-17  Stage 2: texts.js gains note (VM5 note text), captions (SFX captions for beats) and ui (short interface lines). docs/05 updated first.
  2026-10-17  Stage 2: PAUSE unlocks the player so they can walk to a hide spot; RESUME locks them again.
  2026-10-17  Stage 2: battery dying mid-playback interrupts it; the VM stays 'fixed' and a "Battery too low." toast shows.
  2026-10-17  Stage 2: PrologueScene added for the scripted opening; debug "Skip prologue" still sends Mom's first text.
  2026-10-17  Stage 2: systems/messages.js added; the phone clock starts at 9:40 PM and follows real time.
  2026-10-17  Stage 2: finalAct.js holds the locker now (tryCode); Stage 5 adds the tape moment, call and ETA.
  2026-10-17  Stage 2: the phone reopens on the last tab used; opening a puzzle modal closes the phone.
  2026-10-17  Stage 2: card tray order is shuffled but never already solved.
  2026-10-17  Stage 2: debug "Complete voicemail 1..N" runs the real memory-end consequences (auto evidence, Mom text 2, windows).
  2026-10-17  Stage 2: HUD round buttons use a circular hit area (bug: the default rectangle hit area broke taps).
  2026-10-17  Stage 3a: systems/rules.js holds event-to-rule wiring (noise spikes, completed-count events) so scenes hold no rules.
  2026-10-17  Stage 3a: Vikram's movement is a queue of {walk: x} / {door: room, toX} ops; GameState.vikram gains path, phase, searchSpots, refreshTimer, moving, facing.
  2026-10-17  Stage 3a: hearing only starts an INVESTIGATE from PATROL; the target refreshes every 1 s while noise stays above the threshold (never mid-doorway).
  2026-10-17  Stage 3a: after a search, noise is SET to 30 (docs/03 literal); PATROL resumes by walking back to the current route stop.
  2026-10-17  Stage 3a: footstep numbers from docs/07 s8.5 moved into balance.footsteps; systems/footsteps.js computes volume/pan; a "[footsteps]" HUD marker shows them until Stage 6 audio.
  2026-10-17  Stage 3a: debug teleport emits room:enter with teleport: true so it does not spike noise.
  2026-10-17  Stage 3a: ENTERING plays the key warning every time he comes back from AWAY, not only the first time.
  2026-10-17  Stage 3b: seenHiding is computed whenever the player hides (same room and < 260 px), not only during a chase; it matters in CHASE and in hide-spot checks.
  2026-10-17  Stage 3b: a door during CHASE: he follows through that one door, then INVESTIGATEs where the player came in (the arrival x).
  2026-10-17  Stage 3b: a hide spot found during SEARCH (seenHiding or noise >= 40) ends the run as CAUGHT.
  2026-10-17  Stage 3b: catches are emitted as player:caught; rules.js turns it into ending:trigger CAUGHT (placeholder until the Stage 5 resolver).
  2026-10-17  Stage 3b: GameState gains debug.godMode (debug panel only; blocks catches).
  2026-10-17  Stage 3b: Nani's warning (systems/naniWarning.js) estimates his arrival from his queued path; one flicker per approach. Caption LAMP_TICK added to texts.
  2026-10-17  Stage 3b: the HIDE / COME OUT context button follows the player's x at y 250; H toggles it on desktop.

## Changelog

  1.0  First full spec pack.
