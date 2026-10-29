import { clearLine, contacts } from './collide.js';
import { ARENA, DT, SHELL_RADIUS, TURN_SPEED } from './config.js';
import { fire, moveTank, wrap } from './tank.js';

const W = ARENA.width, H = ARENA.depth;
const AIM_TOLERANCE = 4; // degrees
const REACTION_STEPS = 18;
const KEEP_AWAY = 10;
const deg = (rad) => (rad * 180) / Math.PI;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const cellOf = (t) => clamp(Math.floor(t.x + W / 2), 0, W - 1) + W * clamp(Math.floor(t.z + H / 2), 0, H - 1);
const centre = (k) => ({ x: (k % W) - W / 2 + 0.5, z: Math.floor(k / W) - H / 2 + 0.5 });
const neighbours = (k) => [k % W > 0 && k - 1, k % W < W - 1 && k + 1, k >= W && k - W, k < W * (H - 1) && k + W]
  .filter((n) => n !== false);

// A cell is blocked when a tank centred in it would touch a wall (radius 1.2 plus a margin).
const blocked = Array.from({ length: W * H }, (_, k) => contacts(centre(k).x, centre(k).z, 1.3).length > 0);

/** Steps from every free cell to the target cell, walking round walls. */
function distances(start) {
  const dist = new Array(W * H).fill(Infinity);
  const queue = [start];
  dist[start] = 0;
  for (let i = 0; i < queue.length; i++) {
    for (const n of neighbours(queue[i])) {
      if (dist[n] === Infinity && !blocked[n]) {
        dist[n] = dist[queue[i]] + 1;
        queue.push(n);
      }
    }
  }
  return dist;
}

/** The spot to head for: three cells down the shortest way to the player, or the player when that is no use. */
function waypoint(ai, c, p) {
  const goal = cellOf(p);
  if (ai.goal !== goal) [ai.goal, ai.dist] = [goal, distances(goal)];
  let k = cellOf(c);
  const from = k;
  for (let i = 0; i < 3; i++) {
    const best = neighbours(k).reduce((a, b) => (ai.dist[b] < ai.dist[a] ? b : a));
    if (!(ai.dist[best] < ai.dist[k])) break;
    k = best;
  }
  return k === from ? p : centre(k);
}

/** One step of the computer: turn toward the player, go round walls to find a clear line, fire along it. */
export function aiStep(g) {
  const c = g.tanks.computer, p = g.tanks.player;
  const ai = (g.aiState ??= { seen: 0, goal: -1, dist: null });
  const los = clearLine(c, p, SHELL_RADIUS);
  ai.seen = los ? ai.seen + 1 : 0;
  const target = los ? p : waypoint(ai, c, p);
  const err = wrap(deg(Math.atan2(target.z - c.z, target.x - c.x)) - c.heading + 180) - 180;
  const near = los && Math.hypot(p.x - c.x, p.z - c.z) <= KEEP_AWAY;
  const drive = !near && Math.abs(err) < (los ? 20 : 30) ? 1 : 0;
  moveTank(g, 'computer', drive, clamp(err / (TURN_SPEED * DT), -0.75, 0.75));
  if (los && ai.seen > REACTION_STEPS && Math.abs(err) < AIM_TOLERANCE) fire(g, 'computer');
}
