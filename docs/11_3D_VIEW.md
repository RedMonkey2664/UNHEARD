# 11 - 3D first-person view

Added on the user's request (2026-10-18). Three.js (exact version 0.185.1)
was approved by the user as a new dependency. The 2D side view is kept as
"2D classic"; the title screen switches between them (setting `view3d`,
default true, saved with the other settings).

## 1. What changes and what does not

Unchanged: every system in src/systems, every number in balance.js, the
rooms, hotspots, puzzles, script, endings, the HUD, the phone and the
UIScene. The game is still played on one line per room: room x from docs/04.

Changed in 3D: only how the room is drawn and how the player points at
things.

  - The player is the camera, walking along the room at z = TRACK_Z.
  - 1 room px = 1 cm. The back wall is z = 0; every hotspot, door and hide
    spot is built at its docs/04 x against the back wall.
  - The torch is a spotlight in the hand; the phone glow is a small light
    that is always on. Presence turns the ambient light teal; flicker and
    blackouts come from the same FlickerController as in 2D.
  - Vikram is a figure at z = 1.25, at his state x. The Hollow, Nani's
    glimpses and the chai offer are shown at the x the 2D code uses.
  - Hiding moves the camera into the hiding place, facing out into the
    room, framed by the furniture (doors ajar, curtain edges, sofa back,
    bed underside).

## 2. Files

  src/render3d/View3D.js      renderer, camera, lights, characters, picking
  src/render3d/props3d.js     the four rooms built from code (low-poly)
  src/render3d/textures3d.js  canvas textures: walls, floor, calendar, static

RoomScene creates the view when `settings.view3d` is on. Its own camera is
set to alpha 0 (Phaser skips drawing it but keeps input), the 2D hit areas
are disabled, and render3d() replaces the 2D layers. The Phaser canvas is
transparent and sits above the Three.js canvas, so the HUD stays on top.

## 3. Controls in 3D

  Phone:    drag to look; tap the floor to walk; tap an object, door or
            hiding place to walk there and use it. Buttons as in 2D.
  Keyboard: W/S walk where you look, A/D step sideways, arrow keys turn,
            drag the mouse to look, click to walk or use, E uses the
            nearest object. F, Shift/C, H, P/Tab, Space as in 2D.

A press that moves more than 10 game px is a look, not a tap.
