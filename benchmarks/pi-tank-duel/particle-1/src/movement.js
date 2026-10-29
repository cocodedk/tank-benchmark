import { ARENA, WALLS, TANK_RADIUS, TANK_SPEED, REVERSE_SPEED, TURN_RATE } from './constants.js';
import { circleRect, norm } from './geometry.js';

export function resolveTank(game, tank, name) {
  const other = name === 'player' ? game.tanks.computer : game.tanks.player;
  for (let pass = 0; pass < 2; pass += 1) {
    const hw = ARENA.width / 2 - TANK_RADIUS;
    const hd = ARENA.depth / 2 - TANK_RADIUS;
    tank.x = Math.max(-hw, Math.min(hw, tank.x));
    tank.z = Math.max(-hd, Math.min(hd, tank.z));
    for (const wall of WALLS) {
      const hit = circleRect(tank.x, tank.z, TANK_RADIUS, wall);
      if (hit) {
        tank.x += hit.nx * (hit.depth + 1e-9);
        tank.z += hit.nz * (hit.depth + 1e-9);
      }
    }
    if (!other || other.health <= 0) continue;
    let dx = tank.x - other.x;
    let dz = tank.z - other.z;
    let d = Math.hypot(dx, dz);
    const min = TANK_RADIUS * 2;
    if (d < min) {
      if (d < 1e-9) {
        dx = Math.cos((tank.heading * Math.PI) / 180);
        dz = Math.sin((tank.heading * Math.PI) / 180);
        d = 1;
      }
      tank.x += (dx / d) * (min - d);
      tank.z += (dz / d) * (min - d);
    }
  }
}

export function moveTank(game, name, input, dt) {
  const tank = game.tanks[name];
  if (!tank || tank.health <= 0) return;
  const turn = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  tank.heading = norm(tank.heading + turn * TURN_RATE * dt);
  const forward = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
  if (forward !== 0) {
    const speed = forward > 0 ? TANK_SPEED : REVERSE_SPEED;
    const rad = (tank.heading * Math.PI) / 180;
    tank.x += Math.cos(rad) * speed * forward * dt;
    tank.z += Math.sin(rad) * speed * forward * dt;
  }
  resolveTank(game, tank, name);
}
