// The arena: fixed geometry and the circle-versus-wall maths shared by tanks, shells and the AI.
export const HALF_X = 20;
export const HALF_Z = 15;
export const TANK_R = 1.2;
export const SHELL_R = 0.25;
const EPS = 1e-9;

export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// The point of wall w nearest to (x, z).
export function nearest(w, x, z) {
  return [clamp(x, w.x - w.width / 2, w.x + w.width / 2), clamp(z, w.z - w.depth / 2, w.z + w.depth / 2)];
}

// Can a tank circle (plus margin) stand at (x, z) without touching a wall?
export function clear(x, z, margin = 0) {
  const r = TANK_R + margin - EPS;
  return Math.abs(x) <= HALF_X - r && Math.abs(z) <= HALF_Z - r
    && WALLS.every(w => { const [cx, cz] = nearest(w, x, z); return Math.hypot(x - cx, z - cz) >= r; });
}

// Move point p (a tank) out of every wall it overlaps; it slides along them.
export function pushOutOfWalls(p) {
  for (const w of WALLS) {
    const [cx, cz] = nearest(w, p.x, p.z);
    const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d > 0 && d < TANK_R) { p.x = cx + dx / d * TANK_R; p.z = cz + dz / d * TANK_R; }
  }
  p.x = clamp(p.x, -HALF_X + TANK_R, HALF_X - TANK_R);
  p.z = clamp(p.z, -HALF_Z + TANK_R, HALF_Z - TANK_R);
}

// Does the segment a-b pass through an inner wall grown by margin m?
export function blocked(ax, az, bx, bz, m) {
  return WALLS.some(w => {
    let t0 = 0, t1 = 1;
    for (const [a, d, lo, hi] of [
      [ax, bx - ax, w.x - w.width / 2 - m, w.x + w.width / 2 + m],
      [az, bz - az, w.z - w.depth / 2 - m, w.z + w.depth / 2 + m]]) {
      if (d === 0) { if (a < lo || a > hi) return false; continue; }
      const u = (lo - a) / d, v = (hi - a) / d;
      t0 = Math.max(t0, Math.min(u, v));
      t1 = Math.min(t1, Math.max(u, v));
    }
    return t0 <= t1;
  });
}
