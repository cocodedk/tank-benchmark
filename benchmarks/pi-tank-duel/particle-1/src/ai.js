import { ARENA, WALLS, TANK_RADIUS, SHELL_RADIUS, TURN_RATE } from './constants.js';
import { angleTo, angleDiff, segmentHitsRect, turnToward } from './geometry.js';

// A shell is not a line: give the wall a little clearance so a grazing shot does not bounce.
const CLEARANCE = SHELL_RADIUS + 0.1;
const padded = (wall) => ({
  x: wall.x,
  z: wall.z,
  width: wall.width + CLEARANCE * 2,
  depth: wall.depth + CLEARANCE * 2,
});
const WORLD = WALLS.map(padded);

const blocked = (ax, az, bx, bz) => WORLD.some(
  (wall) => segmentHitsRect(ax, az, bx, bz, wall),
);

/** A clear two-leg route around the walls, or null. */
function waypoint(from, to) {
  let best = null;
  let bestScore = Infinity;
  const hw = ARENA.width / 2 - TANK_RADIUS;
  const hd = ARENA.depth / 2 - TANK_RADIUS;
  for (const wall of WALLS) {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const wx = wall.x + sx * (wall.width / 2 + 2.6);
        const wz = wall.z + sz * (wall.depth / 2 + 2.6);
        if (Math.abs(wx) > hw || Math.abs(wz) > hd) continue;
        if (blocked(from.x, from.z, wx, wz)) continue;
        if (blocked(wx, wz, to.x, to.z)) continue;
        const score = Math.hypot(wx - from.x, wz - from.z)
          + Math.hypot(to.x - wx, to.z - wz);
        if (score < bestScore) {
          bestScore = score;
          best = { x: wx, z: wz };
        }
      }
    }
  }
  return best;
}

export function updateAI(game, dt) {
  const computer = game.tanks.computer;
  const player = game.tanks.player;
  if (!computer || computer.health <= 0 || player.health <= 0) return;

  const direct = !blocked(computer.x, computer.z, player.x, player.z);
  let target;
  if (direct) {
    target = angleTo(computer.x, computer.z, player.x, player.z);
  } else {
    const route = waypoint(computer, player);
    target = route
      ? angleTo(computer.x, computer.z, route.x, route.z)
      : angleTo(computer.x, computer.z, player.x, player.z);
  }

  computer.heading = turnToward(computer.heading, target, TURN_RATE * dt);

  const distance = Math.hypot(player.x - computer.x, player.z - computer.z);
  const forward = !direct || distance > 15;
  if (forward) {
    game.moveTank('computer', { forward: true, backward: false, left: false, right: false }, dt);
  }

  const aim = Math.abs(angleDiff(
    computer.heading,
    angleTo(computer.x, computer.z, player.x, player.z),
  ));
  if (direct && aim < 6) game.fire('computer');
}
