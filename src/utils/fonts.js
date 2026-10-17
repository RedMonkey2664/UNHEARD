// Loads self-hosted fonts that actually exist, then waits for
// document.fonts.ready with a timeout. Missing fonts fall back to the
// system stacks in constants.js FONTS.

export async function loadFonts(fontFiles, existing, timeoutMs) {
  if (typeof document === 'undefined' || !document.fonts) return;
  const present = new Set(existing);

  for (const f of fontFiles) {
    if (!present.has(f.url) || typeof FontFace === 'undefined') continue;
    try {
      const face = new FontFace(f.family, `url(${f.url})`,
        { weight: f.weight, style: f.style });
      document.fonts.add(face);
      face.load().catch(() => {});
    } catch {
      // A bad font file must never stop the game.
    }
  }

  const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
  await Promise.race([document.fonts.ready.catch(() => {}), timeout]);
}
