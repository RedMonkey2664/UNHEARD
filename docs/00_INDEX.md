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
  10_VISUAL_PASS.md                  visual pass: code-drawn art, lighting, UI styling

## Glossary

  Nani        the player's grandmother (mother's mother). Dead. Ghost helper.
  Vikram      Mom's cousin. Nani's nephew (she calls him by name, he calls her
              Auntie). The human villain. Has a key to the flat.
  The Hollow  a ghost in the voicemail static. Imitates Nani badly. Wants you
              to rush, stay, and stop listening.
  Mom         Away at your aunt's. Only appears as text messages
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
  9. Subtitles are always on. The script is English only.
 10. Protagonist is gender-neutral. Nani says "dear" at most once per
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
  - A second subtitle language.
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
  2026-10-17  Hollow whispers H1-H8 (and the STATIC ending Hollow line) say "beta" at least twice (now "dear", see the English-only entry).
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
  2026-10-17  Stage 3c: battery 0 without a call brings Vikram back (door slam within huntReenterSec, any act including Act 1); full HUNT behaviour lands in Stage 5.
  2026-10-17  Stage 3c: the dead-air timer counts down in finalAct.tick (frame step 9) and ends with player:caught cause dead_air.
  2026-10-17  Stage 3c: barks rotate through each set in order (no randomness), 12 s global cooldown, only when audible; 'away' lines within balance.vikram.awayBarkRange (150 px, new) of the front door.
  2026-10-17  Stage 3c: "Pause and hide." shows in the phone during playback at noise >= 60, and as a one-off toast if the phone is closed.
  2026-10-17  Stage 3c: skip-to-act presets in systems/presets.js; they reset the run, skip the prologue and send Mom's first text.
  2026-10-17  Stage 3c: opening the locker re-derives the act (5) and emits act:changed.
  2026-10-17  Stage 4: presentation numbers added to balance (tint block, torch.flickerEvery, presence.shapeEvery/shapeSec, js1Sec, js3Sec).
  2026-10-17  Stage 4: presence and temptation live in systems/presence.js; all rises and falls are wired in rules.js; LATER fires through ending:trigger (placeholder screen until Stage 5).
  2026-10-17  Stage 4: GameState gains flags.manifestRoom, nani.offer and nani.ng3Until.
  2026-10-17  Stage 4: "idle" for dark accrual means not moving, not locked, torch off, not hidden, no puzzle, no unpaused playback.
  2026-10-17  Stage 4: NG4 chai cup appears 120 px toward the middle of the room so it is always reachable; tap or E to touch.
  2026-10-17  Stage 4: NG2 appears in the farthest unlocked doorway if it is more than a third of the room away, otherwise at the far wall.
  2026-10-17  Stage 4: the note reader stays open after the VM5 fix for JUMP SCARE 1, then closes itself.
  2026-10-17  Stage 4: Reduce flash: scares use a dark fade instead of a white frame; JS3's face is a dark silhouette.
  2026-10-17  Stage 4: manifest captions (MANIFEST_FULL, MANIFEST, HOLLOW_FADE) and texts.ui.temptation added to docs/05.
  2026-10-17  Stage 4: phone voicemail rows are 24 px tall so the PLAY #8 NOW row and its "Saves battery." line fit.
  2026-10-17  Stage 5: endingResolver collects causes per frame and flushes at frame step 10 (LATER > CAUGHT > police); the corner event drops 'caught' and 'dead_air'. Unit tests without a resolver resolve immediately.
  2026-10-17  Stage 5: balance.final gains tapeMomentSec (8) and endingDelaySec (0.6, the pause before the ending scene).
  2026-10-17  Stage 5: the tape moment freezes every system except finalAct (player locked, Vikram frozen); its four lines and timings live in data/endings.js TAPE_MOMENT.
  2026-10-17  Stage 5: HUNT: shuffled rooms (seeded rng, never the room he is in first), walk to the route stop (mid-Hall for the Hall), then SEARCH (4 s look, every hide spot). After INVESTIGATE/SEARCH/CHASE he returns to HUNT, never PATROL.
  2026-10-17  Stage 5: CORNER is its own Vikram state: straight to the player at 160 px/s (no Assist slowdown), no sight, no catches; reaching the player resolves police_arrived before ETA 0.
  2026-10-17  Stage 5: calling while walking is refused with "Too loud. Hold still."; moving during the 6 s connect does not drop the call (only noise >= 60 does).
  2026-10-17  Stage 5: connecting the call clears any running dead-air timer.
  2026-10-17  Stage 5: CALL is a green button at the top of the VOICEMAIL tab and a round HUD button; POLICE m:ss replaces it once connected.
  2026-10-17  Stage 5: ending stage directions without on-screen lines became SFX captions or visuals; stills fall back to a warm colour field. MOM and POLICE subtitle colours added (not in docs/05).
  2026-10-17  Stage 5: the end card saves the ending to unheard.endings when it appears; PLAY AGAIN goes to the headphone gate (a fresh state).
  2026-10-17  Stage 6: mix levels from docs/07 s8.4 moved into balance.audio, plus the few extra mix choices the docs leave open (rain, radio static, muffle, siren floor, small sfx).
  2026-10-17  Stage 6: AudioDirector is one game-level object (registry 'audio') driven by RoomScene each frame; Title and Ending scenes keep its loops fading.
  2026-10-17  Stage 6: no low-pass filter (Phaser has none built in), so adjacent-room footsteps use the docs' no-filter level (0.25) and hiding halves ambience instead of filtering it.
  2026-10-17  Stage 6: at Presence >= 60 a whisper (hol_1) is layered under each voicemail at the whisper gain.
  2026-10-17  Stage 6: the visual "[footsteps]" marker stays after audio as an accessibility cue (it never lies: same pan and volume rules).
  2026-10-17  Stage 6: spr_* files are used as single images (no sprite-sheet frames yet): the docs do not give frame sizes. Name and size the sheets and the animation can be wired.
  2026-10-17  Stage 6: with a room background image, greybox shapes and labels hide but their hit areas stay; window/TV/radio overlays show when the file exists, else the tint fallback.
  2026-10-17  Stage 6: verified with temporary generated test files (WAV tones, PNGs), deleted afterwards; public/assets ships empty.
  2026-10-18  Stage 1.5: art is drawn on Phaser canvas textures at boot (Canvas 2D for gradients); a real PNG with the same key always wins.
  2026-10-18  Stage 1.5: torch-off glints (80 px) always show, as docs/03 s8 requires for navigating the dark; the Hotspot hints setting turns off only the 120 px torch-on glints. docs/10 s4 put both under the setting; docs/03 ranks higher.
  2026-10-18  Stage 1.5: hit areas are unchanged (docs/04); glints and labels sit on the drawn objects via ART_ANCHOR in render/art/roomArt.js.
  2026-10-18  Stage 1.5: at most two labels show, the nearest within interactRange plus one more only if it is >= 90 px away (ART.labelGap); a sweep of every room found no overlaps.
  2026-10-18  Stage 1.5: generated character art keeps its own size (player 156 px, Vikram 178 px) so it fits the drawn doors; real PNGs are fitted to the docs/07 190 px.
  2026-10-18  Stage 1.5: the phone in the player's hand has a tiny emissive glow so the player can always find themselves in the dark.
  2026-10-18  Stage 1.5: the edge vignette is Phaser's WebGL vignette shader (a texture banded visibly); the dithered texture is the canvas-renderer fallback. No vignette on the title (it would dim the buttons).
  2026-10-18  Stage 1.5: keyboard phone toggles (P, Tab) are instant; taps slide (250 ms open, 180 ms close, strong ease-out). Title glitch and curtain sway are off under OS reduced-motion.
  2026-10-18  Stage 1.5: visual-only numbers live in constants.js ART; colours in COLORS (new tokens added). balance.js and data files unchanged.
  2026-10-18  Mobile version: touch devices (coarse pointer) get a mobile layout: 72 px HUD buttons, a taller phone panel (PHONE_LAYOUT.touch, 30 px rows, 44 px buttons), text x1.12, and large subtitles on first run. Desktop unchanged.
  2026-10-18  Mobile version: the headphone-gate tap also requests fullscreen and a landscape lock (best effort; iPhone Safari supports neither, the rotate overlay still covers portrait).
  2026-10-18  Mobile version: the game frame keeps clear of notches (safe-area insets) and uses 100dvh.
  2026-10-18  Installable web app: manifest (fullscreen, landscape), code-generated icons (scripts/make-icons.mjs), and a service worker (production only) so the game works offline after the first play.
  2026-10-18  Deploy: vercel.json (Vite build, dist/ output, no-cache on sw.js); the branch is main, remote github.com/RedMonkey2664/UNHEARD.
  2026-10-18  Audio: scripts/make-audio.mjs synthesises 64 WAV files (sfx, ambience, music, voicemail line beds, damaged previews, the tape, wordless Hollow whispers); phone-line audio at 8 kHz, the rest at 22.05 kHz; 6.3 MB total.
  2026-10-18  Audio: spoken lines (Nani, Vikram barks, Mom, police, operator, you_later, Nani's chai lines) are not generated; they stay as subtitles until recordings are added. A real .ogg/.mp3 with the same key is preferred over the .wav.
  2026-10-18  Audio: BootScene shows a thin loading bar while the sound loads.
  2026-10-18  Audio: a low eerie bed (music_eerie_loop, balance.audio.eerieDb -22) plays under the title and the whole game, ducks under voices, and gives way to the memory music in memories.
  2026-10-18  Easier tuning (user request): torch drain 0.06, wrong fix 3, dead air 35 s; noise rises walk 11 / sneak 4 / torch 4 / voicemail 7 / puzzle 5, spikes 6/10/8/6, hide found at 50; Vikram sight 440, seen-hiding 210, acts away 40/25/15 and speed 100/112/125/145; Presence wrong fix 7, replay 8, skip 15, idle 1 per 10 s, call fail 4; Nani's warning 3.5 s; hints at 60/120 s; police ETA 60 s. Investigate threshold stays 60. Tests now read their numbers from balance.js.
  2026-10-18  English-only script (user request): every spoken and written line is English. Lines use one "text" field (no hi/en). Nani and the Hollow say "dear" where they said "beta" (Hollow still twice or more per line); Vikram says "kiddo" and calls Nani "Auntie"; Mummy is Mom, chai is tea, chappals are slippers. Umbrella tag reads "Kitchen - Bedroom - Living room"; notebook page 1 reads "4 whistles"; card scrap C is "dear.".

## Changelog

  1.0  First full spec pack.
