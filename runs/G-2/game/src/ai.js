// The computer's driver: aim and fire when it sees you, else drive the shortest way to a spot that does.
import { HALF_W, HALF_D, TANK_R, SHELL_R, wallHit, clearLine } from './arena.js';

// Open spots on a 1-unit grid, each linked to the neighbours it can drive straight to.
const SPOTS = [];
for (let x = -HALF_W + 2; x <= HALF_W - 2; x += 1) {
  for (let z = -HALF_D + 2; z <= HALF_D - 2; z += 1) if (!wallHit(x, z, TANK_R + 0.5)) SPOTS.push({ x, z });
}
for (const a of SPOTS) {
  a.next = SPOTS.filter(b => b !== a && Math.abs(a.x - b.x) <= 1 && Math.abs(a.z - b.z) <= 1 &&
                             clearLine(a.x, a.z, b.x, b.z, TANK_R + 0.1));
}

// Signed degrees to turn from heading h to face (dx, dz), in (-180, 180].
function bearing(h, dx, dz) {
  const d = ((Math.atan2(dz, dx) * 180 / Math.PI - h) % 360 + 540) % 360 - 180;
  return d === -180 ? 180 : d;
}

const steer = err => Math.max(-1, Math.min(1, err / 2)); // a full turn step is 2 degrees
const reach = (me, s) => clearLine(me.x, me.z, s.x, s.z, TANK_R - 0.05);

// The path from the nearest reachable spot to the closest spot with a clear shot at you.
function route(me, you) {
  let start = null;
  for (const s of SPOTS) {
    if ((!start || Math.hypot(s.x - me.x, s.z - me.z) < Math.hypot(start.x - me.x, start.z - me.z)) && reach(me, s)) start = s;
  }
  if (!start) return null;
  const from = new Map([[start, null]]), queue = [start];
  for (const a of queue) {
    if (Math.hypot(a.x - you.x, a.z - you.z) > 4 && clearLine(a.x, a.z, you.x, you.z, SHELL_R + 0.3)) {
      const path = [];
      for (let s = a; s; s = from.get(s)) path.unshift(s);
      return path;
    }
    for (const b of a.next) if (!from.has(b)) { from.set(b, a); queue.push(b); }
  }
  return null;
}

export function aiInput(game) {
  const me = game.tanks.computer, you = game.tanks.player;
  if (clearLine(me.x, me.z, you.x, you.z, SHELL_R)) {
    const err = bearing(me.heading, you.x - me.x, you.z - me.z);
    // It waits a second between its own shots, so a moving player can dodge and answer.
    return { turn: steer(err), fire: Math.abs(err) < 3 && game.frame - me.last >= 60 };
  }
  const path = route(me, you);
  if (!path) return { turn: steer(bearing(me.heading, you.x - me.x, you.z - me.z)) };
  const goal = path.findLast(s => reach(me, s));
  const err = bearing(me.heading, goal.x - me.x, goal.z - me.z);
  return { turn: steer(err), fwd: Math.abs(err) < 10 ? 1 : 0 };
}
