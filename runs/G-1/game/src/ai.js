// The computer's driver: aims and fires when it sees you, otherwise drives to a spot that does.
import { TANK_R, SHELL_R, norm, blockedAt, lineBlocked } from './geom.js';

const bearing = (a, b) => norm(Math.atan2(b.z - a.z, b.x - a.x) * 180 / Math.PI);
const offset = (from, to) => norm(to - from + 180) - 180;

function turn(c, me, want) {
  const d = offset(me.heading, want);
  c.right = d > 2;
  c.left = d < -2;
  return Math.abs(d);
}

// The nearest reachable grid spot with a clear line to you, else the reachable spot closest to you.
function plan(me, you) {
  let best = null, bestScore = Infinity;
  for (let x = -18; x <= 18; x += 2) {
    for (let z = -13; z <= 13; z += 2) {
      const toYou = Math.hypot(x - you.x, z - you.z);
      if (toYou < 3 || blockedAt(x, z, TANK_R + 0.3) || lineBlocked(me.x, me.z, x, z, TANK_R - 0.05)) continue;
      const score = lineBlocked(x, z, you.x, you.z, SHELL_R) ? 1000 + toYou : Math.hypot(x - me.x, z - me.z);
      if (score < bestScore) [best, bestScore] = [{ x, z }, score];
    }
  }
  return best;
}

// Controls {forward, left, right, fire} for this step.
export function think(game) {
  const me = game.tanks.computer, you = game.tanks.player, b = game.brain, c = {};
  b.err ??= 0;
  b.nextShot ??= 0;
  if (!lineBlocked(me.x, me.z, you.x, you.z, SHELL_R)) {
    b.target = null;
    if (turn(c, me, bearing(me, you) + b.err) <= 2 && game.time >= b.nextShot) {
      c.fire = true;
      b.err = (Math.random() * 2 - 1) * 4;
      b.nextShot = game.time + 0.6 + Math.random() * 0.6;
    }
    return c;
  }
  if (!b.target || game.time >= b.replan || Math.hypot(b.target.x - me.x, b.target.z - me.z) < 0.5) {
    b.target = plan(me, you);
    b.replan = game.time + 1;
  }
  if (b.target) c.forward = turn(c, me, bearing(me, b.target)) < 15;
  return c;
}
