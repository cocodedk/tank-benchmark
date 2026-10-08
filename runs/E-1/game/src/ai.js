// The computer's driver: aim and fire when it can see you, otherwise drive a grid path to a spot that can.
import { blocked, clearLine } from "./arena.js";

const AIM = 4, LINE = 0.3;
const nodes = [];
for (let x = -18; x <= 18; x++) for (let z = -13; z <= 13; z++) if (!blocked(x, z, 1.6)) nodes.push({ x, z });
const at = new Map(nodes.map((n) => [`${n.x},${n.z}`, n]));
for (const n of nodes) {
  n.next = [];
  for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
    const m = at.get(`${n.x + dx},${n.z + dz}`);
    if (m && m !== n && clearLine(n.x, n.z, m.x, m.z, 1.4)) n.next.push(m);
  }
}

const deg = (r) => r * 180 / Math.PI;
const diff = (a, b) => ((a - b) % 360 + 540) % 360 - 180;

// The first step on the shortest grid path from me to a node with a clear line to foe.
function waypoint(me, foe) {
  const start = nodes.reduce((a, n) => (Math.hypot(n.x - me.x, n.z - me.z) < Math.hypot(a.x - me.x, a.z - me.z) ? n : a));
  const from = new Map([[start, null]]);
  for (const queue = [start]; queue.length;) {
    let n = queue.shift();
    if (clearLine(n.x, n.z, foe.x, foe.z, LINE)) {
      while (from.get(n) && from.get(n) !== start) n = from.get(n);
      return n;
    }
    for (const m of n.next) if (!from.has(m)) { from.set(m, n); queue.push(m); }
  }
  return foe;
}

// Controls for this tick: {move, turn, fire}; turn +1 raises the heading.
export function think(me, foe) {
  if (me.seen !== me.shots) {
    me.seen = me.shots;
    me.aim = (Math.random() * 2 - 1) * AIM;
  }
  const sees = clearLine(me.x, me.z, foe.x, foe.z, LINE);
  const goal = sees ? foe : waypoint(me, foe);
  const err = diff(deg(Math.atan2(goal.z - me.z, goal.x - me.x)) + (sees ? me.aim : 0), me.heading);
  const turn = Math.abs(err) > 1 ? Math.sign(err) : 0;
  if (sees) return { move: 0, turn, fire: Math.abs(err) < 3 };
  return { move: Math.abs(err) < 45 ? 1 : 0, turn, fire: false };
}
