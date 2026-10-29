// The computer's driver: aim and fire on a clear line, else walk a BFS path to a spot with one.
import { WALLS, HALF_X, HALF_Z, R, SR, rectDist, segClear } from './geom.js';

const MARGIN = R + 0.3, COLS = 2 * HALF_X, ROWS = 2 * HALF_Z;
const cx = (i) => i - HALF_X + 0.5, cz = (j) => j - HALF_Z + 0.5;
const FREE = Array.from({ length: COLS * ROWS }, (_, k) => {
  const x = cx(k % COLS), z = cz(Math.floor(k / COLS));
  return Math.abs(x) <= HALF_X - MARGIN && Math.abs(z) <= HALF_Z - MARGIN && WALLS.every((w) => rectDist(w, x, z) >= MARGIN);
});
const cell = (x, z) => [Math.max(0, Math.min(COLS - 1, Math.floor(x + HALF_X))), Math.max(0, Math.min(ROWS - 1, Math.floor(z + HALF_Z)))];

/** Cell centres from the computer's cell to the nearest cell with a clear line to (px,pz), or null. */
// The line is checked with `pad` beyond the shell radius: a cell clear by SR + 0.75 stays clear by SR anywhere
// within 0.75 of its centre, so the computer reaching it (or standing in it) really has a clear line.
function findPath(x, z, px, pz, pad) {
  const [si, sj] = cell(x, z), start = sj * COLS + si, from = new Map([[start, -1]]), queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const k = queue[q], i = k % COLS, j = Math.floor(k / COLS);
    if (segClear(cx(i), cz(j), px, pz, pad)) {
      const path = [];
      for (let m = k; m >= 0; m = from.get(m)) path.unshift([cx(m % COLS), cz(Math.floor(m / COLS))]);
      return path;
    }
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj, nk = nj * COLS + ni;
      if (ni >= 0 && ni < COLS && nj >= 0 && nj < ROWS && FREE[nk] && !from.has(nk)) { from.set(nk, k); queue.push(nk); }
    }
  }
  return null;
}

const turnToward = (c, tx, tz, dt) => {
  const err = ((((Math.atan2(tz - c.z, tx - c.x) * 180) / Math.PI - c.h + 180) % 360) + 360) % 360 - 180;
  return { err, turn: Math.max(-1, Math.min(1, err / (120 * dt))) };
};

/** Controls {fwd, turn, fire} for the computer this step. */
export function aiControl(s, dt) {
  const c = s.tanks.computer, p = s.tanks.player;
  if (segClear(c.x, c.z, p.x, p.z, SR)) {
    s.nav = null;
    const { err, turn } = turnToward(c, p.x, p.z, dt);
    return { fwd: 0, turn, fire: Math.abs(err) < 4 && s.time - c.last >= 1 };
  }
  if (!s.nav || s.nav.wait <= 0) s.nav = { wait: 0.5, path: findPath(c.x, c.z, p.x, p.z, SR + 0.75) || findPath(c.x, c.z, p.x, p.z, SR) };
  s.nav.wait -= dt;
  const path = s.nav.path;
  if (!path) return { fwd: 0, turn: 0, fire: false };
  const next = path.slice(1).find(([x, z]) => Math.hypot(x - c.x, z - c.z) > 0.5) || path[path.length - 1];
  if (Math.hypot(next[0] - c.x, next[1] - c.z) < 0.1) return { fwd: 0, turn: 0, fire: false };
  const { err, turn } = turnToward(c, next[0], next[1], dt);
  return { fwd: Math.abs(err) < 30 ? 1 : 0, turn, fire: false };
}
