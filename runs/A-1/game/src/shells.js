// Shells in flight: straight lines, one bounce, damage on touching a tank.
import { HALF_X, HALF_Z, SHELL_R, TANK_R, WALLS, nearest } from './arena.js';
import { DT, NAMES } from './tank.js';

const DAMAGE = 25;

// A wall contact with outward normal (nx, nz): the velocity across the wall flips.
function bounce(s, nx, nz) {
  const dot = s.vx * nx + s.vz * nz;
  if (dot < 0) { s.vx -= 2 * dot * nx; s.vz -= 2 * dot * nz; }
  s.bounces++;
}

function touchWalls(s) {
  for (const [axis, half] of [['x', HALF_X], ['z', HALF_Z]]) {
    if (Math.abs(s[axis]) > half - SHELL_R) {
      const sign = Math.sign(s[axis]);
      s[axis] = sign * (half - SHELL_R);
      bounce(s, axis === 'x' ? -sign : 0, axis === 'z' ? -sign : 0);
    }
  }
  for (const w of WALLS) {
    const [cx, cz] = nearest(w, s.x, s.z);
    const d = Math.hypot(s.x - cx, s.z - cz);
    if (d >= SHELL_R) continue;
    let nx = (s.x - cx) / d, nz = (s.z - cz) / d, px = cx, pz = cz;
    if (d === 0) { // centre inside the wall: leave through the nearer face
      if (Math.abs(s.x - w.x) / w.width >= Math.abs(s.z - w.z) / w.depth) { nx = Math.sign(s.x - w.x) || 1; nz = 0; px = w.x + nx * w.width / 2; pz = s.z; }
      else { nx = 0; nz = Math.sign(s.z - w.z) || 1; pz = w.z + nz * w.depth / 2; px = s.x; }
    }
    s.x = px + nx * (SHELL_R + 1e-6);
    s.z = pz + nz * (SHELL_R + 1e-6);
    bounce(s, nx, nz);
  }
}

// Distance from tank t to the path the shell s took this step (from ox, oz to where it is now).
function pathDistance(s, ox, oz, t) {
  const dx = s.x - ox, dz = s.z - oz, len2 = dx * dx + dz * dz;
  const k = len2 ? Math.max(0, Math.min(1, ((t.x - ox) * dx + (t.z - oz) * dz) / len2)) : 0;
  return Math.hypot(ox + k * dx - t.x, oz + k * dz - t.z);
}

export function moveShells(game) {
  game.shells = game.shells.filter(s => {
    const ox = s.x, oz = s.z;
    s.x += s.vx * DT;
    s.z += s.vz * DT;
    touchWalls(s);
    if (s.bounces > 1) return false;
    for (const name of NAMES) {
      const t = game.tanks[name];
      if (pathDistance(s, ox, oz, t) <= TANK_R + SHELL_R + 1e-9) { // touching counts
        t.health = Math.max(0, t.health - DAMAGE);
        game.explosions.push({ x: s.x, z: s.z, age: 0 });
        return false;
      }
    }
    return true;
  });
}
