# 08 - Build plan and prompts

Total: about 6 to 8 working days for one person using Claude Code.
Rule: ONE stage per Claude Code session. Playtest, commit, then move on.

```
Stage 0  skeleton and menus            (half a day)
Stage 1  greybox world, torch, battery (1 day)
Stage 2  phone, voicemails, fixes      (1.5 days)
Stage 3  noise, Vikram, hiding         (1.5 days)
Stage 4  Presence, Hollow, Nani        (1 day)
Stage 5  final act and endings         (1 day)
Stage 6  audio and art swap-in         (1 to 2 days)
Stage 7  balance, QA, mobile, deploy   (1 day)
```

How to paste a prompt: open Claude Code in the unheard folder, paste the prompt
for the stage, let it work, then run the "How to try it" steps yourself.

If a stage fails: do not move on. Use the "Fix prompt" template at the end.

---------------------------------------------------------------------------

## Stage 0: Project skeleton and menus

Prompt:
"Read CLAUDE.md, docs/00_INDEX.md and docs/02_TECH_ARCHITECTURE.md. Do Stage 0
only. Create the Vite + Phaser 3 JavaScript project with the folder structure
from docs/02 section 3 (empty files with a one-line header comment are fine for
modules not used yet). Implement: BootScene (loads data/assets.js and tolerates
missing files), TitleScene (title, tagline, content notes from docs/05
texts.title, four endings-found dots, settings for Assist, Reduce flash,
volumes, hotspot hints, vibration, and a BEGIN button), HeadphoneGateScene
('Tap to begin. Wear headphones.' which unlocks audio then starts RoomScene),
a blank RoomScene, the portrait 'Rotate your phone' overlay, systems/eventBus.js,
systems/gameState.js with createState() matching docs/02 section 5,
config/balance.js copied from docs/03 section 1, config/constants.js with the
COLORS from docs/07, utils/rng.js (seedable), and Vitest with one passing test
for createState(). Persist settings and endings in localStorage safely. Do not
implement gameplay. When done, tell me how to run it and what I should see."

Acceptance:
  [ ] npm run dev opens a title screen at 960x540 scaled to fit
  [ ] BEGIN leads to the headphone gate, tap leads to an empty RoomScene
  [ ] Rotating a phone to portrait shows the rotate overlay
  [ ] Settings persist after reload; storage blocked does not crash
  [ ] npm test passes, npm run build succeeds

How to try it: run npm run dev, open it on your laptop and on your phone (same
Wi-Fi, use the network URL Vite prints).

---------------------------------------------------------------------------

## Stage 1: Greybox world, torch, battery, debug panel

Prompt:
"Read CLAUDE.md, then docs/02, docs/03 sections 1, 3 and 8, docs/04, and docs/07
sections 1 and 2. Do Stage 1 only. Build RoomScene with the 4 rooms from
src/data/rooms.js (copy it from docs/04 exactly). Greybox: flat coloured
backgrounds with the room name, rectangles for hotspots, doors and hide spots,
a rectangle player (letter P). Implement tap-to-walk on the floor line, A/D
and arrow keys, E to interact, door transitions with a 0.4 s fade, hotspot
variants and the condition mini-language from docs/04 (examine text shown as a
subtitle and toast), and the DarknessLayer and torch from docs/02 section 8
(torch button and F key, radius 180, dim glow when off, hotspot outlines near
the player). Implement systems/battery.js with torch drain and battery:changed
events plus the HUD (battery, noise bar placeholder, torch, sneak, phone
buttons) in UIScene. Build the DebugScene panel from docs/09 section 1 with at
least: show hitboxes, set battery, teleport to a room, time scale x1/x3, reset
run. Write Vitest tests for battery. Do not implement the phone, voicemails,
Vikram or Presence."

Acceptance:
  [ ] Player walks within the room and through all doors, arriving at the right x
  [ ] Examine text appears for every hotspot, variants selected by conditions
  [ ] Darkness is 96 percent black; torch ON shows a 180 px lit circle
  [ ] Torch OFF shows a faint 40 px glow and hotspot outlines within 80 px
  [ ] Battery drains 0.08 percent per second with torch on, stops at 0
  [ ] Debug panel works (hitboxes, set battery, teleport, time scale, reset)
  [ ] Tests for battery pass

How to try it: walk everywhere, toggle torch, open the debug panel with backtick.

---------------------------------------------------------------------------

## Stage 2: Phone, voicemails, fixes, memories, evidence

Prompt:
"Read CLAUDE.md, then docs/03 sections 2, 9, 10, 12, docs/04 (puzzles,
evidence), docs/05 (all), and docs/07 sections 3, 4 and 11. Do Stage 2 only.
Implement: data/voicemails.js, data/items.js, data/texts.js copied from the
docs; systems/voicemailFlow.js (status machine: locked, damaged, fixed, playing,
memory, done; gating in order; preview 3 s free; play cost spent linearly;
pause; replay with Presence effects stubbed), systems/fixPuzzles.js with
validators for RADIO, CARD, WINDOWS, COOKER, NOTE, EARPHONES; the PhoneUI
(VOICEMAIL, MESSAGES, NOTES tabs); all puzzle UIs (RadioDial, CardAssembler,
CounterDial, NoteReader, ItemPicker, Keypad built but only reachable once
completed >= 7); inventory and evidence handling exactly as docs/04 section 7;
the MemoryScene (4 beats of 5 s, SKIP after 4 s with the Presence effect
stubbed to an event); Mom's first text during the prologue sequence from
docs/05 section 7; subtitles for voicemail lines from the data (audio falls
back to timers); the small horror beats as toasts or simple effects (no
jump-scare art yet). Write Vitest tests for voicemailFlow and fixPuzzles. Do
not implement Vikram, noise or Presence logic yet."

Acceptance:
  [ ] The prologue plays, Mom's text arrives and shows for 6 s
  [ ] VM1 to VM7 can be previewed, fixed, played and remembered in order
  [ ] Each fix works with its clue, wrong fixes cost 4 battery and fire events
  [ ] Locked VMs show "Not yet."; PLAY is disabled until fixed
  [ ] Playback drains the right battery per VM (VM5 is 12)
  [ ] Pause stops the drain; replay is possible and costs the normal amount
  [ ] Evidence unlocks exactly as in docs/04 section 7; NOTES shows it
  [ ] Memory scenes run 20 s with subtitles and SKIP after 4 s
  [ ] Window puzzle: windows open when VM3 becomes current, order enforced
  [ ] Tests for voicemailFlow and fixPuzzles pass

How to try it: play the whole voicemail chain without enemies, using the
debug panel to teleport. Check the battery after all 7: about 50 percent used
(plus torch time).

---------------------------------------------------------------------------

## Stage 3: Noise, Vikram, hiding (build in three sub-steps)

Prompt 3a (patrol and noise):
"Read CLAUDE.md, then docs/03 sections 2, 4, 6 (AWAY, ENTERING, PATROL,
LEAVING, INVESTIGATE, SEARCH only), 14. Do Stage 3a only. Implement
systems/noise.js (rise, decay, spikes, proximity) and systems/vikramAI.js with
the states AWAY, ENTERING, PATROL, LEAVING, INVESTIGATE, SEARCH, the route and
door logic from docs/03, Act 2 to 4 parameters, and act derivation from
completed voicemails. Hook it up: Vikram enters when completed == 2 (key in the
lock sequence), the foreshadow footsteps at completed == 1. Draw Vikram as a
rectangle (letter V) visible only inside the torch circle or within 130 px.
Show noise on the HUD. Use debug panel additions: show Vikram always, his
state, room, x and timers; force state; set noise. Vitest: noise rise/decay with
proximity, route progression, investigate trigger, search timing, seeded rng."

Prompt 3b (hiding, sight, chase, catch):
"Read docs/03 sections 6 and 7. Do Stage 3b only. Add hide spots (HIDE button,
COME OUT, torch forced off, vignette), SIGHT, CHASE, CAUGHT (with a temporary
CAUGHT placeholder screen), the seenHiding rule, door-following, searching hide
spots, noise-after-search, and Nani's lamp warning (sprite-less: a flicker and
sound event) when Presence is below 60 (Presence is 0 for now). Add Assist mode
multipliers. Vitest: sight rules, hide found / not found by noise, seenHiding,
chase to catch, door break of line of sight."

Prompt 3c (act scaling and phone integration):
"Read docs/03 sections 3 (battery zero, dead air) and 12. Do Stage 3c only.
Apply the per-act Vikram parameters, battery-zero dead-air timer, the
'Pause and hide' phone hint when noise >= 60, noise from voicemail playback and
open puzzles, and the vikram bark system (subtitles only for now). Add a
debug 'skip to act N' preset from docs/09."

Acceptance (all of 3):
  [ ] Vikram enters after VM2's memory ends, patrols the route, leaves, returns
  [ ] A full Act 2 patrol takes about 60 s; the away gap is 30 s
  [ ] Walking near him raises noise; sneaking raises it less; torch adds noise
  [ ] Noise >= 60 sends him investigating; he searches and checks hide spots
  [ ] Hiding quietly works; hiding while seen fails; moving while hidden is not
      possible; noise decays faster when he is not in the room
  [ ] Being seen starts a chase; contact ends the run with a placeholder screen
  [ ] Changing room breaks the chase and sends him to investigate
  [ ] Battery 0 starts the 25 s dead-air timer
  [ ] Footstep subtitles or debug markers show his position correctly
  [ ] Tests pass for noise and vikram

---------------------------------------------------------------------------

## Stage 4: Presence, the Hollow, Nani, temptation, jump scares

Prompt:
"Read CLAUDE.md, then docs/03 sections 5 and 11, docs/04 sections 5 and 6,
docs/05 sections 3, 4 and 6, and docs/07 sections 5 and 11. Do Stage 4 only.
Implement systems/presence.js with the rises, falls, thresholds and the
manifest timer from docs/03; wire in: wrong fix, replay, memory skip and memory
done, idle-in-dark accrual, call-fail stub. Add DarknessLayer flicker at
Presence >= 30 and blackouts at >= 60, TintLayer warm-to-cold, Nani glimpses
NG1 to NG4 (placeholder sprites), the chai-cup relief mechanic (max 3), the
Hollow shape at >= 60, ambient Hollow whispers every 20 to 35 s as subtitles,
whisper noise during searches, the manifestation at 90 with the 5 s door
timer and reset to 75, the temptation (whisper H2, the PLAY #8 NOW row after
VM4's memory), and the three jump scares with the Reduce flash alternatives.
Pressing PLAY #8 NOW or reaching Presence 100 fires ending:trigger LATER
(show a placeholder screen). Vitest: presence rises and falls, thresholds fire
once per upward crossing, manifest timer, temptation trigger."

Acceptance:
  [ ] Wrong fixes, replays and skips change Presence as specified
  [ ] 30: flicker and Nani doorway glimpse; 45: chai offer appears and works
  [ ] 60: whispers begin, Nani's warning stops, tint is visibly colder
  [ ] 90: Hollow manifests, leaving the room resets Presence to 75
  [ ] Staying 5 s ends with a LATER placeholder
  [ ] PLAY #8 NOW appears after VM4 and ends with LATER when pressed
  [ ] Three jump scares exist and respect Reduce flash
  [ ] Debug panel can set Presence and trigger each beat

---------------------------------------------------------------------------

## Stage 5: Final act and endings

Prompt:
"Read CLAUDE.md, then docs/06 (all), docs/03 sections 3 and 6 (HUNT), docs/04
(locker and evidence), docs/05 (ending-related lines). Do Stage 5 only.
Implement systems/finalAct.js (tape moment, CALL rules, 6 s connect, noise
rules, fail on noise >= 60, ETA 75 countdown, siren fade-in at ETA <= 20,
corner event at ETA <= 8, resolution by Presence) and the HUNT mode in
vikramAI. Implement systems/endingResolver.js exactly as docs/06 section 2.
Implement EndingScene that plays beat lists from data/endings.js (copy the 4
endings from docs/06 into data/endings.js with plain text visuals, sounds as
keys that fall back silently). Epilogue selection by physical evidence count.
End card with endings found and PLAY AGAIN. Vitest: the full test matrix from
docs/06 section 9 except purely manual rows."

Acceptance:
  [ ] The locker opens only after VM7 and with code 0614
  [ ] The tape moment plays; Act 5 starts; CALL appears
  [ ] Calling works under the rules; the call can fail and be retried
  [ ] The ETA counts down from 75; the corner event takes over at 8
  [ ] All four endings are reachable and show the right epilogue
  [ ] Every ending row in the test matrix passes
  [ ] PLAY AGAIN resets cleanly; endings found persists

---------------------------------------------------------------------------

## Stage 6: Audio and art

Prompt:
"Read CLAUDE.md, then docs/07 sections 6 to 8 and docs/02 section 9. Do Stage 6
only. Implement AudioDirector for real: voice, sfx, ambience, music, Hollow
layer; ducking; spatial footsteps for Vikram exactly as docs/07 section 8.5;
heartbeat from noise; the amb_cold crossfade with Presence; barks with
cooldowns; Hollow whispers; fallback timers when a file is missing. Then wire
every key in data/assets.js. Replace the placeholder art with the files I put
in public/assets (if a file is missing, keep the placeholder). Do not change
the design or any numbers."

Acceptance:
  [ ] With headphones, Vikram's footsteps clearly pan and fade with position
  [ ] The voicemail voice ducks ambience and music
  [ ] Whispers layer under the voicemail at Presence >= 60
  [ ] Heartbeat follows noise
  [ ] A missing audio file does not crash; subtitles still run
  [ ] Backgrounds and sprites replace placeholders where files exist

---------------------------------------------------------------------------

## Stage 7: Balance, QA, mobile, deploy

Prompt:
"Read CLAUDE.md and docs/09. Do Stage 7 only. Add the playtest logging in
docs/09 section 5 (local only, downloadable as a JSON file from the debug
panel). Run through the QA checklist in docs/09, fix bugs, and report any
numbers that feel wrong using the tuning table in docs/03 section 15 (do not
change numbers silently; propose changes). Ensure npm run build output works
from a subfolder, add the itch.io zip instructions to README.md, and confirm
60 fps on a phone-sized viewport with CPU throttling x4 in devtools."

Acceptance:
  [ ] Checklist in docs/09 completed and pasted into the final message
  [ ] Production build works from a subfolder and offline after load
  [ ] Final asset size under 20 MB
  [ ] A full run takes 18 to 22 minutes for a first-time player

---------------------------------------------------------------------------

## Fix prompt template

"Something is wrong with <feature>. Expected (from docs/<file> section <n>):
<quote>. Actual: <what you see>. First reproduce it with a failing Vitest test
if the logic is pure, then fix it, then show me the test passing. Do not
change any numbers in balance.js unless I say so."

## Pre-flight prompt (use once, before Stage 0)

"Read CLAUDE.md and every file in docs/. List any contradictions between
documents, any missing information that would block Stage 0 to 7, and any
numbers that look inconsistent. Do not write code. Keep the list short."
