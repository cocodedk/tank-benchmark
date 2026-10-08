import {COOLDOWN_STEPS, DAMAGE, DT, HALF, MAX_SHELLS, MUZZLE, NAMES, SHELL_R, SPEED, TANK_R, WALLS} from './config.js';
import {endRound} from './game.js';
import {clamp, pushOut, segDist, segRectDist, side} from './geom.js';

/** Fires a shell from a tank if it may; returns whether it did. */
export function fire(g, name) {
  const t = g.tanks[name];
  if (g.state !== 'playing' || g.tick - t.lastShot < COOLDOWN_STEPS) return false;
  if (g.shells.filter(s => s.owner === name).length >= MAX_SHELLS) return false;
  const c = Math.cos(t.heading * Math.PI / 180);
  const s = Math.sin(t.heading * Math.PI / 180);
  t.lastShot = g.tick;
  t.shots++;
  g.shells.push({x: t.x + c * MUZZLE, z: t.z + s * MUZZLE, vx: c * SPEED.shell, vz: s * SPEED.shell, owner: name, bounces: 0});
  return true;
}

/** Reflects a shell that touches a wall; returns whether it touched one. */
function bounce(s, x0, z0) {
  let hit = false;
  for (const axis of ['x', 'z']) {
    const limit = HALF[axis] - SHELL_R;
    if (Math.abs(s[axis]) > limit) {
      s[axis] = side(s[axis]) * (2 * limit - Math.abs(s[axis]));
      s['v' + axis] = -s['v' + axis];
      hit = true;
    }
  }
  for (const w of WALLS) {
    // The whole step's path counts, not only where it ends.
    if (segRectDist(x0, z0, s.x, s.z, w) >= SHELL_R - 1e-9) continue;
    const [x, z] = pushOut(s.x, s.z, SHELL_R, w);
    // Which face was hit: where the shell was pushed to, or, if it only grazed, where it came from.
    const moved = x !== s.x || z !== s.z;
    const dx = moved ? x - s.x : x0 - clamp(x0, w.x - w.width / 2, w.x + w.width / 2);
    const dz = moved ? z - s.z : z0 - clamp(z0, w.z - w.depth / 2, w.z + w.depth / 2);
    if (Math.abs(dx) > Math.abs(dz)) s.vx = -s.vx;
    else s.vz = -s.vz;
    s.x = x;
    s.z = z;
    hit = true;
  }
  return hit;
}

function hitTank(g, name, s) {
  const t = g.tanks[name];
  t.health = Math.max(0, t.health - DAMAGE);
  g.explosions.push({x: s.x, z: s.z, age: 0});
  if (t.health === 0) endRound(g, name);
}

export function moveShells(g) {
  g.shells = g.shells.filter(s => {
    if (g.state !== 'playing') return true;
    const [x0, z0] = [s.x, s.z];
    s.x += s.vx * DT;
    s.z += s.vz * DT;
    if (bounce(s, x0, z0)) {
      if (s.bounces === 1) return false;
      s.bounces = 1;
    }
    const name = NAMES.find(n => segDist(x0, z0, s.x, s.z, g.tanks[n].x, g.tanks[n].z) <= TANK_R + SHELL_R + 1e-9);
    if (name) hitTank(g, name, s);
    return !name;
  });
}
