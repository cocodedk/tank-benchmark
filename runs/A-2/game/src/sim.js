import { DT, FORWARD, REVERSE, TURN, TANK_RADIUS, SHELL_RADIUS, DAMAGE, FX_STEPS, OTHER } from './config.js';
import { rad, norm, wallContact, pushOut, segmentDistance } from './geom.js';
import { startRound, endRound, tryFire } from './game.js';
import { think } from './ai.js';

const IDLE = { drive: 0, turn: 0, fire: false };

function playerInput(g) {
  const held = (...keys) => keys.some((k) => g.keys.has(k));
  const fire = g.firePending;
  g.firePending = false;
  return {
    drive: Number(held('w', 'arrowup')) - Number(held('s', 'arrowdown')),
    turn: Number(held('d', 'arrowright')) - Number(held('a', 'arrowleft')),
    fire,
  };
}

function move(g, name, { drive, turn }) {
  const t = g.tanks[name];
  const o = g.tanks[OTHER[name]];
  t.heading = norm(t.heading + turn * TURN * DT);
  if (!drive) return;
  const from = { x: t.x, z: t.z };
  const v = drive * (drive > 0 ? FORWARD : REVERSE) * DT;
  t.x += Math.cos(rad(t.heading)) * v;
  t.z += Math.sin(rad(t.heading)) * v;
  const d = Math.hypot(t.x - o.x, t.z - o.z);
  if (d > 0 && d < 2 * TANK_RADIUS) {
    t.x = o.x + ((t.x - o.x) / d) * 2 * TANK_RADIUS;
    t.z = o.z + ((t.z - o.z) / d) * 2 * TANK_RADIUS;
  }
  pushOut(t, TANK_RADIUS);
  // Squeezed between a wall and the other tank: stop where it was; the other tank is never pushed.
  if (Math.hypot(t.x - o.x, t.z - o.z) < 2 * TANK_RADIUS - 1e-9) Object.assign(t, from);
}

function moveShells(g) {
  const kept = [];
  for (const s of g.shells) {
    const from = { x: s.x, z: s.z };
    s.x += s.vx * DT;
    s.z += s.vz * DT;
    const c = wallContact(s.x, s.z, SHELL_RADIUS, { x: s.vx, z: s.vz });
    const across = c ? s.vx * c.nx + s.vz * c.nz : 0;
    if (across < 0) {
      if (s.bounces++ > 0) continue;
      s.vx -= 2 * across * c.nx;
      s.vz -= 2 * across * c.nz;
      s.x += c.nx * c.depth;
      s.z += c.nz * c.depth;
    }
    // The whole path of this step counts, not just where the shell ends up.
    const name = Object.keys(g.tanks).find((n) => segmentDistance(from, s, g.tanks[n]) <= TANK_RADIUS + SHELL_RADIUS + 1e-9);
    if (!name) {
      kept.push(s);
      continue;
    }
    g.fx.push({ x: s.x, z: s.z, age: 0 });
    const t = g.tanks[name];
    t.health = Math.max(0, t.health - DAMAGE);
    if (t.health === 0) return endRound(g, name);
  }
  g.shells = kept;
}

/** One fixed step of 1/60 s. */
export function step(g) {
  g.tick++;
  g.fx = g.fx.filter((e) => ++e.age < FX_STEPS);
  if (g.state === 'round_over') {
    g.firePending = false;
    if (--g.timer <= 0) startRound(g);
    return;
  }
  for (const t of Object.values(g.tanks)) if (t.cool > 0) t.cool--;
  const inputs = { player: playerInput(g), computer: g.ai ? think(g) : IDLE };
  for (const name of Object.keys(inputs)) {
    move(g, name, inputs[name]);
    if (inputs[name].fire) tryFire(g, name);
  }
  moveShells(g);
}
