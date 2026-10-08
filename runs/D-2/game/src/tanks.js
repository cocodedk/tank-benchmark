import {DT, HALF, OTHER, SPEED, TANK_R, WALLS} from './config.js';
import {clamp, pushOut, rectDist} from './geom.js';

const LIMIT = {x: HALF.x - TANK_R, z: HALF.z - TANK_R};

/** Moves a tank by dist along its heading, stopping at walls and at the other tank. */
function move(g, name, dist) {
  const t = g.tanks[name];
  const o = g.tanks[OTHER[name]];
  const a = t.heading * Math.PI / 180;
  let x = t.x + Math.cos(a) * dist;
  let z = t.z + Math.sin(a) * dist;
  for (let i = 0; i < 3; i++) {
    for (const w of WALLS) [x, z] = pushOut(x, z, TANK_R, w);
    x = clamp(x, -LIMIT.x, LIMIT.x);
    z = clamp(z, -LIMIT.z, LIMIT.z);
    const d = Math.hypot(x - o.x, z - o.z);
    if (d > 0 && d < 2 * TANK_R) {
      x = o.x + (x - o.x) / d * 2 * TANK_R;
      z = o.z + (z - o.z) / d * 2 * TANK_R;
    }
  }
  // Squeezed between a wall and the other tank there may be no legal spot: stay put.
  if (placeError(g, name, x, z)) return;
  t.x = x;
  t.z = z;
}

/** One step of driving: input has booleans fwd, back, left, right. Left turns the heading down. */
export function drive(g, name, input) {
  const t = g.tanks[name];
  const turn = Number(input.right) - Number(input.left);
  t.heading = (((t.heading + turn * SPEED.turn * DT) % 360) + 360) % 360;
  if (input.fwd !== input.back) move(g, name, (input.fwd ? SPEED.forward : -SPEED.reverse) * DT);
}

/** Why a tank cannot stand at (x, z), or null when it can. */
export function placeError(g, name, x, z) {
  const eps = 1e-9;
  const o = g.tanks[OTHER[name]];
  if (Math.abs(x) > LIMIT.x + eps || Math.abs(z) > LIMIT.z + eps) return 'outside the arena';
  if (WALLS.some(w => rectDist(x, z, w) < TANK_R - eps)) return 'inside a wall';
  if (Math.hypot(x - o.x, z - o.z) < 2 * TANK_R - eps) return 'overlaps the other tank';
  return null;
}
