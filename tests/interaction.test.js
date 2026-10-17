import { describe, expect, it } from 'vitest';
import { ROOMS } from '../src/data/rooms.js';
import { createEventBus } from '../src/systems/eventBus.js';
import { createState, setCompleted } from '../src/systems/gameState.js';
import { checkWhen, createInteraction, currentVmId, pickVariant }
  from '../src/systems/interaction.js';
import { createMovement } from '../src/systems/movement.js';

function hotspot(room, id) {
  return ROOMS[room].hotspots.find((h) => h.id === id);
}

function setup() {
  const bus = createEventBus();
  const events = [];
  bus.on('room:enter', (p) => events.push(['room:enter', p]));
  bus.on('evidence:added', (p) => events.push(['evidence:added', p]));
  return { state: createState(), inter: createInteraction(bus), events };
}

describe('conditions', () => {
  it('vmCurrent needs the current VM to be damaged', () => {
    const s = createState();
    expect(checkWhen({ vmCurrent: 1 }, s)).toBe(true);
    s.voicemails[1].status = 'fixed';
    expect(checkWhen({ vmCurrent: 1 }, s)).toBe(false);
    expect(checkWhen({ vmFixed: 1 }, s)).toBe(true);
  });

  it('every key must pass', () => {
    const s = createState();
    setCompleted(s, 6);
    expect(checkWhen({ vmDone: 6, notHasEvidence: 'E6' }, s)).toBe(true);
    s.inventory.evidence.push('E6');
    expect(checkWhen({ vmDone: 6, notHasEvidence: 'E6' }, s)).toBe(false);
  });

  it('unknown keys throw', () => {
    expect(() => checkWhen({ nope: 1 }, createState())).toThrow();
  });

  it('every condition used in rooms.js is known', () => {
    const s = createState();
    for (const room of Object.values(ROOMS)) {
      for (const hs of room.hotspots) expect(() => pickVariant(hs, s)).not.toThrow();
    }
  });

  it('setCompleted makes VM7 current as fixed', () => {
    const s = createState();
    setCompleted(s, 6);
    expect(currentVmId(s)).toBe(7);
    expect(s.voicemails[7].status).toBe('fixed');
    expect(s.act).toBe(3);
  });
});

describe('hotspot variants', () => {
  it('drawer gives GLASSES once, then shows the empty text', () => {
    const { state, inter } = setup();
    state.player.room = 'LIVING';
    const first = inter.interact(state, 'H_DRAWER_L');
    expect(first.text).toContain('reading glasses');
    expect(state.inventory.tools).toEqual(['GLASSES']);
    expect(inter.interact(state, 'H_DRAWER_L').text).toContain('Empty');
  });

  it('ashtray gives E1 only after VM1 is done', () => {
    const { state, inter, events } = setup();
    state.player.room = 'LIVING';
    expect(inter.interact(state, 'H_ASHTRAY').text).toContain('paperclips');
    setCompleted(state, 1);
    inter.interact(state, 'H_ASHTRAY');
    expect(state.inventory.evidence).toEqual(['E1']);
    expect(events).toContainEqual(['evidence:added', { id: 'E1' }]);
  });

  it('radio opens the RADIO fix only while VM1 is current', () => {
    const s = createState();
    expect(pickVariant(hotspot('LIVING', 'H_RADIO'), s).action).toEqual({ openFix: 'RADIO' });
    setCompleted(s, 1);
    expect(pickVariant(hotspot('LIVING', 'H_RADIO'), s).action).toBeUndefined();
  });

  it('windows: open during VM3, Closed. once closed, Latched shut. before', () => {
    const s = createState();
    const win = hotspot('KITCHEN', 'H_WINDOW_KITCHEN');
    expect(pickVariant(win, s).examine).toBe('Latched shut.');
    setCompleted(s, 2);
    expect(pickVariant(win, s).action).toEqual({ closeWindow: 'KITCHEN' });
    s.windowsClosed.push('KITCHEN');
    expect(pickVariant(win, s).examine).toBe('Closed.');
  });

  it('umbrella sets readUmbrellaTag', () => {
    const { state, inter } = setup();
    inter.interact(state, 'H_UMBRELLA');
    expect(state.flags.readUmbrellaTag).toBe(true);
  });
});

describe('doors', () => {
  it('arrive at the matching door x in the other room', () => {
    const { state, inter, events } = setup();
    expect(inter.useDoor(state, 'D_KITCHEN').passed).toBe(true);
    expect(state.player).toMatchObject({ room: 'KITCHEN', x: 70 });
    inter.useDoor(state, 'D_HALL');
    expect(state.player).toMatchObject({ room: 'HALL', x: 420 });
    expect(events[0]).toEqual(['room:enter', { room: 'KITCHEN', from: 'HALL' }]);
  });

  it('every door pair round-trips', () => {
    const { state, inter } = setup();
    for (const door of ROOMS.HALL.doors.filter((d) => d.to)) {
      state.player.room = 'HALL';
      inter.useDoor(state, door.id);
      const back = ROOMS[door.to].doors[0];
      expect(state.player.x).toBe(door.toX);
      inter.useDoor(state, back.id);
      expect(state.player).toMatchObject({ room: 'HALL', x: door.x });
    }
  });

  it('the front door stays locked', () => {
    const { state, inter } = setup();
    const r = inter.useDoor(state, 'D_FRONT');
    expect(r.passed).toBe(false);
    expect(r.text).toContain('Locked');
    expect(state.player.room).toBe('HALL');
  });
});

describe('movement', () => {
  it('walks at 130 px/s and sneaks at 65', () => {
    const s = createState();
    const m = createMovement();
    m.move(s, 1, { dir: 1, targetX: null });
    expect(s.player.x).toBe(560 + 130);
    s.player.sneaking = true;
    m.move(s, 1, { dir: -1, targetX: null });
    expect(s.player.x).toBe(560 + 130 - 65);
  });

  it('stops at the target and reports arrival', () => {
    const s = createState();
    const m = createMovement();
    let arrived = false;
    for (let i = 0; i < 100 && !arrived; i++) arrived = m.move(s, 0.05, { dir: 0, targetX: 600 });
    expect(arrived).toBe(true);
    expect(s.player.x).toBe(600);
    expect(s.player.moving).toBe(false);
  });

  it('does not move while locked and clamps to the walk bounds', () => {
    const s = createState();
    const m = createMovement();
    s.player.locked = true;
    m.move(s, 1, { dir: 1, targetX: null });
    expect(s.player.x).toBe(560);
    s.player.locked = false;
    m.move(s, 10, { dir: 1, targetX: null });
    expect(s.player.x).toBe(930);
  });
});
