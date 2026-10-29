// The computer's driver: deterministic aim-and-fire, with BFS path-finding when the player is hidden.
import { DT, WALLS, lineClear, boxDist } from './collide.js';

const TURN = 120 * DT, COLS = 40, ROWS = 30, rad = Math.PI / 180;
const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
const cx = (i) => i - 19.5, cz = (j) => j - 14.5;

const free = [];
for (let j = 0; j < ROWS; j++) {
  for (let i = 0; i < COLS; i++) {
    free.push(Math.abs(cx(i)) <= 18.5 && Math.abs(cz(j)) <= 13.5 && WALLS.every((w) => boxDist(cx(i), cz(j), w) >= 1.5));
  }
}

// Clear line of fire from a tank at (x,z) facing unit (ux,uz) to the player: from centre and from the muzzle.
const clear = (x, z, ux, uz, p) => lineClear(x, z, p.x, p.z) && lineClear(x + 1.6 * ux, z + 1.6 * uz, p.x, p.z);

function towards(x, z, p) {
  const d = Math.hypot(p.x - x, p.z - z) || 1;
  return [(p.x - x) / d, (p.z - z) / d];
}

// BFS from the computer's cell to the nearest free cell with a clear line to the player.
function plan(c, p) {
  const col = Math.max(0, Math.min(COLS - 1, Math.floor(c.x + 20)));
  const row = Math.max(0, Math.min(ROWS - 1, Math.floor(c.z + 15)));
  const start = row * COLS + col, prev = new Int32Array(COLS * ROWS).fill(-1);
  prev[start] = start;
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const n = queue[q], i = n % COLS, j = (n - i) / COLS;
    if (free[n] && clear(cx(i), cz(j), ...towards(cx(i), cz(j), p), p)) {
      const path = [];
      for (let m = n; m !== start; m = prev[m]) path.unshift([cx(m % COLS), cz(Math.floor(m / COLS))]);
      return [[cx(col), cz(row)], ...path];
    }
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj, m = nj * COLS + ni;
      if (ni >= 0 && ni < COLS && nj >= 0 && nj < ROWS && free[m] && prev[m] < 0) { prev[m] = n; queue.push(m); }
    }
  }
  return [];
}

// -> {dh: heading change this step, fwd: forward speed, fire: bool}
export function think(s) {
  const c = s.tanks.computer, p = s.tanks.player, m = s.mem;
  const turn = (x, z) => {
    const err = wrap(Math.atan2(z - c.z, x - c.x) / rad - c.heading);
    return [err, Math.max(-TURN, Math.min(TURN, err))];
  };
  if (clear(c.x, c.z, ...towards(c.x, c.z, p), p)) {
    const [err, dh] = turn(p.x, p.z);
    const ok = Math.abs(err) < 3 && clear(c.x, c.z, Math.cos(c.heading * rad), Math.sin(c.heading * rad), p);
    return { dh, fwd: 0, fire: ok && s.time - c.last >= 1 };
  }
  m.t -= DT;
  if (m.t <= 0 || !m.path.length) { m.t = 0.5; m.path = plan(c, p); }
  if (!m.path.length) return { dh: 0, fwd: 0, fire: false };
  const d2 = ([x, z]) => Math.hypot(x - c.x, z - c.z);
  let k = 0;
  m.path.forEach((q, i) => { if (d2(q) < d2(m.path[k])) k = i; });
  const [wx, wz] = m.path[Math.min(k + 2, m.path.length - 1)];
  const [err, dh] = turn(wx, wz);
  return { dh, fwd: Math.abs(err) < 30 ? 6 : 0, fire: false };
}
