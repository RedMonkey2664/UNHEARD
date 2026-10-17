// Tools, card pieces, evidence. Copied from docs/04 section 4.

export const TOOLS = {
  GLASSES:   { name: "Nani's glasses",   desc: 'Reading glasses mended with cello-tape.', icon: 'it_glasses' },
  EARPHONES: { name: 'Earphones',        desc: 'Tangled white earphones.',                icon: 'it_earphones' }
};

// Stored in state.cardPieces, NOT in inventory.tools, so the VM6 item picker
// never lists them. Consumed when the card is assembled.
export const CARD_PIECES = {
  CARD_A: { name: "Card scrap: 'Happy'",     icon: 'it_card_a' },
  CARD_B: { name: "Card scrap: 'Birthday,'", icon: 'it_card_b' },
  CARD_C: { name: "Card scrap: 'beta.'",     icon: 'it_card_c' }
};

export const EVIDENCE = {
  E1: { name: "Vikram's lighter",      kind: 'physical', desc: "Silver, engraved V.M. Found in Nani's ashtray." },
  E2: { name: 'Torn property deed',    kind: 'physical', desc: 'Hidden inside the birthday card.' },
  E3: { name: 'Voicemail: the argument in the rain', kind: 'audio',
        desc: "Vikram's voice, begging her to sign." },
  E4: { name: 'Notebook page 2',       kind: 'physical', desc: 'Locker code 0614.' },
  E5: { name: "Nani's unsent note",    kind: 'physical', desc: "'If something happens, don't trust V.'" },
  E6: { name: 'Hospital visitor slip', kind: 'physical', desc: "'V. Mehra - ICU 2 - 9:40 PM'" },
  E7: { name: 'Voicemail: the night she fell', kind: 'audio',
        desc: 'A key in the lock. His voice. A thud.' },
  E8: { name: "Nani's tape recorder",  kind: 'physical', desc: 'The real proof.' }
};
