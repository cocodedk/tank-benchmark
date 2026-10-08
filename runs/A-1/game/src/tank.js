// A tank's driving and firing. Controls are { drive, turn, fire }, each -1..1 (fire is a boolean).
import { TANK_R, pushOutOfWalls } from './arena.js';

export const DT = 1 / 60;
export const NAMES = ['player', 'computer'];
export const START = { player: { x: -15, z: 0, heading: 0 }, computer: { x: 15, z: 0, heading: 180 } };
const FORWARD = 6, REVERSE = 4, TURN = 120;
const RELOAD = 30, MAX_SHELLS = 3, MUZZLE = 1.6, SHELL_SPEED = 15;

export const rad = deg => deg * Math.PI / 180;
export function norm(h) {
  const r = ((h % 360) + 360) % 360;
  return r >= 360 ? 0 : r;
}

export function drive(tank, other, c) {
  tank.heading = norm(tank.heading + c.turn * TURN * DT);
  const speed = c.drive > 0 ? FORWARD : REVERSE;
  const { x, z } = tank;
  tank.x += Math.cos(rad(tank.heading)) * c.drive * speed * DT;
  tank.z += Math.sin(rad(tank.heading)) * c.drive * speed * DT;
  for (let i = 0; i < 4; i++) {
    pushOutOfWalls(tank);
    const dx = tank.x - other.x, dz = tank.z - other.z, d = Math.hypot(dx, dz);
    if (d >= 2 * TANK_R) return;
    if (d > 0) { tank.x = other.x + dx / d * 2 * TANK_R; tank.z = other.z + dz / d * 2 * TANK_R; }
  }
  // Wedged between a wall and the other tank: stay where the tank was.
  tank.x = x;
  tank.z = z;
}

// Fires if the tank has reloaded and has fewer than 3 shells out; says whether it did.
export function fire(game, name) {
  const t = game.tanks[name];
  const out = game.shells.filter(s => s.owner === name).length;
  if (game.state !== 'playing' || game.tick - t.lastShot < RELOAD || out >= MAX_SHELLS) return false;
  const cos = Math.cos(rad(t.heading)), sin = Math.sin(rad(t.heading));
  t.lastShot = game.tick;
  t.shots++;
  game.shells.push({ x: t.x + cos * MUZZLE, z: t.z + sin * MUZZLE, vx: cos * SHELL_SPEED, vz: sin * SHELL_SPEED, owner: name, bounces: 0 });
  return true;
}
