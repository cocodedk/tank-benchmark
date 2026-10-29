// The arena and the geometry the simulation and the AI share.
export const ARENA = { width: 40, depth: 30 };
export const HALF_X = 20, HALF_Z = 15;
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));
export const TANK_R = 1.2, SHELL_R = 0.25;

export const dir = h => [Math.cos(h * Math.PI / 180), Math.sin(h * Math.PI / 180)];
export const norm = h => ((h % 360) + 360) % 360;

// The vector from a wall's nearest point to (x, z).
export function fromWall(w, x, z) {
  const px = Math.max(w.x - w.width / 2, Math.min(w.x + w.width / 2, x));
  const pz = Math.max(w.z - w.depth / 2, Math.min(w.z + w.depth / 2, z));
  return [x - px, z - pz];
}

export const outside = (x, z, r) => Math.abs(x) > HALF_X - r || Math.abs(z) > HALF_Z - r;

// True when a circle of radius r at (x, z) overlaps an inner wall or crosses the outer wall.
export const blockedAt = (x, z, r) => outside(x, z, r) || WALLS.some(w => Math.hypot(...fromWall(w, x, z)) < r);

// True when a circle of radius r swept from (x0, z0) to (x1, z1) touches an inner wall.
export function lineBlocked(x0, z0, x1, z1, r) {
  return WALLS.some(w => {
    const o = [x0, z0], d = [x1 - x0, z1 - z0];
    const lo = [w.x - w.width / 2 - r, w.z - w.depth / 2 - r], hi = [w.x + w.width / 2 + r, w.z + w.depth / 2 + r];
    let t0 = 0, t1 = 1;
    for (let i = 0; i < 2; i++) {
      if (Math.abs(d[i]) < 1e-9) {
        if (o[i] < lo[i] || o[i] > hi[i]) return false;
        continue;
      }
      let a = (lo[i] - o[i]) / d[i], b = (hi[i] - o[i]) / d[i];
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
      if (t0 > t1) return false;
    }
    return true;
  });
}
