// The arena: floor size, inner walls, and the circle tests against them.
export const WIDTH = 40, DEPTH = 30;
export const HALF_W = WIDTH / 2, HALF_D = DEPTH / 2;
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));

const box = (w) => [w.x - w.width / 2, w.x + w.width / 2, w.z - w.depth / 2, w.z + w.depth / 2];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// The closest point of wall w to (x, z).
export function closest(w, x, z) {
  const [x0, x1, z0, z1] = box(w);
  return [clamp(x, x0, x1), clamp(z, z0, z1)];
}

// True when a circle at (x, z) of radius r overlaps an inner wall or crosses the outer wall.
export function blocked(x, z, r) {
  const eps = 1e-6;
  if (x - r < -HALF_W - eps || x + r > HALF_W + eps || z - r < -HALF_D - eps || z + r > HALF_D + eps) return true;
  return WALLS.some((w) => {
    const [cx, cz] = closest(w, x, z);
    return Math.hypot(x - cx, z - cz) < r - eps;
  });
}

// Moves a circle out of every inner wall it overlaps and back inside the outer wall.
export function pushOut(x, z, r) {
  for (const w of WALLS) {
    const [cx, cz] = closest(w, x, z);
    const d = Math.hypot(x - cx, z - cz);
    if (d < r && d > 0) [x, z] = [cx + (x - cx) / d * r, cz + (z - cz) / d * r];
  }
  return [clamp(x, -HALF_W + r, HALF_W - r), clamp(z, -HALF_D + r, HALF_D - r)];
}

// True when a circle of radius r can travel the straight segment without touching an inner wall.
export function clearLine(x0, z0, x1, z1, r) {
  return WALLS.every((w) => {
    const [a, b, c, d] = box(w);
    let t0 = 0, t1 = 1;
    for (const [p, dp, lo, hi] of [[x0, x1 - x0, a - r, b + r], [z0, z1 - z0, c - r, d + r]]) {
      if (Math.abs(dp) < 1e-12) {
        if (p <= lo || p >= hi) return true;
        continue;
      }
      let ta = (lo - p) / dp, tb = (hi - p) / dp;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 >= t1) return true;
    }
    return false;
  });
}
