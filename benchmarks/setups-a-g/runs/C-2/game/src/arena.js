export const DT = 1 / 60;
export const R = 1.2;
export const SR = 0.25;
export const HALF_X = 20;
export const HALF_Z = 15;
export const TANK_X = 18.8;
export const TANK_Z = 13.8;
export const SPEED_F = 6;
export const SPEED_B = 4;
export const TURN = 120;
export const SHELL_SPEED = 15;
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));
export const START = {
  player: { x: -15, z: 0, heading: 0 },
  computer: { x: 15, z: 0, heading: 180 },
};

// Push-out of a circle from a box: {nx, nz, pen} or null when they do not overlap.
export function circleBox(cx, cz, r, w) {
  const hx = w.width / 2, hz = w.depth / 2;
  const px = Math.max(w.x - hx, Math.min(cx, w.x + hx));
  const pz = Math.max(w.z - hz, Math.min(cz, w.z + hz));
  const dx = cx - px, dz = cz - pz, d = Math.hypot(dx, dz);
  if (d >= r) return null;
  if (d > 0) return { nx: dx / d, nz: dz / d, pen: r - d };
  const ex = hx - Math.abs(cx - w.x), ez = hz - Math.abs(cz - w.z);
  return ex < ez
    ? { nx: Math.sign(cx - w.x) || 1, nz: 0, pen: ex + r }
    : { nx: 0, nz: Math.sign(cz - w.z) || 1, pen: ez + r };
}

// Does segment a->b touch box w grown by e? (slab test)
export function segHitsBox(ax, az, bx, bz, w, e) {
  let t0 = 0, t1 = 1;
  for (const [a, d, lo, hi] of [
    [ax, bx - ax, w.x - w.width / 2 - e, w.x + w.width / 2 + e],
    [az, bz - az, w.z - w.depth / 2 - e, w.z + w.depth / 2 + e],
  ]) {
    if (Math.abs(d) < 1e-12) {
      if (a < lo || a > hi) return false;
    } else {
      const u = (lo - a) / d, v = (hi - a) / d;
      t0 = Math.max(t0, Math.min(u, v));
      t1 = Math.min(t1, Math.max(u, v));
    }
  }
  return t0 <= t1;
}

export const clear = (ax, az, bx, bz, e) => !WALLS.some((w) => segHitsBox(ax, az, bx, bz, w, e));
