import { ARENA, DEG, SHELL, STEP, TANK, WALLS } from './constants.js';
import { distance } from './physics.js';

export function makeShell(tank, owner) {
  const radians = tank.heading * DEG;
  const dx = Math.cos(radians);
  const dz = Math.sin(radians);
  return {
    x: tank.x + dx * SHELL.spawn,
    z: tank.z + dz * SHELL.spawn,
    vx: dx * SHELL.speed,
    vz: dz * SHELL.speed,
    owner,
    bounces: 0,
  };
}

export function shellHitsTank(shell, tank) {
  return distance(shell.x, shell.z, tank.x, tank.z) <= TANK.radius + SHELL.radius;
}

/** Move one shell a step; false means it made its second wall contact and is gone. */
export function advanceShell(shell) {
  const r = SHELL.radius;
  shell.x += shell.vx * STEP;
  shell.z += shell.vz * STEP;
  let contact = false;

  const maxX = ARENA.halfWidth - r;
  const maxZ = ARENA.halfDepth - r;
  if (shell.x < -maxX) {
    shell.x = -maxX;
    shell.vx = Math.abs(shell.vx);
    contact = true;
  } else if (shell.x > maxX) {
    shell.x = maxX;
    shell.vx = -Math.abs(shell.vx);
    contact = true;
  }
  if (shell.z < -maxZ) {
    shell.z = -maxZ;
    shell.vz = Math.abs(shell.vz);
    contact = true;
  } else if (shell.z > maxZ) {
    shell.z = maxZ;
    shell.vz = -Math.abs(shell.vz);
    contact = true;
  }

  for (const wall of WALLS) {
    const minX = wall.x - wall.width / 2 - r;
    const maxX2 = wall.x + wall.width / 2 + r;
    const minZ = wall.z - wall.depth / 2 - r;
    const maxZ2 = wall.z + wall.depth / 2 + r;
    if (shell.x <= minX || shell.x >= maxX2 || shell.z <= minZ || shell.z >= maxZ2) continue;

    const left = shell.x - minX;
    const right = maxX2 - shell.x;
    const near = shell.z - minZ;
    const far = maxZ2 - shell.z;
    const least = Math.min(left, right, near, far);
    if (least === left) {
      shell.x = minX;
      shell.vx = -Math.abs(shell.vx);
    } else if (least === right) {
      shell.x = maxX2;
      shell.vx = Math.abs(shell.vx);
    } else if (least === near) {
      shell.z = minZ;
      shell.vz = -Math.abs(shell.vz);
    } else {
      shell.z = maxZ2;
      shell.vz = Math.abs(shell.vz);
    }
    contact = true;
  }

  if (contact) {
    shell.bounces += 1;
    if (shell.bounces >= 2) return false;
  }
  return true;
}
