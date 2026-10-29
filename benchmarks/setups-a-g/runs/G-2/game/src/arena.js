// The arena's geometry: floor bounds, inner walls and the collision tests on them.
export const HALF_W = 20, HALF_D = 15, TANK_R = 1.2, SHELL_R = 0.25;
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));

// The point of a wall nearest to (x, z).
export function nearest(w, x, z) {
  return {
    x: Math.max(w.x - w.width / 2, Math.min(w.x + w.width / 2, x)),
    z: Math.max(w.z - w.depth / 2, Math.min(w.z + w.depth / 2, z)),
  };
}

// The inner wall a circle overlaps, or null.
export function wallHit(x, z, r) {
  return WALLS.find(w => { const p = nearest(w, x, z); return Math.hypot(x - p.x, z - p.z) < r; }) || null;
}

export function inside(x, z, r) {
  return Math.abs(x) <= HALF_W - r && Math.abs(z) <= HALF_D - r;
}

// True when the segment a→b, widened by r, crosses no inner wall (slab test on each grown wall).
export function clearLine(ax, az, bx, bz, r) {
  return WALLS.every(w => {
    let t0 = 0, t1 = 1;
    for (const [a, d, lo, hi] of [[ax, bx - ax, w.x - w.width / 2 - r, w.x + w.width / 2 + r],
                                  [az, bz - az, w.z - w.depth / 2 - r, w.z + w.depth / 2 + r]]) {
      if (Math.abs(d) < 1e-9) { if (a < lo || a > hi) return true; continue; }
      let u = (lo - a) / d, v = (hi - a) / d;
      if (u > v) [u, v] = [v, u];
      t0 = Math.max(t0, u); t1 = Math.min(t1, v);
      if (t0 > t1) return true;
    }
    return false;
  });
}
