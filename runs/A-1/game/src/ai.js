// The computer's driver: aims at the player, fires on a clear line, and otherwise walks a grid
// route to the nearest spot that has one. It returns the same controls a keyboard gives.
import { HALF_X, HALF_Z, blocked, clear } from './arena.js';

const COLS = 2 * HALF_X, ROWS = 2 * HALF_Z, AI_RELOAD = 45;
const cx = i => i - HALF_X + 0.5, cz = j => j - HALF_Z + 0.5;
const FREE = Array.from({ length: COLS * ROWS }, (_, n) => clear(cx(Math.floor(n / ROWS)), cz(n % ROWS), 0.3));
const cell = (v, half, n) => Math.max(0, Math.min(n - 1, Math.floor(v + half)));

// The centre of the first cell on the shortest route from `me` to a cell that sees `you`.
function route(me, you) {
  const start = cell(me.x, HALF_X, COLS) * ROWS + cell(me.z, HALF_Z, ROWS);
  const from = new Map([[start, -1]]);
  for (const queue = [start]; queue.length;) {
    const n = queue.shift(), i = Math.floor(n / ROWS), j = n % ROWS;
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      const m = a * ROWS + b;
      if (a < 0 || a >= COLS || b < 0 || b >= ROWS || !FREE[m] || from.has(m)) continue;
      from.set(m, n);
      if (blocked(cx(a), cz(b), you.x, you.z, 0.5)) { queue.push(m); continue; }
      let step = m;
      while (from.get(step) !== start) step = from.get(step);
      return [cx(Math.floor(step / ROWS)), cz(step % ROWS)];
    }
  }
  return null;
}

export function think(game) {
  const me = game.tanks.computer, you = game.tanks.player;
  const c = { drive: 0, turn: 0, fire: false };
  const sees = !blocked(me.x, me.z, you.x, you.z, 0.5);
  const goal = sees ? [you.x, you.z] : route(me, you);
  if (!goal) return c;
  const want = Math.atan2(goal[1] - me.z, goal[0] - me.x) * 180 / Math.PI;
  const off = ((want - me.heading + 540) % 360) - 180;
  c.turn = Math.max(-1, Math.min(1, off / 2));
  if (sees) c.fire = Math.abs(off) < 3 && game.tick - me.lastShot >= AI_RELOAD;
  else c.drive = Math.abs(off) < 30 ? 1 : 0;
  return c;
}
