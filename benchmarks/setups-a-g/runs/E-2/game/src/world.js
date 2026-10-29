// The arena and its geometry: walls are axis-aligned rectangles in (x, z).
export const HALF_W = 20, HALF_D = 15;
export const TANK_R = 1.2, SHELL_R = 0.25;
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));

// The vector from the nearest point of wall w to (x, z).
function away(w, x, z) {
  const cx = Math.max(w.x - w.width / 2, Math.min(x, w.x + w.width / 2));
  const cz = Math.max(w.z - w.depth / 2, Math.min(z, w.z + w.depth / 2));
  return [x - cx, z - cz];
}

// The move that takes a circle at (x, z) of radius r clear of wall w, or null if it is clear already.
// A centre inside the wall leaves through the nearest face.
function exit(w, x, z, r) {
  const [dx, dz] = away(w, x, z), d = Math.hypot(dx, dz);
  if (d >= r) return null;
  if (d > 0) return [dx / d * (r - d), dz / d * (r - d)];
  const l = x - (w.x - w.width / 2), rt = w.x + w.width / 2 - x, b = z - (w.z - w.depth / 2), t = w.z + w.depth / 2 - z;
  const m = Math.min(l, rt, b, t);
  return m === l ? [-(l + r), 0] : m === rt ? [rt + r, 0] : m === b ? [0, -(b + r)] : [0, t + r];
}

// Does a circle at (x, z) of radius r touch an inner wall?
export function hitsWall(x, z, r) {
  return WALLS.some(w => exit(w, x, z, r));
}

export function inArena(x, z, r) {
  return Math.abs(x) <= HALF_W - r && Math.abs(z) <= HALF_D - r;
}

// Push a circle out of the walls and the arena edge; returns the position.
export function pushOut(x, z, r) {
  for (const w of WALLS) {
    const e = exit(w, x, z, r);
    if (e) { x += e[0]; z += e[1]; }
  }
  x = Math.max(-HALF_W + r, Math.min(HALF_W - r, x));
  z = Math.max(-HALF_D + r, Math.min(HALF_D - r, z));
  return [x, z];
}

// The wall a shell touches: 'x' if its x velocity flips, 'z' if its z velocity does, else null.
export function shellContact(s) {
  if (Math.abs(s.x) > HALF_W - SHELL_R) return 'x';
  if (Math.abs(s.z) > HALF_D - SHELL_R) return 'z';
  for (const w of WALLS) {
    const e = exit(w, s.x, s.z, SHELL_R);
    if (e) return Math.abs(e[0]) >= Math.abs(e[1]) ? 'x' : 'z';
  }
  return null;
}

// Is the segment from a to b clear of every inner wall grown by r?
export function clearLine(ax, az, bx, bz, r) {
  return WALLS.every(w => {
    let t0 = 0, t1 = 1;
    for (const [p, d, lo, hi] of [[ax, bx - ax, w.x - w.width / 2 - r, w.x + w.width / 2 + r],
                                  [az, bz - az, w.z - w.depth / 2 - r, w.z + w.depth / 2 + r]]) {
      if (d === 0) { if (p < lo || p > hi) return true; continue; }
      let u = (lo - p) / d, v = (hi - p) / d;
      if (u > v) [u, v] = [v, u];
      t0 = Math.max(t0, u); t1 = Math.min(t1, v);
      if (t0 > t1) return true;
    }
    return false;
  });
}
