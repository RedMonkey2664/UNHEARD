# UNHEARD - Claude Code project brief

You are building UNHEARD: a short (18-22 minute) browser game. A headphone-first
emotional horror-thriller. Read this file fully, then read docs/00_INDEX.md.

## One-line pitch

The night after Nani's funeral you are alone in her flat with her phone and 7
damaged voicemails. Each one holds evidence that her "accident" was murder.
Her nephew Vikram has a key and is hunting for the phone. A ghost called the
Hollow lives in the static and wants you to rush. Nani's ghost quietly helps.

## Player motive and hard constraints (never lose sight of these)

Motive:
  Restore and hear all 7 voicemails, collect the proof, open Nani's locker,
  call the police, and survive until they arrive.

Constraints:
  1. One battery (100%) powers the torch, the voicemail player and the call.
  2. Vikram patrols the flat in real time. Noise and light give you away.
  3. Voicemails must be heard in order. Each must be fixed with a clue from
     the house before it can be played.
  4. A hidden Presence meter tracks the Hollow. Rushing and mistakes raise it.
  5. A "PLAY #8 NOW" shortcut appears after voicemail 4. It is a trap.

## Source of truth (if two files disagree, the higher one wins)

  1. docs/03_SYSTEMS_AND_BALANCE.md     all numbers, formulas, state machines
  2. docs/04_WORLD_ROOMS_AND_ITEMS.md   rooms, coordinates, puzzles, items
  3. docs/05_SCRIPT_AND_NARRATIVE.md    all text, voice lines, data files
  4. docs/06_ENDINGS_AND_FINAL_ACT.md   final act and the 4 endings
  5. docs/01, 02, 07, 08, 09            everything else
If you find a conflict, stop, tell the user which two files disagree, and
propose a fix. Do not silently pick one.

## Tech stack (do not change without asking the user)

  - Phaser 3 (latest 3.x), plain JavaScript (ES modules), no TypeScript
  - Three.js 0.185.1 for the 3D first-person view (approved by the user, docs/11)
  - Vite for dev server and build, Vitest for unit tests
  - Node 20+
  - No backend, no analytics, no external CDN, no external fonts at runtime
  - Output: static site in dist/ that works on itch.io, GitHub Pages, Vercel

Commands you must keep working:
  npm install
  npm run dev        (Vite dev server)
  npm run build      (outputs dist/, base './')
  npm test           (Vitest, pure-logic tests)

## Architecture rules

1. Pure logic lives in src/systems/ and must not import Phaser. It takes state
   and dt and returns changes or emits events on the event bus. This is what
   unit tests cover: Battery, Noise, Presence, VikramAI, EndingResolver,
   VoicemailFlow, FixPuzzles.
2. Phaser code lives in src/scenes/, src/entities/, src/ui/. It only renders
   state and forwards input. No game rules inside scenes.
3. Every number lives in src/config/balance.js (copy from docs/03). No magic
   numbers in code.
4. Every line of story text, voice line, subtitle, examine text and message
   lives in src/data/*.js (copy from docs/04 and docs/05). No story text
   hard-coded in scenes.
5. One global GameState object (shape in docs/02). Systems read and write it.
   Scenes subscribe to events, never poll each other.
6. Missing assets must never crash the game. Audio falls back to a timer using
   the duration in the data file. Images fall back to coloured rectangles.
   The game must be fully playable with zero art and zero audio files.

## Working method

- Work ONE stage at a time from docs/08_BUILD_PLAN_AND_PROMPTS.md.
- Before coding a stage, restate the acceptance criteria in 5 lines or fewer.
- After coding, run npm test and npm run build, then tell the user exactly how
  to try the stage in the browser and what they should see.
- Commit after every stage: "stage N: short description".
- Build the debug panel (docs/09) in Stage 1 and keep it updated. The user
  will tune and test with it.
- If a design decision is missing, choose the simplest option, note it in
  docs/00_INDEX.md under "Decisions made during build", and tell the user.
- Do not add features that are not in the docs. Stretch goals are listed in
  docs/00_INDEX.md and are only built when the user asks.

## Skills policy

Before using any skill, read its description and use it only if it fits the
task. docs/07 and docs/10 define the art direction (palette, mood, fonts).
Skills are for CRAFT (spacing, typography, motion, accessibility, testing).
A skill must never change the palette, the mood or the stack.

Use these skills when the task matches:
- UI polish (HUD, phone panel, title screen, toasts, buttons):
  frontend-design (one copy only), ui-ux-pro-max, redesign-existing-projects,
  high-end-visual-design, design-taste-frontend.
- Motion and micro-interactions (button presses, panel slides, memory-scene
  fades, glitch effects): emil-design-eng, then review-animations to check them.
  Implement them with Phaser tweens, not a new library.
- Static art files (title card, memory stills mem_1..7, ending stills, grain
  and static textures into public/assets/img): canvas-design and
  algorithmic-art. Keep every file under the sizes in docs/07.
- Reference mockups the user gives as images: image-to-code. If an
  image-generation tool is available, imagegen-frontend-mobile /
  imagegen-frontend-web may be used for reference art only. Never ship
  generated images with real logos, brands or recognisable people.
- Verification: webapp-testing (run the game in a browser, take screenshots of
  each room with torch on and with the Art preview toggle, tap through the
  voicemail loop, report console errors) and chrome-browser or
  built-in-browser to look at localhost. Use this at the end of every stage.
- Long data files (voicemails.js, texts.js, endings.js, rooms.js):
  full-output-enforcement, so nothing is shortened or left as a placeholder.

Do NOT use: document, PDF, spreadsheet, slide, Google, Slack, MCP, brand,
theme, video or GSAP skills, and do not use minimalist-ui or
industrial-brutalist-ui (their style clashes with docs/07). Do not add any
dependency that is not Phaser, Vite or Vitest without asking the user first.

## Things you must NOT do

- Do not add gore, graphic violence or real brands, songs or logos.
- Do not use more than 3 jump scares (they are listed in docs/05).
- Do not make Vikram smarter than docs/03 describes. He is deliberately
  predictable so players can learn his pattern.
- Do not reorder or merge the voicemails. Do not change the endings.
- Do not store anything in localStorage except the title-screen settings in
  unheard.settings (assist, reduceFlash, volMaster, volVoice, volSfx,
  hotspotHints, vibration, subtitleSize) and "endings found" in
  unheard.endings.
- Do not add save/load. A run is one sitting.

## Code style

- ES modules, 2-space indent, semicolons, single quotes.
- Small files. One system per file. Name events with colon style
  ('vm:play:end').
- Comment the WHY, not the what. Keep comments short.
- Every system exports a pure factory or class with a clear public API listed
  in docs/02.

## Definition of done (every stage)

  - Runs with npm run dev with no console errors.
  - npm test passes. npm run build succeeds.
  - Works at 960x540 scaled to fit, on desktop and a phone-sized viewport.
  - Debug panel shows the relevant values for the stage.
  - The acceptance checklist for the stage in docs/08 is ticked, in your
    final message, item by item.

## File map

  CLAUDE.md                              this file
  docs/00_INDEX.md                       index, glossary, decisions, stretch
  docs/01_GAME_DESIGN.md                 story, characters, loop, structure
  docs/02_TECH_ARCHITECTURE.md           stack, folders, state, events, rendering
  docs/03_SYSTEMS_AND_BALANCE.md         numbers, formulas, Vikram AI
  docs/04_WORLD_ROOMS_AND_ITEMS.md       rooms, hotspots, puzzles, items
  docs/05_SCRIPT_AND_NARRATIVE.md        all text, voice lines, data modules
  docs/06_ENDINGS_AND_FINAL_ACT.md       final act and endings
  docs/07_UI_UX_ART_AUDIO.md             HUD, phone, art, audio, accessibility
  docs/08_BUILD_PLAN_AND_PROMPTS.md      stages, prompts, acceptance checklists
  docs/09_TEST_QA_AND_DEBUG.md           debug panel, tests, tuning, release
  docs/10_VISUAL_PASS.md                 code-drawn art, lighting, HUD/phone/title styling
  docs/11_3D_VIEW.md                     3D first-person view (Three.js), 2D classic kept
