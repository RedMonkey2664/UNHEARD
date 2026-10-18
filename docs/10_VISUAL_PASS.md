# 10 - Visual pass ("Stage 1.5")

A visual pass only. No gameplay changes, no number changes.

## Goal

Replace the greybox look with a hand-drawn-feeling, atmospheric look, drawn
entirely in code (Phaser Graphics, generateTexture at boot). If a real PNG for
a key exists in public/assets/img (bg_hall, bg_living, bg_kitchen,
bg_bedroom, spr_player, spr_vikram, spr_nani_far, spr_nani_cup, spr_hollow),
use the PNG instead. Same keys, so real art can drop in later.

## 1. Room shell (all rooms)

- Wall: vertical gradient from teal 0x1F3A3A (mid) to near-black at the top,
  a darker wainscot band in the lower third, skirting board, faint wall
  stains and peeling-paint patches (seeded random, so they never change).
- Floor (y 430 to 540): two-tone tiles with grout lines, slightly lighter near
  the light source, a soft reflection streak under each lamp.
- Ceiling shadow band, a tube-light fixture with a warm glow rectangle, a
  switchboard with two switches, a ceiling fan in Living and Bedroom (slow
  rotation).
- Film grain overlay (subtle, animated at 8 fps) and an edge vignette.

## 2. Per-room props

Flat silhouettes, 2 to 3 tones, a warm rim light on the side nearest the lamp,
positioned at the hotspot x values in docs/04.

- HALL: four doors with frames, panels, handles; the front door with a
  chain and deadbolt and a withered marigold garland; umbrella stand with a
  black umbrella; wall clock with hands stopped at 11:42; low table with a
  steel cup (with steam particles, NG1); coat hooks with a grey coat; shoe
  rack with slippers.
- LIVING: sofa with cushions; jute curtain (hide spot) that sways slightly;
  old radio on a shelf with an amber dial glow; grocer's calendar with a red
  circle; glass coffee table with an ashtray; TV on a doily with a red
  standby LED; side table with a drawer; barred window showing the night
  (streetlight glow, passing headlight sweeps); a garlanded photo of Nani
  with a small diya flame on a shelf (this is the emotional anchor, give it
  a soft warm glow).
- KITCHEN: gas stove with a pressure cooker and a blue pilot dot; steel racks
  with utensils; shelf with a recipe notebook; drawer; steel locker with a
  dial; pantry door (hide spot); barred window; tiled backsplash; a kettle.
- BEDROOM: neat bed with hospital-corner sheet; nightstand with a lamp (warm
  glow) and a folded note; desk with newspaper cuttings; dresser with bangles
  and a small mirror; wardrobe (hide spot); window with curtain; a small
  framed photo.

## 3. Lighting and atmosphere

- Keep the darkness layer from docs/02 section 8, but make the torch a soft
  warm-white gradient with a slight bias in the facing direction.
- Tiny emissive details stay faintly visible even in total darkness (drawn
  above the darkness layer at low alpha): radio dial, TV standby LED, cooker
  pilot, the diya, window streetlight glow, the bedroom lamp. They help the
  player orient and make the dark feel designed.
- Dust motes drifting inside the torch light. Window rain streaks and a rain
  sound-ready overlay that appears when VM3's windows are open.
- All of this respects the Reduce flash setting (no flicker spikes).

## 4. Hotspots and labels

- Hide the grey rectangles in normal play. Show a slow pulsing glint or
  sparkle on interactables within the hint distance (120 px, 80 px if the
  torch is off), controlled by the "Hotspot hints" setting.
- Show a hotspot's label only when the player is within interactRange
  (70 px), fading in above the object. Never show two labels that overlap: if
  two hotspots are within 90 px, show only the nearest.
- Remove the large debug room-name text. Show the room name for 2 s as a
  small elegant caption when entering a room.
- Rectangles and labels still appear when the debug "show hitboxes" toggle is
  on.

## 5. Characters

Silhouette-led, drawn in code, same keys as the PNG list.

- Player: hoodie silhouette, head, a small phone glow in the hand, 4-frame
  walk bob and a lower sneak posture.
- Vikram: taller, neat shirt, a key-ring glint; walk, search (head turns)
  and chase poses.
- Nani: small figure in a white saree, grey bun, steel cup, soft warm rim
  light.
- Hollow: tall, thin, over-long arms, no face in the dark.

## 6. HUD and phone polish

- Fonts per docs/07 (Inter, Lora Italic, Caveat) with a system-font fallback
  and a timeout on document.fonts.ready.
- Draw icons in code: segmented battery with a glow that goes amber then red,
  torch, sneak (footprints), phone. Noise bar: segmented, tick mark at 60,
  colour states per docs/07. Round glass-style buttons with a press
  animation.
- Phone panel drawn as a phone device: bezel, notch, rounded screen, tabs with
  an underline, voicemail rows with status chips (DONE, DAMAGED, LOCKED),
  progress bar; slide-up animation.
- Subtitle strip, objective banner and toasts styled consistently with the
  palette tokens.

## 7. Title screen

- Dark scene with the silhouette of a window and a shimmer of static; the
  title "UNHEARD" in a thin serif with an occasional letter glitch; tagline
  fades in; four ending dots; content notes in small text.

## 8. Rules

- Generate all textures once at boot. No per-frame allocations. Keep 60 fps.
- Add a debug toggle "Art preview" that disables the darkness layer so the
  rooms can be inspected.
- Do not change gameplay, hotspot coordinates, balance.js or any data files.
- All colours come from COLORS in constants.js (add tokens if needed).

## Done when

- Every room looks furnished and distinct with the torch ON and readable with
  the torch OFF through the emissive details.
- No overlapping labels. No grey boxes unless hitboxes are on.
- HUD, phone and title screen use the new styling.
- npm test passes, npm run build succeeds, and npm run dev shows it.
