import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/config/balance.js';
import { DEFAULT_SETTINGS } from '../src/config/constants.js';
import { completedCount, createState, deriveAct } from '../src/systems/gameState.js';

describe('createState', () => {
  it('matches the docs/02 starting shape', () => {
    const s = createState();
    expect(s.clock.runSeconds).toBe(0);
    expect(s.act).toBe(1);
    expect(s.battery).toBe(BALANCE.battery.start);
    expect(s.noise).toBe(0);
    expect(s.presence).toBe(0);
    expect(s.torchOn).toBe(false);
    expect(s.player).toMatchObject({ room: 'HALL', x: 560, hidden: false, locked: false });
    expect(s.vikram.state).toBe('AWAY');
    expect(s.vikram.seenHiding).toBe(false);
    expect(s.phone).toMatchObject({ open: false, tab: 'VOICEMAIL', playing: false });
    expect(s.inventory).toEqual({ tools: [], evidence: [] });
    expect(s.messages).toEqual([]);
  });

  it('starts VM1 damaged and VM2-7 locked', () => {
    const s = createState();
    expect(Object.keys(s.voicemails)).toHaveLength(7);
    expect(s.voicemails[1].status).toBe('damaged');
    for (let id = 2; id <= 7; id++) expect(s.voicemails[id].status).toBe('locked');
  });

  it('includes the fields added during the pre-flight', () => {
    const s = createState();
    expect(s.flags).toMatchObject({ cardAssembled: false, livingWindowReopened: false,
      callConnectTimer: 0, manifestCount: 0, cornerActive: false, endingCause: null });
    expect(s.presenceState.armed).toEqual({ flicker: true, naniHelp: true,
      whisper: true, manifest: true, doom: true });
    expect(s.hints).toEqual({ currentVm: 1, damagedSeconds: 0 });
  });

  it('merges settings over the defaults', () => {
    expect(createState().settings).toEqual(DEFAULT_SETTINGS);
    const s = createState({ assist: true, subtitleSize: 'L' });
    expect(s.settings.assist).toBe(true);
    expect(s.settings.subtitleSize).toBe('L');
    expect(s.settings.volMaster).toBe(1);
  });

  it('returns independent objects each call', () => {
    const a = createState();
    const b = createState();
    a.voicemails[1].status = 'done';
    a.inventory.tools.push('GLASSES');
    expect(b.voicemails[1].status).toBe('damaged');
    expect(b.inventory.tools).toEqual([]);
  });
});

describe('deriveAct', () => {
  function withCompleted(n) {
    const s = createState();
    for (let id = 1; id <= n; id++) s.voicemails[id].status = 'done';
    return s;
  }

  it.each([[0, 1], [1, 1], [2, 2], [5, 2], [6, 3], [7, 4]])(
    'completed %i -> act %i', (n, act) => {
      const s = withCompleted(n);
      expect(completedCount(s)).toBe(n);
      expect(deriveAct(s)).toBe(act);
    });

  it('tape taken -> act 5', () => {
    const s = withCompleted(7);
    s.flags.tapeTaken = true;
    expect(deriveAct(s)).toBe(5);
  });
});
