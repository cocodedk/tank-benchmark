export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const side = v => (v >= 0 ? 1 : -1);

/** Distance from point (x, z) to wall rectangle w (0 inside it). */
export function rectDist(x, z, w) {
  return Math.hypot(x - clamp(x, w.x - w.width / 2, w.x + w.width / 2),
                    z - clamp(z, w.z - w.depth / 2, w.z + w.depth / 2));
}

/** Distance from point c to the segment a-b. */
export function segDist(ax, az, bx, bz, cx, cz) {
  const len2 = (bx - ax) ** 2 + (bz - az) ** 2;
  const u = len2 ? clamp(((cx - ax) * (bx - ax) + (cz - az) * (bz - az)) / len2, 0, 1) : 0;
  return Math.hypot(cx - ax - u * (bx - ax), cz - az - u * (bz - az));
}

/** Moves a circle of radius r at (x, z) out of wall w; returns [x, z]. */
export function pushOut(x, z, r, w) {
  const cx = clamp(x, w.x - w.width / 2, w.x + w.width / 2);
  const cz = clamp(z, w.z - w.depth / 2, w.z + w.depth / 2);
  const d = Math.hypot(x - cx, z - cz);
  if (d >= r) return [x, z];
  if (d > 0) return [cx + (x - cx) / d * r, cz + (z - cz) / d * r];
  const px = w.width / 2 + r - Math.abs(x - w.x);
  const pz = w.depth / 2 + r - Math.abs(z - w.z);
  return px < pz ? [w.x + side(x - w.x) * (w.width / 2 + r), z] : [x, w.z + side(z - w.z) * (w.depth / 2 + r)];
}

/** True when the segment a-b passes within pad of wall w (slab test on the grown rectangle). */
function crosses(ax, az, bx, bz, w, pad) {
  let t0 = 0;
  let t1 = 1;
  for (const [a, d, c, h] of [[ax, bx - ax, w.x, w.width / 2 + pad], [az, bz - az, w.z, w.depth / 2 + pad]]) {
    const lo = c - h - a;
    const hi = c + h - a;
    if (d === 0) {
      if (lo > 0 || hi < 0) return false;
    } else {
      t0 = Math.max(t0, Math.min(lo / d, hi / d));
      t1 = Math.min(t1, Math.max(lo / d, hi / d));
      if (t0 > t1) return false;
    }
  }
  return true;
}

export const segBlocked = (ax, az, bx, bz, walls, pad) => walls.some(w => crosses(ax, az, bx, bz, w, pad));

/** Shortest distance between the segment a-b and wall rectangle w (0 when they cross). */
export function segRectDist(ax, az, bx, bz, w) {
  if (crosses(ax, az, bx, bz, w, 0)) return 0;
  const corners = [-1, 1].flatMap(i => [-1, 1].map(j => [w.x + i * w.width / 2, w.z + j * w.depth / 2]));
  return Math.min(rectDist(ax, az, w), rectDist(bx, bz, w), ...corners.map(([cx, cz]) => segDist(ax, az, bx, bz, cx, cz)));
}
