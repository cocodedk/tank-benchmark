// Constants and geometry helpers.
export const ARENA = { width: 40, depth: 30 };
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));
export const TANK_R = 1.2, SHELL_R = 0.25;
export const FWD = 6, REV = 4, TURN = 120, SHELL_V = 15, DT = 1 / 60;
const HX = ARENA.width / 2, HZ = ARENA.depth / 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Push circle p ({x, z}, mutated) out of wall w to exact contact; true if it overlapped.
export function pushRect(p, r, w) {
  const hx = w.width / 2, hz = w.depth / 2;
  const qx = clamp(p.x, w.x - hx, w.x + hx), qz = clamp(p.z, w.z - hz, w.z + hz);
  const dx = p.x - qx, dz = p.z - qz, d = Math.hypot(dx, dz);
  if (d >= r) return false;
  if (d > 0) { p.x = qx + dx / d * r; p.z = qz + dz / d * r; }
  else if (hx - Math.abs(p.x - w.x) < hz - Math.abs(p.z - w.z)) p.x = w.x + (p.x < w.x ? -1 : 1) * (hx + r);
  else p.z = w.z + (p.z < w.z ? -1 : 1) * (hz + r);
  return true;
}

// Keep the circle inside the outer walls and out of the inner ones.
export function resolve(p, r) {
  for (let i = 0; i < 3; i++) {
    p.x = clamp(p.x, -HX + r, HX - r);
    p.z = clamp(p.z, -HZ + r, HZ - r);
    for (const w of WALLS) pushRect(p, r, w);
  }
}

export const blocked = (x, z, r) =>
  Math.abs(x) > HX - r || Math.abs(z) > HZ - r || WALLS.some(w => pushRect({ x, z }, r, w));

// True when the segment misses every inner wall grown by pad.
export function segClear(x0, z0, x1, z1, pad) {
  return WALLS.every(w => {
    let t0 = 0, t1 = 1;
    for (const [a, b, lo, hi] of [[x0, x1 - x0, w.x - w.width / 2 - pad, w.x + w.width / 2 + pad],
                                  [z0, z1 - z0, w.z - w.depth / 2 - pad, w.z + w.depth / 2 + pad]]) {
      if (b === 0) { if (a < lo || a > hi) return true; continue; }
      const u = (lo - a) / b, v = (hi - a) / b;
      t0 = Math.max(t0, Math.min(u, v)); t1 = Math.min(t1, Math.max(u, v));
    }
    return t0 > t1;
  });
}
