import { ARENA, SHELL, WALLS } from './constants.js';

export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

export function normalizeHeading(degrees) {
  const value = degrees % 360;
  return value < 0 ? value + 360 : value;
}

export function distance(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}

export function angleDiff(target, current) {
  let diff = (target - current) % 360;
  if (diff > 180) diff -= 360;
  if (diff <= -180) diff += 360;
  return diff;
}

function wallBounds(wall, padding = 0) {
  return {
    minX: wall.x - wall.width / 2 - padding,
    maxX: wall.x + wall.width / 2 + padding,
    minZ: wall.z - wall.depth / 2 - padding,
    maxZ: wall.z + wall.depth / 2 + padding,
  };
}

export function circleOverlapsWall(x, z, radius, wall) {
  const b = wallBounds(wall);
  const dx = x - clamp(x, b.minX, b.maxX);
  const dz = z - clamp(z, b.minZ, b.maxZ);
  return dx * dx + dz * dz < radius * radius;
}

function pushOutOfWall(tank, radius, wall) {
  const b = wallBounds(wall);
  const cx = clamp(tank.x, b.minX, b.maxX);
  const cz = clamp(tank.z, b.minZ, b.maxZ);
  const dx = tank.x - cx;
  const dz = tank.z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= radius * radius) return;

  if (d2 > 1e-12) {
    const d = Math.sqrt(d2);
    tank.x = cx + (dx / d) * radius;
    tank.z = cz + (dz / d) * radius;
    return;
  }

  // The centre somehow ended up inside the box: leave by the nearest face.
  const left = tank.x - b.minX;
  const right = b.maxX - tank.x;
  const near = tank.z - b.minZ;
  const far = b.maxZ - tank.z;
  const least = Math.min(left, right, near, far);
  if (least === left) tank.x = b.minX - radius;
  else if (least === right) tank.x = b.maxX + radius;
  else if (least === near) tank.z = b.minZ - radius;
  else tank.z = b.maxZ + radius;
}

export function resolveTank(tank, radius) {
  const maxX = ARENA.halfWidth - radius;
  const maxZ = ARENA.halfDepth - radius;
  for (let pass = 0; pass < 2; pass += 1) {
    tank.x = clamp(tank.x, -maxX, maxX);
    tank.z = clamp(tank.z, -maxZ, maxZ);
    for (const wall of WALLS) pushOutOfWall(tank, radius, wall);
  }
}

export function separateTanks(mover, other, radius) {
  const minDistance = radius * 2;
  for (let pass = 0; pass < 2; pass += 1) {
    const dx = mover.x - other.x;
    const dz = mover.z - other.z;
    const d = Math.hypot(dx, dz);
    if (d < minDistance) {
      if (d < 1e-6) {
        mover.x = other.x + minDistance;
        mover.z = other.z;
      } else {
        mover.x = other.x + (dx / d) * minDistance;
        mover.z = other.z + (dz / d) * minDistance;
      }
    }
    resolveTank(mover, radius);
  }
}

function segmentHitsBox(x1, z1, x2, z2, minX, minZ, maxX, maxZ) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  let tMin = 0;
  let tMax = 1;

  const axes = [
    [x1, dx, minX, maxX],
    [z1, dz, minZ, maxZ],
  ];
  for (const [p, d, low, high] of axes) {
    if (Math.abs(d) < 1e-9) {
      if (p < low || p > high) return false;
    } else {
      let near = (low - p) / d;
      let far = (high - p) / d;
      if (near > far) [near, far] = [far, near];
      tMin = Math.max(tMin, near);
      tMax = Math.min(tMax, far);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

export function lineOfSight(ax, az, bx, bz) {
  const padding = SHELL.radius;
  for (const wall of WALLS) {
    const b = wallBounds(wall, padding);
    if (segmentHitsBox(ax, az, bx, bz, b.minX, b.minZ, b.maxX, b.maxZ)) return false;
  }
  return true;
}

