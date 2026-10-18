import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/config/balance.js';
import { createEventBus } from '../src/systems/eventBus.js';
import { createState } from '../src/systems/gameState.js';
import { createNoise, isAdjacent, proximity } from '../src/systems/noise.js';
import { runFor } from './helpers.js';

const N = BALANCE.noise;

function withVikram(room, x, playerRoom = 'HALL', playerX = 500) {
  const s = createState();
  s.vikram.state = 'PATROL';
  s.vikram.room = room;
  s.vikram.x = x;
  s.player.room = playerRoom;
  s.player.x = playerX;
  return s;
}

describe('proximity', () => {
  it('same room close / mid / far', () => {
    expect(proximity(withVikram('HALL', 600))).toBe(N.prox.sameClose);
    expect(proximity(withVikram('HALL', 800))).toBe(N.prox.sameMid);
    expect(proximity(withVikram('HALL', 950))).toBe(N.prox.sameFar);
  });

  it('adjacent only through the Hall; other rooms elsewhere; AWAY is 0', () => {
    expect(proximity(withVikram('KITCHEN', 400))).toBe(N.prox.adjacent);
    expect(proximity(withVikram('KITCHEN', 400, 'LIVING'))).toBe(N.prox.elsewhere);
    const s = withVikram('HALL', 500);
    s.vikram.state = 'AWAY';
    expect(proximity(s)).toBe(0);
    expect(isAdjacent('HALL', 'BEDROOM')).toBe(true);
    expect(isAdjacent('LIVING', 'BEDROOM')).toBe(false);
  });
});

describe('noise tick', () => {
  const bus = createEventBus();

  it('walking near him rises at rise.walk x sameClose', () => {
    const s = withVikram('HALL', 600);
    s.player.moving = true;
    createNoise(bus).tick(s, 1);
    expect(s.noise).toBeCloseTo(N.rise.walk * N.prox.sameClose, 6);
  });

  it('sources stack: sneak + torch + voicemail + puzzle', () => {
    const s = withVikram('HALL', 800);           // sameMid x1.0
    Object.assign(s.player, { moving: true, sneaking: true });
    s.torchOn = true;
    s.phone.playing = true;
    s.ui.puzzleOpen = true;
    createNoise(bus).tick(s, 1);
    expect(s.noise).toBeCloseTo(N.rise.sneak + N.rise.torch + N.rise.voicemail + N.rise.puzzle, 6);
  });

  it('paused playback adds nothing', () => {
    const s = withVikram('HALL', 800);
    s.phone.playing = true;
    s.phone.paused = true;
    s.noise = 10;
    createNoise(bus).tick(s, 1);
    expect(s.noise).toBe(10 - N.decayIdle);
  });

  it('nothing rises when he is away; noise decays at 8/s', () => {
    const s = withVikram('HALL', 600);
    s.vikram.state = 'AWAY';
    s.player.moving = true;
    s.noise = 50;
    createNoise(bus).tick(s, 2);
    expect(s.noise).toBe(50 - 2 * N.decayIdle);
  });

  it('hidden with him in the room decays at only 4/s', () => {
    const s = withVikram('HALL', 600);
    s.player.hidden = true;
    s.noise = 50;
    createNoise(bus).tick(s, 2);
    expect(s.noise).toBe(50 - 2 * N.decayHiddenSameRoom);
  });

  it('clamps 0 to 100; Assist multiplies by noiseMult', () => {
    const s = withVikram('HALL', 600);
    s.player.moving = true;
    const n = createNoise(bus);
    runFor((dt) => n.tick(s, dt), 20);
    expect(s.noise).toBe(100);
    const a = withVikram('HALL', 600);
    a.settings.assist = true;
    a.player.moving = true;
    n.tick(a, 1);
    expect(a.noise).toBeCloseTo(N.rise.walk * N.prox.sameClose * BALANCE.assist.noiseMult, 6);
  });
});

describe('spikes', () => {
  it('scale with proximity and Assist', () => {
    const n = createNoise(createEventBus());
    const s = withVikram('KITCHEN', 400);       // adjacent 0.35
    n.spike(s, 'door');
    expect(s.noise).toBeCloseTo(N.spike.door * N.prox.adjacent, 6);
    const far = withVikram('KITCHEN', 400, 'LIVING');
    n.spike(far, 'wrongFix');
    expect(far.noise).toBe(0);
    const a = withVikram('HALL', 600);
    a.settings.assist = true;
    n.spike(a, 'interact');
    expect(a.noise).toBeCloseTo(N.spike.interact * N.prox.sameClose * BALANCE.assist.noiseMult, 6);
  });
});
