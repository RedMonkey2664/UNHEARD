# 07 - UI, UX, art and audio

## 1. HUD layout (960 x 540)

```
+--------------------------------------------------------------+
| [BATTERY 74%]        (objective line, 5 s)      [NOISE ||||  ]|
|                                                              |
|                                                              |
|                    ROOM VIEW (darkness layer)                |
|                                                              |
|     subtitle line (bottom centre, over a soft dark strip)    |
| [TORCH] [SNEAK]                         [CALL*]   [PHONE]    |
+--------------------------------------------------------------+
  * CALL only after the tape is taken. POLICE 1:15 shows beside it.
```

Elements:
  Battery (top left)   icon plus percent. Colour: cream above 30, amber
                       15 to 30, red and blinking below 15.
  Noise (top right)    thin horizontal bar, 120 px wide. Colour: teal-cream
                       0 to 39, amber 40 to 59, red and pulsing 60+. A faint
                       red vignette at the screen edge pulses when noise >= 40.
  Torch button         bottom left, 56 px round. Toggle.
  Sneak button         next to it, 56 px round. Toggle. Highlighted when on.
  Phone button         bottom right, 56 px. Opens the phone panel. A small dot
                       appears when a new message or voicemail is available.
  Objective line       top centre, appears for 5 s on act changes and on
                       request from the phone NOTES tab.
  Subtitles            bottom centre, max 2 lines, 22 px, speaker colour from
                       docs/05, 70 percent dark strip behind.
  Context button       appears near the player when a hide spot is within 80 px
                       (HIDE) or when hidden (COME OUT).
  Toast                small text above the subtitle line, 2.5 s.
  Hotspot hint         a faint outline or pulsing dot on interactables within
                       120 px (80 px when the torch is off). Setting can turn
                       this off.

Presence is never shown on screen.

## 2. Controls

Touch:
  tap floor            walk to that x
  tap hotspot          walk to it, then interact (if within 70 px)
  tap door             walk to it, then pass through
  tap HIDE / COME OUT  hide or leave the hide spot
  tap TORCH / SNEAK    toggle
  tap PHONE            open or close the phone
  tap and hold the phone panel top bar  nothing (no drag)

Desktop:
  click                same as tap
  A / D or Left / Right  walk
  E                    interact with the nearest hotspot in range
  H                    hide / come out
  F                    torch
  Shift                sneak (hold) or toggle with C
  P or Tab             phone
  Space                pause/resume the voicemail that is playing
  `                    debug panel (dev builds only)

Movement stops immediately when the player is locked (playback, memory,
cutscenes, corner event).

## 3. Phone UI

Size 300 x 380, anchored bottom right, slides up in 0.25 s. 92 percent opaque.
The game keeps running behind it. The room area above it stays tappable.

```
+------------------------------+
| 9:52 PM             BAT 74%  |
|------------------------------|
| VOICEMAIL  MESSAGES  NOTES   |
|------------------------------|
|  1  Exam Week          done  |
|  2  Birthday           done  |
|  3  Monsoon      DAMAGED     |
|     [PREVIEW 3s] [FIX] [PLAY]|
|  4  Dal                locked|
|  5  The Argument       locked|
|  6  Hospital           locked|
|  7  The Silent One     locked|
|  8  ??? ??? ???        locked|
|------------------------------|
|  [PLAY #8 NOW]  (after VM4)  |
+------------------------------+
```

Voicemail row states:
  done       grey. Tap to replay (costs battery, Presence +10, no memory).
  current    expanded with buttons:
               PREVIEW 3s  always enabled (free)
               FIX         enabled when status is damaged
               PLAY        enabled when status is fixed
               while playing: PAUSE / RESUME and a progress bar
  locked     greyed. Tap shows toast "Not yet."
  row 8      shows "???" until an ending plays it.

Smudged stamps: show stamp from data ("██:██") for VM1 to VM6, "11:42 PM" for
VM7 (it is not smudged: the one clear time on the phone).

FIX behaviour per type:
  RADIO, CARD, WINDOWS, COOKER, NOTE   the FIX button shows
        voicemails[n].previewLabel as a toast and does nothing else. The
        fix happens in the house.
  EARPHONES   FIX opens the ItemPicker.

Playing: the player is locked, the torch switches off, the screen shows the
phone glow only. A thin progress bar and subtitles follow the audio.

Pause: stops battery drain and noise. Hint (shown only if noise >= 60):
"Pause and hide."

MESSAGES tab: list of texts with time. Mom 1 and Mom 2 shown in order.
NOTES tab: objective, hint (after 90 s and 180 s), evidence list, locker code
(once E4). In Act 5 the NOTES tab also shows the call tip: "Hold still while
it connects."

CALL (after the tape): a large green button at the top of the phone and a
small one on the HUD. Shows the progress ring while connecting and the ETA
when connected.

PLAY #8 NOW row: appears after VM4's memory, full width, teal, slow pulse,
subtitle under it: "Saves battery." Nothing else.

## 4. Puzzle UIs (all small modals over the room)

RadioDial   a horizontal dial 88.0 to 108.0, drag or step buttons -0.1 / +0.1,
            large readout, CONFIRM. Static audio gets quieter near 94.3 only
            while the player is within 1.0 MHz (a small gift to the ear).
CardAssembler  tray of three scrap images (text visible), three slots. Tap a
            scrap then a slot. On the third placement, auto-validate.
CounterDial  a big number 0 to 9 with plus and minus, CONFIRM. A small steam
            animation.
NoteReader  the note in large handwriting font (Caveat), glasses lens overlay
            circle. JUMP SCARE 1 happens here after the last line.
ItemPicker  grid of tools in inventory (GLASSES, EARPHONES) with icons. Tap to
            choose, then CONFIRM. Empty: "You need something for that."
Keypad      4-digit number pad. Wrong code: shake and red flash (not with
            Reduce flash on).
All puzzle modals have a CLOSE button. While a modal is open the player is
not locked and noise accrues at the puzzle rate.

## 5. Feedback and juice

  - Every interaction: small sound plus a 120 ms scale pop on the hotspot.
  - Wrong fix: short buzz, screen shake 6 px for 200 ms (off with Reduce flash).
  - Spotted by Vikram: heartbeat starts, music ducks, a 0.3 s red edge pulse.
  - Hiding: a darker vignette closes in, ambience muffles (low-pass if
    available), heartbeat rises with noise.
  - Battery below 15: the phone icon blinks, a soft low-battery tone each 20 s.
  - Mobile vibration (navigator.vibrate) only if the player enables it in
    settings: 40 ms when investigating, 200 ms when spotted.

## 6. Art direction

Style: flat, painterly 2D, side view, strong silhouettes, textured lighting.
Think warm lived-in Indian middle-class flat at night: steel almirah, ceiling
fan, plastic chairs, marigold calendar, pressure cooker, jute curtain, tiled
floor, yellow tube-light glow, a TV on a doily.

Mood arc: warm lamp yellow -> cold teal as Presence rises (TintLayer).
Everything is darker than you expect. Only the torch circle matters.

Palette tokens (src/config/constants.js):
```js
export const COLORS = {
  void:    0x050708,
  wall:    0x1F3A3A,
  lamp:    0xF2B35A,
  cream:   0xF3DDB1,
  cold:    0x4FD1C5,
  danger:  0xC0392B,
  panel:   0x101617,
  line:    0x2B3B3B,
  text:    0xE8E2D0
};
```

Room descriptions (for the artist or AI image prompts; keep the same style):
  Hall      narrow corridor, four doors, umbrella stand, wall clock stopped at
            11:42, a low table with a steel cup, coat hooks, a shoe rack, a
            heavy front door with a chain and a deadbolt.
  Living    sofa, curtain, old radio on a shelf, grocer's calendar, glass-top
            coffee table with an ashtray, TV on a doily, a side table with a
            drawer, a window with grill.
  Kitchen   gas stove with a pressure cooker, steel racks, a shelf with her
            recipe notebook, a drawer, a steel locker with a dial, a pantry
            door, a window.
  Bedroom   a bed with a neat bedsheet, a nightstand with a lamp and a note,
            a desk with newspaper cuttings, a dresser with bangles, a wardrobe,
            a window.

Characters (silhouette-led, little detail):
  Player    simple hoodie silhouette, phone glow in hand. Idle, walk (4
            frames), sneak (4 frames), hide (no sprite).
  Vikram    tall, neat kurta or shirt, a key ring in hand. Idle, walk (4),
            search (looking around, 4), chase (4). Visible only in the torch
            or within 130 px.
  Nani      small, white saree, grey bun, a steel cup. Used as a far figure and
            as the steaming cup. Soft rim of warm light, never scary.
  Hollow    tall, thin, too-long arms, no face in the dark, then Nani's face
            slightly wrong (eyes a little too far apart, smile a little late).

Fonts (all open-licence, self-hosted woff2 in public/assets/fonts, loaded via
@font-face in index.html; wait for document.fonts.ready before Phaser starts):
  UI        Inter (400, 600)
  Memory    Lora Italic
  Notes     Caveat

## 7. Image asset list

Backgrounds (PNG, 1920 x 1080, drawn at 960 x 540):
  bg_hall.png  bg_living.png  bg_kitchen.png  bg_bedroom.png
Sprites (PNG sheets, transparent, height about 190 px at 1x):
  spr_player.png  spr_vikram.png  spr_nani_far.png  spr_nani_cup.png
  spr_hollow.png  spr_hollow_face.png
Prop overlays (optional, same size as backgrounds or small):
  ov_window_open_living.png  ov_window_open_kitchen.png
  ov_window_open_bedroom.png  ov_tv_static.png  ov_radio_on.png
Item icons (64 x 64): it_glasses it_earphones it_card_a it_card_b it_card_c
  ev_lighter ev_deed ev_page ev_note ev_slip ev_tape
UI (optional; the UI can be drawn with code at first):
  ui_phone_frame.png  ui_battery.png  ui_torch.png  ui_sneak.png
Memory stills (optional, 1280 x 720, soft focus, warm):
  mem_1.png to mem_7.png
Ending stills (optional): end_corner end_blue_flame end_table end_hollow
  end_phone_dead
Generated at boot (no file): light_mask (radial gradient 512 x 512).

If any file is missing: coloured rectangles with labels, per docs/02 section 10.

## 8. Audio design

Format: provide both ogg (96 kbps mono) and mp3 for every file so Safari plays
them. data/assets.js lists keys with an array of urls.

### 8.1 Voice (record with a real person if you can)
  vm1 vm2 vm3 vm4 vm5 vm6 vm7 vm8     the 8 voicemails (docs/05 durations)
  vm1_damaged ... vm6_damaged         the damaged versions (static, skipping,
                                      rain, whistle, muffled, quiet). Only the
                                      first 3 seconds are used for preview. If
                                      you do not make them, apply a runtime
                                      filter to the clean file (noise layer).
  tape_clip                           8 s tape audio (docs/06 section 1.2)
  you_later                           young voice: "Nani, later. I am studying."
  op_1                                operator: "Police are on their way..."
  mom_1 mom_2 mom_3                   Mom lines (docs/06 endings)
  police_1 police_2                   "Police! Darwaza kholiye!" and "Aap
                                      theek hain?"
  Vikram barks: vik_entering vik_p1..p5 vik_i1..i3 vik_s1..s3 vik_c1..c3
                vik_caught vik_h1..h4 vik_a1..a2  (docs/05 texts.barks)
  Hollow: hol_1 .. hol_8              whispers (docs/05 texts.hollow)
  Nani: nani_chai  nani_touch

### 8.2 SFX
  sfx_step_vik_01..04    Vikram footsteps on tile (loop variants)
  sfx_step_player_01..04 player steps, softer
  sfx_key_lock           key in the lock
  sfx_door_open  sfx_door_close  sfx_door_slam
  sfx_pickup  sfx_interact  sfx_wrong  sfx_fix_ok
  sfx_phone_buzz  sfx_phone_tap  sfx_battery_low
  sfx_radio_static  sfx_radio_tune
  sfx_cooker_whistle  sfx_rain_loop  sfx_window_open
  sfx_heartbeat_loop  sfx_breath_hold
  sfx_flicker  sfx_lamp_tick (Nani's warning)
  sfx_tv_static  sfx_stinger_1  sfx_stinger_2  sfx_stinger_3
  sfx_gas_whump  sfx_fall_stairs  sfx_siren_loop  sfx_pounding
  sfx_tape_click

### 8.3 Ambience and music
  amb_flat_loop       fridge hum, ceiling fan, far traffic. Always on, quiet.
  amb_cold_loop       the same room tone with the warmth removed (crossfaded
                      in with Presence 0 to 100)
  music_memory_loop   soft santoor or harmonium, 20 s loop, only in memories
  music_dread_loop    low drone, enters at Act 2, volume rises with Act
  music_ending_*      optional per ending
Free sources: Freesound.org (check licence), your own recordings, Audacity for
distortion and static. Do not use copyrighted songs.

### 8.4 Mix levels (relative)
  voicemail voice    -6 dB
  Vikram barks       -9 dB
  Vikram footsteps   -8 dB at 0 distance
  Hollow whispers    -18 dB at Presence 60, rising to -8 dB at 100
  ambience           -24 dB (ducked to 40 percent while voices play)
  music              -20 dB (ducked to 25 percent while voices play)
  stingers           -6 dB (-12 dB with Reduce flash)

### 8.5 Spatial footsteps for Vikram (the core thriller cue)
Rules, every frame while he is moving and not AWAY:
  same room:
      volume = lerp(1.0, 0.45, clamp(dist / 700, 0, 1)) x base
      pan    = clamp((vx - px) / 480, -0.9, 0.9)
  adjacent (through the Hall):
      volume = 0.35 x base (0.25 if no low-pass filter available)
      low-pass around 700 Hz if the Web Audio context allows
      pan: room positions LIVING -1, KITCHEN 0, BEDROOM +1, HALL uses x:
           pan = clamp((roomPos(v) - roomPos(p)) x 0.7, -0.9, 0.9)
           (in the Hall use (vx - doorX of the player's room) / 480)
  elsewhere: silent
Step interval: 0.55 s at speed 110. Scale inversely with speed.
At vikram AWAY, in the Hall near x = 880: play vik_a1 / vik_a2 faintly
through the door.

### 8.6 Ducking and ordering
  - Only one voicemail voice at a time. The Hollow layer may overlap it.
  - A bark never starts while another bark is playing or within 12 s of the
    last one.
  - Heartbeat loop volume = clamp(noise / 100, 0, 1) x 0.8.

### 8.7 Missing audio
If a key is missing, AudioDirector uses the fallback duration from
data/assets.js, shows the subtitle, and emits the same events. The game must
be playable in silence.

## 9. Accessibility and settings

Title screen settings (all stored in localStorage key unheard.settings):
  Assist mode            on or off (docs/03 section 13)
  Reduce flash           on or off (no bright frames, no shake, softer
                         stingers, no red flash on Keypad)
  Volume                 master, voice, sfx
  Hotspot hints          on or off
  Vibration              on or off (mobile only)
Always on: subtitles. Subtitle size S / M / L (default M).
Colour is never the only cue: the noise bar also has a label tick at 60 and an
icon change.
All text min 16 px at 960 wide. Touch targets 44 px minimum after scaling.

## 10. Scene flow

```
Boot -> Title -> HeadphoneGate -> RoomScene (+UIScene)
                                     |
                      MemoryScene <--+--> EndingScene -> Title
```
RoomScene and UIScene run together. MemoryScene pauses RoomScene's simulation
(Vikram frozen). EndingScene replaces them.

## 11. Memory scene visual spec

  - background: near-black warm (0x120C08) with a soft lamp-coloured vignette
  - text: Lora Italic 28 px, cream, centre, max width 640 px, fade in/out 0.6 s
  - one beat every 5 s (4 beats)
  - optional: a blurred still (mem_n) at 30 percent opacity behind the text
  - music_memory_loop plays, ambience muffled
  - SKIP button bottom right appears after 4 s, small and grey. Under it, in
    very small text on the first appearance only: "Skipping lets it in."
  - at the end: a 1 s breath of silence, then back to the room

## 12. Title screen

  - black background, "UNHEARD" in a thin serif, tagline below, a faint
    static shimmer
  - content notes (small), settings icon, BEGIN button
  - endings found: four small dots, lit when found
