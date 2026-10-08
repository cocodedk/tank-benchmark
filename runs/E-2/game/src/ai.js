// The computer: aims and fires when it sees you, otherwise follows a grid path to a cell that does.
import { TANK_R, SHELL_R, HALF_W, HALF_D, hitsWall, inArena, clearLine } from './world.js';
import { game, drive, fire } from './game.js';

const COLS = 2 * HALF_W, ROWS = 2 * HALF_D;
const centre = i => [(i % COLS) - HALF_W + 0.5, Math.floor(i / COLS) - HALF_D + 0.5];
const FREE = Array.from({ length: COLS * ROWS }, (_, i) => {
  const [x, z] = centre(i);
  return inArena(x, z, TANK_R + 0.2) && !hitsWall(x, z, TANK_R + 0.2);
});
const cellOf = (x, z) =>
  Math.min(ROWS - 1, Math.max(0, Math.floor(z + HALF_D))) * COLS + Math.min(COLS - 1, Math.max(0, Math.floor(x + HALF_W)));

// Breadth-first search from the computer's cell to the nearest free cell with a clear shot; the path's cells.
function pathToSight(me, you) {
  const start = cellOf(me.x, me.z), from = new Map([[start, -1]]), queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q], [x, z] = centre(i);
    if (clearLine(x, z, you.x, you.z, SHELL_R)) {
      const path = [];
      for (let j = i; j !== -1; j = from.get(j)) path.unshift(j);
      return path;
    }
    const c = i % COLS;
    for (const n of [c > 0 && i - 1, c < COLS - 1 && i + 1, i - COLS, i + COLS]) {
      if (n !== false && n >= 0 && n < COLS * ROWS && FREE[n] && !from.has(n)) { from.set(n, i); queue.push(n); }
    }
  }
  return [start];
}

// Signed degrees from heading h to the direction of (dx, dz), in (-180, 180].
function bearing(h, dx, dz) {
  const d = ((Math.atan2(dz, dx) * 180 / Math.PI - h) % 360 + 540) % 360 - 180;
  return d === -180 ? 180 : d;
}

const turnTo = diff => Math.max(-1, Math.min(1, diff / 2));   // 2 degrees per step at full turn

export function think() {
  const me = game.tanks.computer, you = game.tanks.player;
  if (clearLine(me.x, me.z, you.x, you.z, SHELL_R)) {
    // A slow wobble in its aim, so it sometimes misses at long range.
    const diff = bearing(me.heading, you.x - me.x, you.z - me.z) + 3 * Math.sin(game.tick * 0.05);
    drive('computer', 0, turnTo(diff));
    if (Math.abs(diff) < 2) fire('computer');
    return;
  }
  const path = pathToSight(me, you);
  const [tx, tz] = centre(path[Math.min(1, path.length - 1)]);
  const diff = bearing(me.heading, tx - me.x, tz - me.z);
  drive('computer', Math.abs(diff) < 45 ? 1 : 0, turnTo(diff));
}
