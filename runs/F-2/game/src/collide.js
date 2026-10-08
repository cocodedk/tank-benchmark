// Circle vs box helpers and the arena geometry. No three.js.
export const DT = 1 / 60;
export const TANK_R = 1.2, SHELL_R = 0.25;
export const HALF_X = 18.8, HALF_Z = 13.8;
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function closest(p, w) {
  return [clamp(p.x, w.x - w.width / 2, w.x + w.width / 2), clamp(p.z, w.z - w.depth / 2, w.z + w.depth / 2)];
}

export function boxDist(x, z, w) {
  const [cx, cz] = closest({ x, z }, w);
  return Math.hypot(x - cx, z - cz);
}

// If circle p (radius r) overlaps box w, push p out to contact and return the unit normal [nx, nz].
export function pushOut(p, w, r) {
  const [cx, cz] = closest(p, w);
  const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
  if (d >= r) return null;
  if (d > 1e-9) {
    p.x = cx + (dx / d) * r; p.z = cz + (dz / d) * r;
    return [dx / d, dz / d];
  }
  const px = w.width / 2 - Math.abs(p.x - w.x), pz = w.depth / 2 - Math.abs(p.z - w.z);
  if (px < pz) {
    const n = Math.sign(p.x - w.x) || 1;
    p.x = w.x + n * (w.width / 2 + r);
    return [n, 0];
  }
  const n = Math.sign(p.z - w.z) || 1;
  p.z = w.z + n * (w.depth / 2 + r);
  return [0, n];
}

// Earliest fraction u in [0, 1] of the move a -> a + d at which a circle of radius r touches box w, or null.
export function touchAt(ax, az, dx, dz, w, r) {
  const f = (u) => boxDist(ax + u * dx, az + u * dz, w);
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) { // distance to a box is convex along a line: ternary search for its minimum
    const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
    if (f(m1) < f(m2)) hi = m2; else lo = m1;
  }
  if (f(lo) > r) return null;
  if (f(0) <= r) return 0;
  let a = 0, b = lo;
  for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (f(m) <= r) b = m; else a = m; }
  return b;
}

function wallsAndBounds(t) {
  for (const w of WALLS) pushOut(t, w, TANK_R);
  t.x = clamp(t.x, -HALF_X, HALF_X);
  t.z = clamp(t.z, -HALF_Z, HALF_Z);
}

// Settle a tank moved from (ox, oz) against walls, bounds and the other tank; if wedged, it stays put.
export function resolveTank(t, other, ox, oz) {
  wallsAndBounds(t);
  let dx = t.x - other.x, dz = t.z - other.z, d = Math.hypot(dx, dz);
  if (d < 2 * TANK_R) {
    if (d < 1e-9) { dx = 1; dz = 0; d = 1; }
    t.x = other.x + (dx / d) * 2 * TANK_R;
    t.z = other.z + (dz / d) * 2 * TANK_R;
    wallsAndBounds(t);
    if (Math.hypot(t.x - other.x, t.z - other.z) < 2 * TANK_R - 1e-9) { t.x = ox; t.z = oz; }
  }
}

// Segment a->b against box w grown by pad (slab test).
export function segHits(ax, az, bx, bz, w, pad) {
  const lo = [w.x - w.width / 2 - pad, w.z - w.depth / 2 - pad];
  const hi = [w.x + w.width / 2 + pad, w.z + w.depth / 2 + pad];
  const o = [ax, az], dir = [bx - ax, bz - az];
  let t0 = 0, t1 = 1;
  for (let i = 0; i < 2; i++) {
    if (Math.abs(dir[i]) < 1e-12) {
      if (o[i] < lo[i] || o[i] > hi[i]) return false;
    } else {
      let a = (lo[i] - o[i]) / dir[i], b = (hi[i] - o[i]) / dir[i];
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
      if (t0 > t1) return false;
    }
  }
  return true;
}

export const lineClear = (ax, az, bx, bz) => !WALLS.some((w) => segHits(ax, az, bx, bz, w, SHELL_R));
