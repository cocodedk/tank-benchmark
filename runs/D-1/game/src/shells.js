import { contacts } from './collide.js';
import { DT, SHELL_DAMAGE, SHELL_RADIUS, TANK_RADIUS } from './config.js';

/** Distance from point (cx, cz) to the segment (ax, az)-(bx, bz). */
function segmentDistance(ax, az, bx, bz, cx, cz) {
  const dx = bx - ax, dz = bz - az, len2 = dx * dx + dz * dz;
  const u = len2 ? Math.max(0, Math.min(1, ((cx - ax) * dx + (cz - az) * dz) / len2)) : 0;
  return Math.hypot(ax + u * dx - cx, az + u * dz - cz);
}

/** Move every shell one step: tanks first (damage, explosion), then walls (bounce once, gone at the second). */
export function updateShells(g) {
  const alive = [];
  for (const s of g.shells) {
    const px = s.x, pz = s.z;
    s.x += s.vx * DT;
    s.z += s.vz * DT;
    const hit = Object.values(g.tanks).find((t) => segmentDistance(px, pz, s.x, s.z, t.x, t.z) <= TANK_RADIUS + SHELL_RADIUS + 1e-9);
    if (hit) {
      hit.health = Math.max(0, hit.health - SHELL_DAMAGE);
      g.explosions.push({ x: s.x, z: s.z, age: 0 });
      if (hit.health === 0) break;
      continue;
    }
    // Touching from the step's start or end, and not moving away, counts (sliding along a face too).
    const wall = [...contacts(px, pz, SHELL_RADIUS), ...contacts(s.x, s.z, SHELL_RADIUS)]
      .find((c) => s.vx * c.nx + s.vz * c.nz <= 0);
    if (wall) {
      if (s.bounces >= 1) continue;
      const dot = s.vx * wall.nx + s.vz * wall.nz;
      s.vx -= 2 * dot * wall.nx;
      s.vz -= 2 * dot * wall.nz;
      s.bounces++;
    }
    alive.push(s);
  }
  g.shells = alive;
}
