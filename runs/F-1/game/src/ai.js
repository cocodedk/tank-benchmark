// The computer's driver: returns the virtual keys it holds this step and fires through `fire`.
import { blocked, segClear } from './world.js';

const COLS = 40, ROWS = 30;
const walk = Array.from({ length: COLS * ROWS }, (_, n) => !blocked(-19.5 + Math.floor(n / ROWS), -14.5 + n % ROWS, 1.3));
const cx = n => -19.5 + Math.floor(n / ROWS), cz = n => -14.5 + n % ROWS;
let path = [];

// Press the turn key toward (x, z); returns the remaining angle in degrees.
function turnToward(keys, t, x, z) {
  const diff = ((Math.atan2(z - t.z, x - t.x) * 180 / Math.PI - t.heading + 540) % 360) - 180;
  if (diff > 1) keys.add('d'); else if (diff < -1) keys.add('a');
  return Math.abs(diff);
}

// BFS (4-neighbour) from the walkable cell nearest c to the nearest cell with a clear line to p.
function plan(c, p) {
  let start = -1, best = Infinity;
  walk.forEach((ok, n) => { const d = Math.hypot(cx(n) - c.x, cz(n) - c.z); if (ok && d < best) { best = d; start = n; } });
  const from = new Map([[start, -1]]), queue = [start];
  for (const n of queue) {
    if (segClear(cx(n), cz(n), p.x, p.z, 0.25)) {
      const out = [];
      for (let m = n; m >= 0; m = from.get(m)) out.unshift({ x: cx(m), z: cz(m) });
      return out;
    }
    const i = Math.floor(n / ROWS), j = n % ROWS;
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      const m = a * ROWS + b;
      if (a >= 0 && a < COLS && b >= 0 && b < ROWS && walk[m] && !from.has(m)) { from.set(m, n); queue.push(m); }
    }
  }
  return [];
}

export function think(s, fire) {
  const c = s.tanks.computer, p = s.tanks.player, keys = new Set();
  if (segClear(c.x, c.z, p.x, p.z, 0.25)) {
    turnToward(keys, c, p.x, p.z);
    const vx = p.x - c.x, vz = p.z - c.z, a = c.heading * Math.PI / 180;
    const along = vx * Math.cos(a) + vz * Math.sin(a), perp = Math.abs(vz * Math.cos(a) - vx * Math.sin(a));
    if (along > 0 && perp < 1 && s.tick - c.last >= 60) fire('computer');
    return keys;
  }
  if (s.tick % 30 === 0 || !path.length) path = plan(c, p);
  const target = path.find(q => Math.hypot(q.x - c.x, q.z - c.z) > 1.5) ?? path[path.length - 1];
  if (target && turnToward(keys, c, target.x, target.z) < 30) keys.add('w');
  return keys;
}
