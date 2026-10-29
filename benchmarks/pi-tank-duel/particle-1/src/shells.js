import { ARENA, WALLS, TANK_RADIUS, SHELL_RADIUS, SHELL_DAMAGE } from './constants.js';
import { circleRect } from './geometry.js';

export function wallContact(shell) {
  let best = null;
  for (const wall of WALLS) {
    const hit = circleRect(shell.x, shell.z, SHELL_RADIUS, wall);
    if (hit && (!best || hit.depth > best.depth)) best = hit;
  }
  const hw = ARENA.width / 2 - SHELL_RADIUS;
  const hd = ARENA.depth / 2 - SHELL_RADIUS;
  const outer = [
    { nx: -1, nz: 0, depth: shell.x - hw, active: shell.x > hw },
    { nx: 1, nz: 0, depth: -hw - shell.x, active: shell.x < -hw },
    { nx: 0, nz: -1, depth: shell.z - hd, active: shell.z > hd },
    { nx: 0, nz: 1, depth: -hd - shell.z, active: shell.z < -hd },
  ];
  for (const hit of outer) {
    if (hit.active && (!best || hit.depth > best.depth)) best = hit;
  }
  return best;
}

export function updateShells(game, dt) {
  for (let i = game.shells.length - 1; i >= 0; i -= 1) {
    const shell = game.shells[i];
    shell.x += shell.vx * dt;
    shell.z += shell.vz * dt;
    let gone = false;
    const hit = wallContact(shell);
    if (hit) {
      if (shell.bounces === 0) {
        const dot = shell.vx * hit.nx + shell.vz * hit.nz;
        shell.vx -= 2 * dot * hit.nx;
        shell.vz -= 2 * dot * hit.nz;
        shell.x += hit.nx * (hit.depth + 1e-6);
        shell.z += hit.nz * (hit.depth + 1e-6);
        shell.bounces = 1;
      } else {
        gone = true;
      }
    }
    if (!gone) {
      for (const name of ['player', 'computer']) {
        const tank = game.tanks[name];
        if (tank.health <= 0) continue;
        const d = Math.hypot(shell.x - tank.x, shell.z - tank.z);
        if (d < TANK_RADIUS + SHELL_RADIUS) {
          tank.health = Math.max(0, tank.health - SHELL_DAMAGE);
          game.effects.push({ x: shell.x, z: shell.z, life: 0.3 });
          gone = true;
          break;
        }
      }
    }
    if (gone) game.shells.splice(i, 1);
  }
}
