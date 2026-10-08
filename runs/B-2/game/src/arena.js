export const ARENA = { width: 40, depth: 30 };
export const TANK_R = 1.2;
export const SHELL_R = 0.25;
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Push circle p (has x, z) of radius r out of wall w. Returns the contact normal, or null if no overlap.
export function pushOut(p, r, w) {
  const hx = w.width / 2, hz = w.depth / 2;
  const cx = clamp(p.x, w.x - hx, w.x + hx), cz = clamp(p.z, w.z - hz, w.z + hz);
  const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
  if (d >= r) return null;
  if (d > 0) {
    p.x = cx + (dx / d) * r;
    p.z = cz + (dz / d) * r;
    return { x: dx / d, z: dz / d };
  }
  // centre inside the rect: leave through the nearest face
  if (hx - Math.abs(p.x - w.x) < hz - Math.abs(p.z - w.z)) {
    const s = Math.sign(p.x - w.x) || 1;
    p.x = w.x + s * (hx + r);
    return { x: s, z: 0 };
  }
  const s = Math.sign(p.z - w.z) || 1;
  p.z = w.z + s * (hz + r);
  return { x: 0, z: s };
}

// Is a circle at (x, z) of radius r outside the arena or touching an inner wall?
export function blocked(x, z, r) {
  return Math.abs(x) > ARENA.width / 2 - r || Math.abs(z) > ARENA.depth / 2 - r
    || WALLS.some((w) => pushOut({ x, z }, r, w));
}

// Distance from a point to a wall rectangle (0 inside).
export function wallDist(x, z, w) {
  return Math.hypot(Math.max(Math.abs(x - w.x) - w.width / 2, 0), Math.max(Math.abs(z - w.z) - w.depth / 2, 0));
}

// Slab test: does segment a->b touch wall w inflated by pad?
export function segHits(ax, az, bx, bz, w, pad) {
  const o = [ax, az], d = [bx - ax, bz - az];
  const lo = [w.x - w.width / 2 - pad, w.z - w.depth / 2 - pad];
  const hi = [w.x + w.width / 2 + pad, w.z + w.depth / 2 + pad];
  let t0 = 0, t1 = 1;
  for (let i = 0; i < 2; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < lo[i] || o[i] > hi[i]) return false;
    } else {
      let a = (lo[i] - o[i]) / d[i], b = (hi[i] - o[i]) / d[i];
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
      if (t0 > t1) return false;
    }
  }
  return true;
}

export const lineClear = (ax, az, bx, bz, pad) => !WALLS.some((w) => segHits(ax, az, bx, bz, w, pad));
