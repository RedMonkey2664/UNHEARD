// Vikram (docs/03 section 6). Deliberately predictable: a fixed route, a
// fixed rhythm, no pathfinding beyond "every room joins the Hall". Pure.
//
// Movement is a queue of ops in vikram.path: { walk: x } or
// { door: room, toX }. A door takes doorTime, then he appears at toX.

import { BALANCE } from '../config/balance.js';
import { ROOMS } from '../data/rooms.js';

const V = BALANCE.vikram;
const N = BALANCE.noise;

// Ops to get from (fromRoom, fromX) to (toRoom, toX) through the Hall.
export function planPath(fromRoom, toRoom, toX) {
  if (fromRoom === toRoom) return [{ walk: toX }];
  const ops = [];
  if (fromRoom !== 'HALL') {
    const out = ROOMS[fromRoom].doors[0];
    ops.push({ walk: out.x }, { door: 'HALL', toX: out.toX });
  }
  if (toRoom !== 'HALL') {
    const into = ROOMS.HALL.doors.find((d) => d.to === toRoom);
    ops.push({ walk: into.x }, { door: toRoom, toX: into.toX });
  }
  ops.push({ walk: toX });
  return ops;
}

export function actParams(state) {
  return V.acts[Math.min(5, Math.max(2, state.act))];
}

export function vikramSpeed(state) {
  let s = actParams(state).speed;
  if (state.vikram.state === 'CHASE') s *= V.chaseMult;
  if (state.settings.assist) s *= BALANCE.assist.vikramSpeedMult;
  return s;
}

// SIGHT (docs/03 section 6): same room, not hidden, and within 520 px with
// the torch on or 130 px without it.
export function canSee(state) {
  const v = state.vikram;
  const p = state.player;
  if (!v.room || v.room !== p.room || p.hidden) return false;
  const d = Math.abs(v.x - p.x);
  return (state.torchOn && d < V.sightTorchOn) || d < V.sightTorchOff;
}

// Where a player who just left his room appears, seen from his side.
function entryX(fromRoom, toRoom) {
  if (toRoom === 'HALL') return ROOMS[fromRoom].doors[0].toX;
  return ROOMS.HALL.doors.find((d) => d.to === toRoom).toX;
}

const SEEING_STATES = ['PATROL', 'INVESTIGATE', 'SEARCH'];
const BUMP_STATES = ['PATROL', 'INVESTIGATE'];

export function createVikramAI(bus, { noise }) {
  function setState(state, next) {
    const v = state.vikram;
    const prev = v.state;
    v.state = next;
    bus.emit('vikram:state', { state: next, prev });
  }

  const speed = vikramSpeed;

  // Ends the run (god mode in debug keeps him from catching anyone).
  function catchPlayer(state) {
    if (state.debug?.godMode) return;
    setState(state, 'CAUGHT');
    state.vikram.path = [];
    bus.emit('player:caught', { cause: 'caught' });
  }

  function chase(state) {
    const v = state.vikram;
    v.lastSeen = { room: state.player.room, x: state.player.x };
    v.phase = 'run';
    v.path = [];
    setState(state, 'CHASE');
    bus.emit('vikram:spotted', {});
  }

  function goTo(state, room, x) {
    const v = state.vikram;
    v.path = planPath(v.room, room, x);
    v.doorTimer = 0;
  }

  // Advances one op per frame. Returns true when the path is finished.
  function stepPath(state, dt) {
    const v = state.vikram;
    v.moving = false;
    const op = v.path[0];
    if (!op) return true;
    if (op.walk !== undefined) {
      const dx = op.walk - v.x;
      const step = speed(state) * dt;
      v.moving = true;
      if (Math.abs(dx) <= step) {
        v.x = op.walk;
        v.path.shift();
      } else {
        v.facing = Math.sign(dx);
        v.x += v.facing * step;
      }
    } else {
      v.doorTimer += dt;
      if (v.doorTimer >= V.doorTime) {
        const from = v.room;
        v.room = op.door;
        v.x = op.toX;
        v.doorTimer = 0;
        v.path.shift();
        bus.emit('vikram:door', { room: v.room, from });
      }
    }
    return v.path.length === 0;
  }

  function route(state) {
    return V.routes[state.vikram.routeId] || V.routes.A;
  }

  function walkToStop(state) {
    const v = state.vikram;
    const stops = route(state);
    if (v.routeIndex >= stops.length) return leave(state);
    const [room, x] = stops[v.routeIndex];
    v.phase = 'walk';
    goTo(state, room, x);
    return null;
  }

  function startPatrol(state) {
    const v = state.vikram;
    v.routeId = actParams(state).route;
    v.routeIndex = 0;
    v.cycle++;
    setState(state, 'PATROL');
    walkToStop(state);
  }

  function resumePatrol(state) {
    setState(state, 'PATROL');
    walkToStop(state);
  }

  function leave(state) {
    setState(state, 'LEAVING');
    goTo(state, 'HALL', V.enterX);
  }

  function hearingThreshold(state) {
    return state.vikram.state === 'HUNT' || state.flags.tapeTaken ? N.investigateAtHunt : N.investigateAt;
  }

  // target defaults to the player's position (heard them).
  function investigate(state, target) {
    const v = state.vikram;
    const p = state.player;
    v.target = target || { room: p.room, x: p.x };
    v.stateTimer = V.investigateTimeout;
    v.refreshTimer = V.investigateRefreshSec;
    state.stats.investigations++;
    setState(state, 'INVESTIGATE');
    goTo(state, v.target.room, v.target.x);
  }

  function startSearch(state) {
    const v = state.vikram;
    v.phase = 'look';
    v.stateTimer = state.flags.tapeTaken ? V.searchTimeHunt : V.searchTime;
    v.path = [];
    v.searchSpots = [];
    setState(state, 'SEARCH');
  }

  // Hide spots in his room, nearest first (docs/03 section 6, SEARCH).
  function spotsToCheck(state) {
    const v = state.vikram;
    const hunt = state.flags.tapeTaken;
    return ROOMS[v.room].hideSpots
      .filter((s) => hunt || Math.abs(s.x - v.x) <= V.hideCheckRadius)
      .sort((a, b) => Math.abs(a.x - v.x) - Math.abs(b.x - v.x))
      .map((s) => s.id);
  }

  function endSearch(state) {
    noise.set(state, V.noiseAfterSearch);
    state.vikram.target = null;
    resumePatrol(state);
  }

  function tickSearch(state, dt) {
    const v = state.vikram;
    if (v.phase === 'look') {
      v.stateTimer -= dt;
      if (v.stateTimer > 0) return;
      v.searchSpots = spotsToCheck(state);
      v.phase = 'goto';
    }
    if (v.phase === 'goto') {
      const id = v.searchSpots[0];
      if (!id) return endSearch(state);
      if (!v.path.length) goTo(state, v.room, ROOMS[v.room].hideSpots.find((s) => s.id === id).x);
      if (stepPath(state, dt)) {
        v.phase = 'check';
        v.stateTimer = V.hideCheckTime;
        bus.emit('vikram:check', { spotId: id });
      }
      return null;
    }
    if (v.phase === 'check') {
      v.stateTimer -= dt;
      if (v.stateTimer > 0) return null;
      const id = v.searchSpots.shift();
      const p = state.player;
      // Found if he saw you hide, or if you are making noise.
      if (p.hidden && p.hideSpotId === id &&
          (v.seenHiding || state.noise >= N.hideFoundAt)) {
        catchPlayer(state);
        return null;
      }
      v.phase = 'goto';
    }
    return null;
  }

  function tickInvestigate(state, dt) {
    const v = state.vikram;
    const p = state.player;
    v.stateTimer -= dt;
    v.refreshTimer -= dt;
    // Keep chasing the sound while it stays loud, never through a doorway.
    if (v.refreshTimer <= 0) {
      v.refreshTimer = V.investigateRefreshSec;
      if (state.noise >= hearingThreshold(state) && !p.hidden && v.doorTimer === 0 &&
          noise.proximity(state) > 0) {
        v.target = { room: p.room, x: p.x };
        goTo(state, p.room, p.x);
      }
    }
    if (stepPath(state, dt) || v.stateTimer <= 0) startSearch(state);
  }

  function tickChase(state, dt) {
    const v = state.vikram;
    const p = state.player;
    if (p.hidden) {
      // Saw you hide: straight to that spot. Otherwise he lost you.
      if (v.seenHiding && p.room === v.room) {
        const spot = ROOMS[p.room].hideSpots.find((s) => s.id === p.hideSpotId);
        v.path = [{ walk: spot.x }];
        if (stepPath(state, dt) || Math.abs(v.x - spot.x) < V.catchDist) catchPlayer(state);
      } else {
        investigate(state, v.lastSeen);
      }
      return;
    }
    if (p.room === v.room && v.phase === 'run') {
      v.lastSeen = { room: p.room, x: p.x };
      v.path = [{ walk: p.x }];
      stepPath(state, dt);
      if (Math.abs(v.x - p.x) < V.catchDist) catchPlayer(state);
      return;
    }
    // The player went through a door: follow through it, then investigate
    // where they came in (the door broke his line of sight).
    if (v.phase === 'run') {
      v.phase = 'follow';
      v.target = { room: p.room, x: entryX(v.room, p.room) };
      goTo(state, v.target.room, v.target.x);
    }
    if (stepPath(state, dt)) investigate(state, v.target);
  }

  function tickPatrol(state, dt) {
    const v = state.vikram;
    if (v.phase === 'walk') {
      if (stepPath(state, dt)) {
        const [, , dwell] = route(state)[v.routeIndex];
        v.phase = 'dwell';
        v.stateTimer = dwell * actParams(state).dwell;
        bus.emit('vikram:dwell', { room: v.room });
      }
    } else {
      v.moving = false;
      v.stateTimer -= dt;
      if (v.stateTimer <= 0) {
        v.routeIndex++;
        walkToStop(state);
      }
    }
  }

  const api = {
    // completed == 2: key in the lock, 3 s, then he is in the Hall.
    enter(state) {
      const v = state.vikram;
      state.flags.vikramEntered = true;
      v.room = null;
      v.path = [];
      v.stateTimer = V.keyWarningSec;
      setState(state, 'ENTERING');
      bus.emit('vikram:keyInLock', {});
    },

    // Battery dead / Hunt: if he is outside he is back within huntReenterSec,
    // with a door slam and no key warning.
    reenterNow(state) {
      const v = state.vikram;
      if (v.state !== 'AWAY') return false;
      state.flags.vikramEntered = true;
      v.room = null;
      v.path = [];
      v.stateTimer = V.huntReenterSec;
      setState(state, 'ENTERING');
      bus.emit('vikram:doorSlam', {});
      return true;
    },

    tick(state, dt) {
      const v = state.vikram;
      switch (v.state) {
        case 'AWAY':
          v.moving = false;
          if (!state.flags.vikramEntered) return;
          v.awayTimer -= dt;
          if (v.awayTimer <= 0) api.enter(state);
          return;
        case 'ENTERING':
          v.stateTimer -= dt;
          if (v.stateTimer > 0) return;
          v.room = 'HALL';
          v.x = V.enterX;
          bus.emit('vikram:door', { room: 'HALL', from: null });
          startPatrol(state);
          return;
        case 'PATROL':
          tickPatrol(state, dt);
          break;
        case 'LEAVING':
          if (stepPath(state, dt)) {
            v.room = null;
            v.awayTimer = actParams(state).away;
            setState(state, 'AWAY');
            bus.emit('vikram:door', { room: null, from: 'HALL' });
          }
          return;
        case 'INVESTIGATE':
          tickInvestigate(state, dt);
          break;
        case 'SEARCH':
          tickSearch(state, dt);
          break;
        case 'CHASE':
          tickChase(state, dt);
          return;
        default:
          return;
      }
      if (v.state === 'CAUGHT') return;
      const p = state.player;
      const d = Math.abs(v.x - p.x);
      const sameRoom = v.room === p.room && !p.hidden;
      // Noise 100 close by, or walking into the player, ends it.
      if (sameRoom && state.noise >= N.catchAt && d <= N.catchDist) return catchPlayer(state);
      if (sameRoom && BUMP_STATES.includes(v.state) && d < V.catchDist) return catchPlayer(state);
      if (SEEING_STATES.includes(v.state) && canSee(state)) return chase(state);
      // Hearing: only a patrolling Vikram starts an investigation.
      if (v.state === 'PATROL' && state.noise >= hearingThreshold(state) && noise.proximity(state) > 0) {
        investigate(state);
      }
      return null;
    },

    // Debug: jump straight into a state.
    force(state, name) {
      const v = state.vikram;
      state.flags.vikramEntered = true;
      if (name === 'AWAY') {
        v.room = null;
        v.path = [];
        v.awayTimer = actParams(state).away;
        setState(state, 'AWAY');
      }
      if (name === 'ENTERING') api.enter(state);
      if (!v.room && name !== 'AWAY' && name !== 'ENTERING') {
        v.room = 'HALL';
        v.x = V.enterX;
      }
      if (name === 'PATROL') startPatrol(state);
      if (name === 'INVESTIGATE') investigate(state);
      if (name === 'SEARCH') startSearch(state);
      if (name === 'CHASE') chase(state);
    }
  };
  return api;
}
