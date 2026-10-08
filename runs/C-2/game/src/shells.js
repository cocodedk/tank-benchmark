import { DT, R, SR, HALF_X, HALF_Z, WALLS, circleBox } from "./arena.js";

const NAMES = ["player", "computer"];

// Distance from point (px, pz) to segment a->b.
function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz;
  const k = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l)) : 0;
  return Math.hypot(px - ax - k * dx, pz - az - k * dz);
}

export function stepShells(g) {
  g.shells = g.shells.filter((s) => {
    const ox = s.x, oz = s.z;
    s.x += s.vx * DT;
    s.z += s.vz * DT;
    let hit = false;
    if (s.x < -HALF_X + SR) { s.x = -HALF_X + SR; s.vx = -s.vx; hit = true; }
    if (s.x > HALF_X - SR) { s.x = HALF_X - SR; s.vx = -s.vx; hit = true; }
    if (s.z < -HALF_Z + SR) { s.z = -HALF_Z + SR; s.vz = -s.vz; hit = true; }
    if (s.z > HALF_Z - SR) { s.z = HALF_Z - SR; s.vz = -s.vz; hit = true; }
    for (const w of WALLS) {
      const c = circleBox(s.x, s.z, SR, w);
      if (!c) continue;
      s.x += c.nx * c.pen;
      s.z += c.nz * c.pen;
      // Reflect across the contact normal (a face flips one component, a corner both in proportion).
      const vn = s.vx * c.nx + s.vz * c.nz;
      if (vn < 0) { s.vx -= 2 * vn * c.nx; s.vz -= 2 * vn * c.nz; }
      hit = true;
    }
    if (hit && ++s.bounces >= 2) return false;
    for (const n of NAMES) {
      const t = g.tanks[n];
      if (segDist(t.x, t.z, ox, oz, s.x, s.z) <= R + SR + 1e-9) {
        t.health = Math.max(0, t.health - 25);
        g.events.push({ x: s.x, z: s.z });
        return false;
      }
    }
    return true;
  });
}
