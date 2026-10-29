import { ARENA, TANK, WALLS } from './constants.js';
import { circleOverlapsWall, clamp } from './physics.js';

const CELL = 1;
const MARGIN = TANK.radius + 0.6;
const MIN_X = -ARENA.halfWidth + TANK.radius;
const MAX_X = ARENA.halfWidth - TANK.radius;
const MIN_Z = -ARENA.halfDepth + TANK.radius;
const MAX_Z = ARENA.halfDepth - TANK.radius;
const COLS = Math.ceil((MAX_X - MIN_X) / CELL);
const ROWS = Math.ceil((MAX_Z - MIN_Z) / CELL);

const blocked = new Uint8Array(COLS * ROWS);
for (let j = 0; j < ROWS; j += 1) {
  for (let i = 0; i < COLS; i += 1) {
    const x = MIN_X + (i + 0.5) * CELL;
    const z = MIN_Z + (j + 0.5) * CELL;
    blocked[j * COLS + i] = WALLS.some((wall) => circleOverlapsWall(x, z, MARGIN, wall)) ? 1 : 0;
  }
}

const cellX = (i) => MIN_X + (i + 0.5) * CELL;
const cellZ = (j) => MIN_Z + (j + 0.5) * CELL;

function cellOf(x, z) {
  return {
    i: clamp(Math.floor((x - MIN_X) / CELL), 0, COLS - 1),
    j: clamp(Math.floor((z - MIN_Z) / CELL), 0, ROWS - 1),
  };
}

function nearestFree(i, j) {
  const maxRing = Math.max(COLS, ROWS);
  for (let ring = 0; ring <= maxRing; ring += 1) {
    let best = null;
    let bestDistance = Infinity;
    for (let dj = -ring; dj <= ring; dj += 1) {
      for (let di = -ring; di <= ring; di += 1) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== ring) continue;
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= COLS || nj >= ROWS) continue;
        if (blocked[nj * COLS + ni]) continue;
        const d = di * di + dj * dj;
        if (d < bestDistance) {
          bestDistance = d;
          best = { i: ni, j: nj };
        }
      }
    }
    if (best) return best;
  }
  return null;
}

/** Cell-centre waypoints from a position to another, around the inner walls. */
export function findPath(from, to) {
  const startCell = cellOf(from.x, from.z);
  const goalCell = cellOf(to.x, to.z);
  const start = nearestFree(startCell.i, startCell.j);
  const goal = nearestFree(goalCell.i, goalCell.j);
  if (!start || !goal) return [];

  const startIndex = start.j * COLS + start.i;
  const goalIndex = goal.j * COLS + goal.i;
  if (startIndex === goalIndex) return [];

  const previous = new Int32Array(COLS * ROWS).fill(-1);
  const seen = new Uint8Array(COLS * ROWS);
  const queue = new Int32Array(COLS * ROWS);
  let head = 0;
  let tail = 0;
  queue[tail] = startIndex;
  tail += 1;
  seen[startIndex] = 1;
  let found = false;

  while (head < tail) {
    const current = queue[head];
    head += 1;
    if (current === goalIndex) {
      found = true;
      break;
    }
    const i = current % COLS;
    const j = (current - i) / COLS;
    const neighbours = [];
    if (i > 0) neighbours.push(current - 1);
    if (i < COLS - 1) neighbours.push(current + 1);
    if (j > 0) neighbours.push(current - COLS);
    if (j < ROWS - 1) neighbours.push(current + COLS);
    for (const next of neighbours) {
      if (seen[next] || blocked[next]) continue;
      seen[next] = 1;
      previous[next] = current;
      queue[tail] = next;
      tail += 1;
    }
  }
  if (!found) return [];

  const path = [];
  let current = goalIndex;
  while (current !== startIndex) {
    path.push({ x: cellX(current % COLS), z: cellZ(Math.floor(current / COLS)) });
    current = previous[current];
    if (current < 0) return [];
  }
  path.reverse();
  return path;
}
