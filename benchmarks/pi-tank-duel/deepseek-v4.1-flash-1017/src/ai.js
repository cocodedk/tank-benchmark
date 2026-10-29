import { SHELL, STEP } from './constants.js';
import { angleDiff, distance, lineOfSight } from './physics.js';
import { findPath } from './path.js';

const DEG = Math.PI / 180;
const AIM_TOLERANCE = 2.5;
const PATH_REFRESH = 0.5;

function directAim(me, foe) {
  const dx = foe.x - me.x;
  const dz = foe.z - me.z;
  const length = Math.hypot(dx, dz) || 1;
  return {
    heading: Math.atan2(dz, dx) / DEG,
    muzzleX: me.x + (dx / length) * SHELL.spawn,
    muzzleZ: me.z + (dz / length) * SHELL.spawn,
  };
}

function followPath(game, me, foe) {
  const state = game.aiState;
  state.timer -= STEP;
  const moved = !Number.isFinite(state.lastX)
    || distance(foe.x, foe.z, state.lastX, state.lastZ) > 1.5;
  if (state.timer <= 0 || moved || state.path.length === 0) {
    state.path = findPath(me, foe);
    state.timer = PATH_REFRESH;
    state.lastX = foe.x;
    state.lastZ = foe.z;
  }

  let target = state.path[0];
  while (target && distance(me.x, me.z, target.x, target.z) < 0.6) {
    state.path.shift();
    target = state.path[0];
  }
  if (!target) target = foe;

  const heading = Math.atan2(target.z - me.z, target.x - me.x) / DEG;
  const turnDiff = angleDiff(heading, me.heading);
  return {
    turn: Math.abs(turnDiff) > 2 ? Math.sign(turnDiff) : 0,
    drive: Math.abs(turnDiff) < 45 ? 1 : 0,
  };
}

/** Where the computer wants to go this tick, and whether it should shoot. */
export function aiControls(game) {
  const me = game.tanks.computer;
  const foe = game.tanks.player;
  const { heading, muzzleX, muzzleZ } = directAim(me, foe);
  const clear = lineOfSight(muzzleX, muzzleZ, foe.x, foe.z);
  const diff = angleDiff(heading, me.heading);

  if (clear) {
    if (Math.abs(diff) <= AIM_TOLERANCE) {
      game.fire('computer');
      return { turn: 0, drive: 0 };
    }
    return { turn: Math.sign(diff), drive: 0 };
  }

  return followPath(game, me, foe);
}
