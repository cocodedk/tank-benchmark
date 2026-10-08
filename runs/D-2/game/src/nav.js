import {HALF, TANK_R, WALLS} from './config.js';
import {clamp, rectDist, segBlocked} from './geom.js';

// A 1-unit grid of cell centres a tank can stand on, with 0.3 to spare.
const W = 2 * HALF.x;
const H = 2 * HALF.z;
const MARGIN = TANK_R + 0.3;
const centre = (i, half) => i + 0.5 - half;
const FREE = Array.from({length: W * H}, (_, c) => {
  const x = centre(c % W, HALF.x);
  const z = centre(Math.floor(c / W), HALF.z);
  return Math.abs(x) <= HALF.x - MARGIN && Math.abs(z) <= HALF.z - MARGIN && WALLS.every(w => rectDist(x, z, w) >= MARGIN);
});
const isFree = (ix, iz) => ix >= 0 && iz >= 0 && ix < W && iz < H && FREE[iz * W + ix];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** A point a few cells along the shortest path from `me` to the nearest cell with a clear line to `you`, or null. */
export function findSpot(me, you) {
  const ix = clamp(Math.floor(me.x + HALF.x), 0, W - 1);
  const iz = clamp(Math.floor(me.z + HALF.z), 0, H - 1);
  const start = iz * W + ix;
  const parent = new Map([[start, -1]]);
  const queue = [start];
  for (const c of queue) {
    const cx = c % W;
    const cz = Math.floor(c / W);
    if (c !== start && !segBlocked(centre(cx, HALF.x), centre(cz, HALF.z), you.x, you.z, WALLS, 0.5)) {
      const path = [];
      for (let p = c; p !== -1; p = parent.get(p)) path.unshift(p);
      const goal = path[Math.min(3, path.length - 1)];
      return {x: centre(goal % W, HALF.x), z: centre(Math.floor(goal / W), HALF.z)};
    }
    for (const [dx, dz] of DIRS) {
      const n = (cz + dz) * W + cx + dx;
      const diagonalBlocked = dx && dz && !(isFree(cx + dx, cz) && isFree(cx, cz + dz));
      if (isFree(cx + dx, cz + dz) && !diagonalBlocked && !parent.has(n)) {
        parent.set(n, c);
        queue.push(n);
      }
    }
  }
  return null;
}
