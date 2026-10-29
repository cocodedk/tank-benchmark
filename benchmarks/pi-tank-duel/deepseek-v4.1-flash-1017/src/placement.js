import { ARENA, TANK, WALLS } from './constants.js';
import { circleOverlapsWall, distance } from './physics.js';

/** Why `name` cannot be placed at (x, z), or null when the spot is legal. */
export function placementError(game, name, x, z) {
  if (!['player', 'computer'].includes(name)) return 'tank must be "player" or "computer"';
  for (const value of [x, z]) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'x, z and heading must be numbers';
  }
  if (Math.abs(x) > ARENA.halfWidth - TANK.radius || Math.abs(z) > ARENA.halfDepth - TANK.radius) {
    return 'that spot is outside the arena';
  }
  for (const wall of WALLS) {
    if (circleOverlapsWall(x, z, TANK.radius, wall)) return 'that spot is inside a wall';
  }
  const rival = game.tanks[name === 'player' ? 'computer' : 'player'];
  if (distance(x, z, rival.x, rival.z) < TANK.radius * 2) {
    return 'that spot overlaps the other tank';
  }
  return null;
}
