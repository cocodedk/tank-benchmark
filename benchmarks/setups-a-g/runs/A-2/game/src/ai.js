import { ARENA, TANK_RADIUS, SHELL_RADIUS } from './config.js';
import { wallContact, lineClear, norm } from './geom.js';

const W = ARENA.width;
const H = ARENA.depth;
const LOCK_STEPS = 18; // the computer wants you in its sights for 0.3 s before it fires
const free = Array.from({ length: W * H }, (_, i) => !wallContact((i % W) + 0.5 - W / 2, Math.floor(i / W) + 0.5 - H / 2, TANK_RADIUS + 0.1));
const cellOf = (x, z) => Math.max(0, Math.min(W - 1, Math.floor(x + W / 2))) + W * Math.max(0, Math.min(H - 1, Math.floor(z + H / 2)));
const NEXT = [[1, 0], [-1, 0], [0, W], [0, -W]];

/** Steps to the goal cell over free cells (the goal itself is always entered). */
function distances(goal) {
  const dist = new Map([[goal, 0]]);
  for (const c of dist.keys()) {
    for (const [dx, dc] of NEXT) {
      const n = c + dx + dc;
      const edge = (c % W === 0 && dx < 0) || (c % W === W - 1 && dx > 0);
      if (!edge && n >= 0 && n < W * H && free[n] && !dist.has(n)) dist.set(n, dist.get(c) + 1);
    }
  }
  return dist;
}

/** A point a few cells further along the shortest route to `you`, or null. */
function waypoint(me, you) {
  const dist = distances(cellOf(you.x, you.z));
  let c = cellOf(me.x, me.z);
  for (let hop = 0; hop < 3; hop++) {
    const options = [...NEXT.map(([dx, dc]) => c + dx + dc), ...[-1 - W, 1 - W, W - 1, W + 1].map((d) => c + d)];
    const best = options.filter((n) => dist.has(n)).sort((a, b) => dist.get(a) - dist.get(b))[0];
    if (best === undefined || dist.get(best) >= (dist.get(c) ?? Infinity)) break;
    c = best;
  }
  return dist.has(c) && c !== cellOf(me.x, me.z) ? [(c % W) + 0.5 - W / 2, Math.floor(c / W) + 0.5 - H / 2] : null;
}

/** What the computer's driver does this step: {drive, turn, fire}. */
export function think(g) {
  const me = g.tanks.computer;
  const you = g.tanks.player;
  const clear = lineClear(me.x, me.z, you.x, you.z, SHELL_RADIUS);
  const [tx, tz] = (!clear && waypoint(me, you)) || [you.x, you.z];
  const err = norm(Math.atan2(tz - me.z, tx - me.x) * 180 / Math.PI - me.heading + 180) - 180;
  me.lock = clear && Math.abs(err) < 4 ? me.lock + 1 : 0;
  const far = Math.hypot(you.x - me.x, you.z - me.z) > 10;
  return {
    turn: Math.abs(err) < 2 ? 0 : Math.sign(err),
    drive: Math.abs(err) < 30 && (!clear || far) ? 1 : 0,
    fire: me.lock >= LOCK_STEPS,
  };
}
