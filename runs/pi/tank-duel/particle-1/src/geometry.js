/** Headings are degrees; (cos h, sin h) points in (x, z). */
export const norm = (h) => ((h % 360) + 360) % 360;

export function angleTo(ax, az, bx, bz) {
  return norm((Math.atan2(bz - az, bx - ax) * 180) / Math.PI);
}

/** Signed shortest turn from a to b, in [-180, 180). */
export function angleDiff(a, b) {
  let d = norm(a - b);
  if (d >= 180) d -= 360;
  return d;
}

export function turnToward(current, target, maxStep) {
  const d = angleDiff(target, current);
  if (Math.abs(d) <= maxStep) return norm(target);
  return norm(current + Math.sign(d) * maxStep);
}

/** Contact between a circle and an axis-aligned wall, or null. */
export function circleRect(cx, cz, r, rect) {
  const minX = rect.x - rect.width / 2;
  const maxX = rect.x + rect.width / 2;
  const minZ = rect.z - rect.depth / 2;
  const maxZ = rect.z + rect.depth / 2;
  const px = Math.max(minX, Math.min(cx, maxX));
  const pz = Math.max(minZ, Math.min(cz, maxZ));
  const dx = cx - px;
  const dz = cz - pz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return null;
  if (d2 > 1e-9) {
    const d = Math.sqrt(d2);
    return { nx: dx / d, nz: dz / d, depth: r - d };
  }
  // Centre is inside the wall: push out through the nearest face.
  const dl = cx - minX;
  const dr = maxX - cx;
  const dn = cz - minZ;
  const df = maxZ - cz;
  const m = Math.min(dl, dr, dn, df);
  if (m === dl) return { nx: -1, nz: 0, depth: dl + r };
  if (m === dr) return { nx: 1, nz: 0, depth: dr + r };
  if (m === dn) return { nx: 0, nz: -1, depth: dn + r };
  return { nx: 0, nz: 1, depth: df + r };
}

/** True when the segment from a to b crosses the wall rectangle. */
export function segmentHitsRect(ax, az, bx, bz, rect) {
  const minX = rect.x - rect.width / 2;
  const maxX = rect.x + rect.width / 2;
  const minZ = rect.z - rect.depth / 2;
  const maxZ = rect.z + rect.depth / 2;
  const dx = bx - ax;
  const dz = bz - az;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dz, dz];
  const q = [ax - minX, maxX - ax, az - minZ, maxZ - az];
  for (let i = 0; i < 4; i += 1) {
    if (Math.abs(p[i]) < 1e-12) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return false;
    }
  }
  return true;
}
