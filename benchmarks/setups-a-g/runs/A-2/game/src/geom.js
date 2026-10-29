import { ARENA, WALLS } from './config.js';

const HX = ARENA.width / 2;
const HZ = ARENA.depth / 2;

export const rad = (deg) => (deg * Math.PI) / 180;
export const norm = (deg) => ((deg % 360) + 360) % 360;

/**
 * The deepest overlap of a circle with the outer or an inner wall: {nx, nz, depth} (normal points out of the wall), or null.
 * A circle whose centre is inside a wall leaves by the face it is moving into, when its velocity `v` is given.
 */
export function wallContact(x, z, r, v) {
  let best = null;
  const hit = (nx, nz, depth) => {
    if (depth > 1e-9 && (!best || depth > best.depth)) best = { nx, nz, depth };
  };
  hit(1, 0, r - (x + HX));
  hit(-1, 0, r - (HX - x));
  hit(0, 1, r - (z + HZ));
  hit(0, -1, r - (HZ - z));
  for (const w of WALLS) {
    const hw = w.width / 2;
    const hd = w.depth / 2;
    const dx = x - Math.max(w.x - hw, Math.min(x, w.x + hw));
    const dz = z - Math.max(w.z - hd, Math.min(z, w.z + hd));
    const d = Math.hypot(dx, dz);
    if (d > 0) {
      hit(dx / d, dz / d, r - d);
    } else {
      const faces = [[-1, 0, x - (w.x - hw)], [1, 0, w.x + hw - x], [0, -1, z - (w.z - hd)], [0, 1, w.z + hd - z]];
      const entered = v ? faces.filter((f) => f[0] * v.x + f[1] * v.z < 0) : [];
      const [nx, nz, gap] = (entered.length ? entered : faces).reduce((a, b) => (b[2] < a[2] ? b : a));
      hit(nx, nz, r + gap);
    }
  }
  return best;
}

/** Distance from point p to the segment a-b. */
export function segmentDistance(a, b, p) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / len2)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.z - (a.z + t * dz));
}

/** Moves a circle out of the walls (a few passes, for corners). */
export function pushOut(p, r) {
  for (let i = 0; i < 3; i++) {
    const c = wallContact(p.x, p.z, r);
    if (!c) return;
    p.x += c.nx * c.depth;
    p.z += c.nz * c.depth;
  }
}

/** True when no inner wall, grown by `pad`, lies on the segment a-b. */
export function lineClear(ax, az, bx, bz, pad) {
  return !WALLS.some((w) => {
    let t0 = 0;
    let t1 = 1;
    const axes = [[ax, bx - ax, w.x - w.width / 2 - pad, w.x + w.width / 2 + pad],
      [az, bz - az, w.z - w.depth / 2 - pad, w.z + w.depth / 2 + pad]];
    for (const [a, d, lo, hi] of axes) {
      if (Math.abs(d) < 1e-12) {
        if (a < lo || a > hi) return false;
        continue;
      }
      const u = (lo - a) / d;
      const v = (hi - a) / d;
      t0 = Math.max(t0, Math.min(u, v));
      t1 = Math.min(t1, Math.max(u, v));
    }
    return t0 <= t1;
  });
}
