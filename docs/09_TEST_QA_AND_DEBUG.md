# 09 - Test, QA and debug

## 1. Debug panel (DebugScene, dev builds only)

Open with the backtick key, or triple-tap the top-left corner on a phone.
Never included in production builds (guard with import.meta.env.DEV or a
build flag).

Read-outs (updated every frame):
  act, completed count, run time
  battery, noise, presence (numeric, with colour)
  player: room, x, hidden, locked, torch, sneak
  vikram: state, room, x, timers (stateTimer, awayTimer), routeId, target,
          seenHiding
  flags: temptationShown, lockerOpened, tapeTaken, callConnected, policeEta
  stats: wrongFixes, replays, skippedMemories, hides, investigations
  voicemail statuses 1 to 7

Controls:
  Set battery / noise / presence (sliders, 0 to 100)
  +10 / -10 presence buttons
  Teleport to HALL, LIVING, KITCHEN, BEDROOM
  Time scale x1, x3
  Show hitboxes (hotspots, hide spots, doors, Vikram's sight radius)
  Show Vikram always (ignores the darkness layer for him)
  Force Vikram state (AWAY, ENTERING, PATROL, INVESTIGATE, SEARCH, CHASE, HUNT)
  Give all tools / give all evidence
  Complete voicemail N (marks 1..N done with their consequences)
  Skip to act N (presets below)
  Fire beat: any small horror beat id, any jump scare
  Trigger ending: EAT_PROPERLY, STATIC, CAUGHT (caught), CAUGHT (dead air),
                  LATER (temptation), LATER (presence_doom)
  God mode (cannot be caught; noise still shown)
  Toggle Assist
  Mute voices
  Download playtest log (JSON)
  Reset run

Skip-to-act presets (state to apply):
  Act 1  completed 0, battery 100, presence 0
  Act 2  completed 2, VM1-2 done, E1 E2 collected, GLASSES and EARPHONES held,
         battery 82, Vikram AWAY with timer 5 s
  Act 3  completed 6, E1-E6 collected, battery 38, Mom text 2 sent
  Act 4  completed 7, battery 28, locker unlocked
  Act 5  tape taken, battery 24, HUNT started, CALL available

## 2. Unit tests (Vitest, tests/)

battery.test.js
  - torch drains 0.08 per second; no drain when off or hidden
  - playback cost linear over the duration; VM5 totals 12
  - pause stops drain
  - wrong fix costs 4; assist multiplies costs by 0.8
  - clamp at 0; battery:zero fires once; dead-air timer starts if call not
    connected; not started when connected

noise.test.js
  - proximity factors: sameClose 1.5, sameMid 1.0, sameFar 0.7, adjacent 0.35,
    elsewhere 0, AWAY 0
  - rise rates per source stack correctly; decay 8 idle; 4 hidden same room
  - spikes scale with proximity
  - clamp 0 to 100; assist multiplier 0.6

presence.test.js
  - rise and fall values; clamp
  - thresholds fire once per upward crossing and re-arm after a drop
  - idle-dark accrual only after 5 s idle with torch off, not hidden
  - manifest timer: leave in time -> 75; stay -> 100
  - memory skip +20, memory done -5, Nani touch -10 (max 3)

vikram.test.js (seeded rng, explicit dt)
  - AWAY timer then ENTERING then PATROL
  - route A visits LIVING, KITCHEN, BEDROOM and leaves; route B reversed
  - walking through doors takes doorTime
  - sight: torch on 520, off 130, hidden never seen
  - noise >= 60 -> INVESTIGATE (40 in Hunt)
  - INVESTIGATE timeout 10 s -> SEARCH; SEARCH 6 s (4 s Hunt)
  - hide check: found if seenHiding or noise >= 40
  - CHASE speed x 1.3; CAUGHT at < 45 px; door breaks chase
  - frozen when memory is open
  - act parameters switch with completed count

voicemailFlow.test.js
  - gating in order; locked rows reject actions
  - preview free; fix required before play
  - status transitions; completed counter; act derivation
  - replay costs battery and adds Presence, no memory scene
  - events fire in order: vm:play:start, vm:play:end, memory:start, memory:end

fixPuzzles.test.js
  - RADIO 94.3 +-0.1 passes; 94.5 fails
  - CARD order A,B,C passes; others fail
  - WINDOWS KITCHEN,BEDROOM,LIVING passes; others fail and reset
  - COOKER 4 passes
  - NOTE needs GLASSES
  - EARPHONES picker accepts EARPHONES only

ending.test.js
  - resolveEnding for every cause and Presence boundary (59, 60, 99, 100)
  - EAT_PROPERLY iff presence <= balance.final.niceEndingMaxPresence
  - priority LATER > CAUGHT > police_arrived
  - epilogue selection by physical evidence 5, 3, 0
  - no ending changes after ending:trigger

## 3. Manual QA checklist

Core loop
  [ ] First-time player understands what to do in under 90 seconds
  [ ] Every clue reachable without leaving the four rooms
  [ ] No softlocks: items cannot be lost, puzzles can be retried
  [ ] Memory scenes cannot be skipped by accident (SKIP is small, delayed)
Thriller
  [ ] Vikram's route is learnable by the third patrol
  [ ] His footsteps pan and fade correctly on headphones
  [ ] You can always do something (hide, leave, sneak) when he is near
  [ ] Being caught always feels earned
  [ ] AWAY windows allow a fix plus play in Act 2
Horror
  [ ] Only 3 jump scares; each can be softened
  [ ] The whispers overuse "beta" and feel wrong
  [ ] The temptation is visible, tempting and always optional
  [ ] Reduce flash removes bright frames and shakes
Endings
  [ ] All four endings are reachable
  [ ] The LATER ending only clicks because Mom's first text was read
  [ ] End card shows correct "endings found"
Mobile
  [ ] Tap targets comfortable on a 6-inch phone
  [ ] Audio starts after the first tap (iOS Safari and Android Chrome)
  [ ] No scroll bounce, no accidental zoom, no text selection
  [ ] Portrait shows the rotate prompt; landscape resumes cleanly
  [ ] Phone sleep and tab switch pause the game and resume cleanly
Performance
  [ ] 60 fps on a mid phone (or CPU x4 throttled)
  [ ] No memory growth over a 20 minute run
Release
  [ ] Production build works from a subfolder and offline after load
  [ ] Assets under 20 MB
  [ ] No console errors or warnings
  [ ] Content notes shown on the title screen

## 4. Playtest protocol (do this with 3 friends)

  - Give them headphones. Say only: "Tap to begin."
  - Do not explain anything. Watch silently. Take notes.
  - Record: time to first voicemail played, number of times caught, where they
    got stuck for more than 60 seconds, what they said out loud.
  - Ask afterwards: which moment felt saddest, which felt scariest, was
    Vikram fair, did the ending make sense.
  - After each playtest, change at most 2 numbers, then test again.

What to watch for:
  Stuck on a clue         -> add a better in-world hint, not an arrow
  Caught too often        -> sight/noise numbers or footstep audio issue
  Never saw the Hollow    -> Presence too hard to raise; check wrong fixes
  Pressed the temptation immediately -> make the clue (Mom's text) more visible
  Skipped memories        -> check SKIP timing and the "lets it in" line

## 5. Playtest log (local only)

A JSON object kept in memory and downloadable from the debug panel:

```js
{
  startedAt, endedAt, endingId, cause, runSeconds,
  batteryAtEnd, presenceAtEnd, noisePeak,
  wrongFixes, replays, skippedMemories, hides, investigations, timesSpotted,
  evidencePhysical, assist,
  timeline: [ { t, event, detail } ]   // major events only
}
```

## 6. Balance targets

  Run length (first time)         18 to 22 minutes
  Battery at the end (median)     8 to 15 percent
  Times investigated per run      6 to 12
  Times spotted per run           1 to 3
  Presence at the end (median)    20 to 45
  Share of players reaching EAT_PROPERLY   about 40 to 50 percent
  Share reaching LATER via temptation      about 10 to 20 percent
  Share ending CAUGHT                      about 20 to 30 percent

Tune with the table in docs/03 section 15. Change at most two numbers per
iteration and record the change in docs/00_INDEX.md.

## 7. Known risks and mitigations

  Risk: Vikram's AI is the hardest part.
  Fix:  keep it as written. Do not add pathfinding or randomness beyond the
        hunt room order. The three sub-steps in Stage 3 exist for this reason.

  Risk: scope creep (puzzles plus stealth plus horror).
  Fix:  if time runs out, cut in this order: VM3 window puzzle -> replace with
        a single "close the window" tap; VM2 card -> single tap; Nani warning
        lamp. Never cut the endings, the temptation, or the memory scenes.

  Risk: audio is the game. Placeholder audio will make it feel flat.
  Fix:  record real voices early. Even a phone recording of a relative saying
        the lines beats text-to-speech for emotion.

  Risk: mobile browsers block audio until a tap.
  Fix:  the headphone gate does this. Never remove it.

  Risk: RenderTexture performance on low-end phones.
  Fix:  one render texture, lower resolution (0.5 scale) with linear
        filtering if fps drops below 45.

  Risk: players read the whispers as Nani and trust them.
  Fix:  the "beta" overuse and the teal subtitle colour; keep the voice odd.
