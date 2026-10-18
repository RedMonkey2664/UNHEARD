# UNHEARD

A short (about 20 minutes), headphone-first horror-thriller for the browser.

The night after Nani's funeral you are alone in her flat with her phone and
seven damaged voicemails. Restore them in order, find the proof, and survive
until the police arrive. One battery powers your torch, the voicemails and the
call. Someone with a key is walking the flat. Something in the static wants
you to rush.

Best played in the dark, with headphones.

## Play

- **Desktop:** any modern browser. A/D or arrows to walk, E to interact,
  F torch, Shift or C sneak, H hide, P or Tab phone, Space to pause a
  voicemail.
- **Phone:** hold it in landscape. Tap the floor to walk, tap objects to look,
  and use the buttons for torch, sneak, hide and phone. The first tap goes
  fullscreen. Use "Add to Home Screen" to install it like an app; after the
  first play it also works offline.

Content notes: death of a loved one (implied violence, nothing shown),
psychological horror, 3 jump scares, flashing lights (can be reduced in
settings).

## Develop

Requires Node 20+.

```
npm install
npm run dev      # dev server (add the network URL on your phone)
npm test         # unit tests (Vitest)
npm run build    # static site in dist/
```

The backtick key opens the debug panel in dev builds.

The design docs are in `docs/`; `CLAUDE.md` is the build brief.

## Deploy

The build is a static site in `dist/` and works from any subfolder.

- **Vercel:** import this repository; `vercel.json` sets the Vite build and
  `dist/` output. Every push to `main` redeploys.
- **itch.io:** zip the contents of `dist/` (index.html at the zip root) and
  upload as an HTML game, viewport 960 x 540, with "Mobile friendly" and
  "Fullscreen button" ticked.

App icons are generated with `node scripts/make-icons.mjs`.
