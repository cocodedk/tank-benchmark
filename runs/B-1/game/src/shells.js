// Shells: firing, flight, wall bounces, tank hits.
import { WALLS, HALF_X, HALF_Z, R_SHELL, pushOut } from './collide.js';

const SPEED = 15, COOLDOWN = 0.5, MAX_SHELLS = 3, HIT = 1.45;
const rad = (h) => (h * Math.PI) / 180;

// Distance from (px, pz) to the segment (x0, z0)-(x1, z1): a step must not tunnel through a tank.
function distToSegment(px, pz, x0, z0, x1, z1) {
  const dx = x1 - x0, dz = z1 - z0, len2 = dx * dx + dz * dz;
  const u = len2 ? Math.max(0, Math.min(1, ((px - x0) * dx + (pz - z0) * dz) / len2)) : 0;
  return Math.hypot(px - (x0 + u * dx), pz - (z0 + u * dz));
}

export function fire(s, name) {
  const t = s.tanks[name];
  const own = s.shells.filter((b) => b.owner === name).length;
  if (s.state !== 'playing' || own >= MAX_SHELLS || s.time - t.last < COOLDOWN - 1e-6) return false;
  const c = Math.cos(rad(t.heading)), n = Math.sin(rad(t.heading));
  s.shells.push({ x: t.x + 1.6 * c, z: t.z + 1.6 * n, vx: SPEED * c, vz: SPEED * n, owner: name, bounces: 0 });
  t.last = s.time;
  s.shots[name]++;
  return true;
}

// Reflect off the first wall touched; false if none.
function wallContact(b) {
  const r = R_SHELL;
  for (const w of WALLS) {
    const p = pushOut(b.x, b.z, r, w);
    if (p.x === b.x && p.z === b.z) continue;
    if (Math.abs(p.x - b.x) > Math.abs(p.z - b.z)) b.vx = -b.vx; else b.vz = -b.vz;
    b.x = p.x;
    b.z = p.z;
    return true;
  }
  let hit = false;
  if (Math.abs(b.x) > HALF_X - r) { b.x = Math.sign(b.x) * (HALF_X - r); b.vx = -b.vx; hit = true; }
  if (Math.abs(b.z) > HALF_Z - r) { b.z = Math.sign(b.z) * (HALF_Z - r); b.vz = -b.vz; hit = true; }
  return hit;
}

export function updateShells(s, dt) {
  s.shells = s.shells.filter((b) => {
    const x0 = b.x, z0 = b.z;
    b.x += b.vx * dt;
    b.z += b.vz * dt;
    for (const t of Object.values(s.tanks)) {
      if (distToSegment(t.x, t.z, x0, z0, b.x, b.z) < HIT) {
        t.health = Math.max(0, t.health - 25);
        s.explosions.push({ x: b.x, z: b.z, t: 0.4 });
        return false;
      }
    }
    if (!wallContact(b)) return true;
    return b.bounces++ === 0;
  });
}
