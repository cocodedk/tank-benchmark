// Arena constants and the geometry tests (circle vs box, segment vs box).
export const HALF_X = 20;
export const HALF_Z = 15;
export const R_TANK = 1.2;
export const R_SHELL = 0.25;
export const WALLS = [
  { x: -8, z: -8, width: 2, depth: 6 },
  { x: -8, z: 8, width: 2, depth: 6 },
  { x: 8, z: -8, width: 2, depth: 6 },
  { x: 8, z: 8, width: 2, depth: 6 },
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Where a circle at (x, z) ends up when pushed out of box w (same point if clear).
export function pushOut(x, z, r, w) {
  const hx = w.width / 2, hz = w.depth / 2;
  const cx = clamp(x, w.x - hx, w.x + hx), cz = clamp(z, w.z - hz, w.z + hz);
  const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz);
  if (d >= r) return { x, z };
  if (d > 0) return { x: cx + (dx / d) * r, z: cz + (dz / d) * r };
  // centre inside the box: leave by the nearest face
  const ox = hx - Math.abs(x - w.x), oz = hz - Math.abs(z - w.z);
  if (ox < oz) return { x: w.x + Math.sign(x - w.x || 1) * (hx + r), z };
  return { x, z: w.z + Math.sign(z - w.z || 1) * (hz + r) };
}

export function overlapsWall(x, z, r, w) {
  const p = pushOut(x, z, r, w);
  return p.x !== x || p.z !== z;
}

// Does the segment touch box w grown by `grow` on every side? (slab test)
export function segHitsWall(x1, z1, x2, z2, w, grow) {
  const lo = [w.x - w.width / 2 - grow, w.z - w.depth / 2 - grow];
  const hi = [w.x + w.width / 2 + grow, w.z + w.depth / 2 + grow];
  const p = [x1, z1], d = [x2 - x1, z2 - z1];
  let t0 = 0, t1 = 1;
  for (let i = 0; i < 2; i++) {
    if (Math.abs(d[i]) < 1e-12) {
      if (p[i] < lo[i] || p[i] > hi[i]) return false;
    } else {
      let a = (lo[i] - p[i]) / d[i], b = (hi[i] - p[i]) / d[i];
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
      if (t0 > t1) return false;
    }
  }
  return true;
}

export const segBlocked = (x1, z1, x2, z2, grow) =>
  WALLS.some((w) => segHitsWall(x1, z1, x2, z2, w, grow));

// A tank circle fits here: inside the outer walls and clear of the inner ones.
export const insideArena = (x, z) => Math.abs(x) <= HALF_X - R_TANK && Math.abs(z) <= HALF_Z - R_TANK;
export const clearOfWalls = (x, z) => !WALLS.some((w) => overlapsWall(x, z, R_TANK, w));
