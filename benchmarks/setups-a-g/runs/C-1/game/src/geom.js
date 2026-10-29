// Arena constants and circle/segment geometry against the walls. No three.js.
export const HALF_X = 20, HALF_Z = 15, R = 1.2, SR = 0.25;
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Distance from point (px,pz) to wall rectangle w. */
export function rectDist(w, px, pz) {
  return Math.hypot(px - clamp(px, w.x - w.width / 2, w.x + w.width / 2), pz - clamp(pz, w.z - w.depth / 2, w.z + w.depth / 2));
}

/** Push circle `p` (x,z) radius r out of wall w to distance exactly r. Returns the contact normal [nx,nz] or null. */
export function pushOut(p, r, w) {
  const hw = w.width / 2, hd = w.depth / 2;
  let qx = clamp(p.x, w.x - hw, w.x + hw), qz = clamp(p.z, w.z - hd, w.z + hd);
  let dx = p.x - qx, dz = p.z - qz, d = Math.hypot(dx, dz);
  if (d >= r) return null;
  if (d < 1e-9) { // centre inside: leave through the nearest side
    const sides = [[p.x - (w.x - hw), -1, 0], [w.x + hw - p.x, 1, 0], [p.z - (w.z - hd), 0, -1], [w.z + hd - p.z, 0, 1]];
    const [, nx, nz] = sides.reduce((a, b) => (b[0] < a[0] ? b : a));
    qx = nx ? w.x + nx * hw : p.x; qz = nz ? w.z + nz * hd : p.z;
    dx = nx; dz = nz; d = 1;
  }
  p.x = qx + (dx / d) * r; p.z = qz + (dz / d) * r;
  return [dx / d, dz / d];
}

/** True when segment a->b misses every inner wall inflated by pad. */
export function segClear(ax, az, bx, bz, pad) {
  return WALLS.every((w) => {
    let t0 = 0, t1 = 1;
    for (const [a, d, lo, hi] of [[ax, bx - ax, w.x - w.width / 2 - pad, w.x + w.width / 2 + pad],
                                  [az, bz - az, w.z - w.depth / 2 - pad, w.z + w.depth / 2 + pad]]) {
      if (Math.abs(d) < 1e-12) { if (a < lo || a > hi) return true; continue; }
      let ta = (lo - a) / d, tb = (hi - a) / d;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
      if (t0 > t1) return true;
    }
    return false;
  });
}
