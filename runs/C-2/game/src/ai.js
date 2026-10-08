import { TANK_X, TANK_Z, WALLS, clear, circleBox } from "./arena.js";
import { canFire } from "./game.js";

const DEG = 180 / Math.PI;
const diffTo = (t, x, z) => ((((Math.atan2(z - t.z, x - t.x) * DEG - t.heading) % 360) + 540) % 360) - 180;
// Path clearance: just under the tank radius, so a tank resting against a wall can still drive off it.
const DRIVE = 1.15;
const sign =(d) => (Math.abs(d) > 1 ? Math.sign(d) : 0);
const GRID = [];
for (let x = -18; x <= 18; x += 2) {
  for (let z = -14; z <= 14; z += 2) {
    if (Math.abs(x) <= TANK_X - 0.4 && Math.abs(z) <= TANK_Z - 0.4 && !WALLS.some((w) => circleBox(x, z, 1.6, w))) GRID.push([x, z]);
  }
}

function pickTarget(c, p) {
  const ok = GRID.filter(([x, z]) => clear(c.x, c.z, x, z, DRIVE));
  // A wide margin, so stopping near the waypoint (not on it) still gives a clear line.
  const seen = ok.filter(([x, z]) => clear(x, z, p.x, p.z, 1));
  const pool = seen.length ? seen : ok;
  if (!pool.length) return null;
  const ref = seen.length ? c : p;
  const dist = (q) => Math.hypot(q[0] - ref.x, q[1] - ref.z);
  return pool.reduce((a, b) => (dist(b) < dist(a) ? b : a));
}

export function aiInput(g) {
  const c = g.tanks.computer, p = g.tanks.player, s = g.ais;
  if (s.aim === undefined) { s.aim = 0; s.wait = 0; s.target = null; }
  if (clear(c.x, c.z, p.x, p.z, 0.25)) {
    const d = diffTo(c, p.x, p.z) + s.aim;
    const fire = canFire(g, "computer") && Math.abs(d) < 3;
    if (fire) s.aim = (Math.random() * 2 - 1) * 3;
    const dist = Math.hypot(p.x - c.x, p.z - c.z);
    return { turn: sign(d), fwd: dist > 14 && Math.abs(d) < 30 && clear(c.x, c.z, p.x, p.z, DRIVE), fire };
  }
  if (--s.wait <= 0) { s.wait = 30; s.target = pickTarget(c, p); }
  if (!s.target) return {};
  const [tx, tz] = s.target;
  const d = diffTo(c, tx, tz);
  return { turn: sign(d), fwd: Math.abs(d) <= 30 && Math.hypot(tx - c.x, tz - c.z) > 0.3 };
}
