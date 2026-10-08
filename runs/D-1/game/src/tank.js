import { contacts } from './collide.js';
import {
  COOLDOWN_STEPS, DT, FORWARD_SPEED, MAX_SHELLS, MUZZLE, REVERSE_SPEED, SHELL_SPEED, STARTS, START_HEALTH,
  TANK_RADIUS, TURN_SPEED,
} from './config.js';

const rad = (deg) => (deg * Math.PI) / 180;
export const wrap = (deg) => (((deg % 360) + 360) % 360);
export const other = (name) => (name === 'player' ? 'computer' : 'player');

export function newTank(name, shots = 0) {
  return { ...STARTS[name], health: START_HEALTH, shots, cooldown: 0 };
}

/** Push the tank out of the other tank and then out of the walls, so it slides along what it hits. */
function resolve(g, name, from) {
  const t = g.tanks[name], o = g.tanks[other(name)];
  for (let i = 0; i < 4; i++) {
    const dx = t.x - o.x, dz = t.z - o.z, d = Math.hypot(dx, dz);
    if (d > 0 && d < 2 * TANK_RADIUS) {
      t.x = o.x + (dx / d) * 2 * TANK_RADIUS;
      t.z = o.z + (dz / d) * 2 * TANK_RADIUS;
    }
    for (const c of contacts(t.x, t.z, TANK_RADIUS)) {
      t.x += c.nx * c.depth;
      t.z += c.nz * c.depth;
    }
  }
  // Pinned between the other tank and a wall: no legal slide, so stay where the step began.
  if (!spotFree(g, name, t.x, t.z)) Object.assign(t, from);
}

/** drive: 1 forward, -1 back. turn: 1 right, -1 left, as the driver sees it. One 1/60 s step. */
export function moveTank(g, name, drive, turn) {
  const t = g.tanks[name], from = { x: t.x, z: t.z };
  t.heading = wrap(t.heading + turn * TURN_SPEED * DT);
  const speed = drive > 0 ? FORWARD_SPEED : REVERSE_SPEED;
  t.x += Math.cos(rad(t.heading)) * drive * speed * DT;
  t.z += Math.sin(rad(t.heading)) * drive * speed * DT;
  resolve(g, name, from);
}

/** Whether a tank of this kind may stand at (x, z) without touching a wall, the edge or the other tank. */
export function spotFree(g, name, x, z) {
  const o = g.tanks[other(name)], r = TANK_RADIUS - 1e-6;
  return !contacts(x, z, r).length && Math.hypot(x - o.x, z - o.z) >= 2 * r;
}

export function fire(g, name) {
  const t = g.tanks[name];
  if (g.state !== 'playing' || t.cooldown > 0) return false;
  if (g.shells.filter((s) => s.owner === name).length >= MAX_SHELLS) return false;
  const c = Math.cos(rad(t.heading)), s = Math.sin(rad(t.heading));
  g.shells.push({ x: t.x + c * MUZZLE, z: t.z + s * MUZZLE, vx: c * SHELL_SPEED, vz: s * SHELL_SPEED, owner: name, bounces: 0 });
  t.cooldown = COOLDOWN_STEPS;
  t.shots++;
  return true;
}
