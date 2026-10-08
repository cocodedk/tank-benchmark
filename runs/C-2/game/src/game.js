import { DT, R, TANK_X, TANK_Z, SPEED_F, SPEED_B, TURN, SHELL_SPEED, WALLS, START, circleBox } from "./arena.js";
import { stepShells } from "./shells.js";
import { aiInput } from "./ai.js";

const NAMES = ["player", "computer"];
const NONE = {};
const other = (n) => (n === "player" ? "computer" : "player");
const r4 = (v) => Math.round(v * 10000) / 10000;

export function newGame() {
  const g = { paused: false, ai: true, events: [] };
  reset(g);
  return g;
}

export function reset(g) {
  g.tanks = { player: { shots: 0, prev: false }, computer: { shots: 0, prev: false } };
  g.score = { player: 0, computer: 0 };
  g.round = 1;
  g.steps = 0;
  g.ais = {};
  startRound(g);
}

function startRound(g) {
  for (const n of NAMES) Object.assign(g.tanks[n], START[n], { health: 100, last: -Infinity });
  g.shells = [];
  g.state = "playing";
  g.banner = "";
  g.over = 0;
}

export function canFire(g, n) {
  return g.state === "playing" && g.steps * DT - g.tanks[n].last >= 0.5 - 1e-9 && g.shells.filter((s) => s.owner === n).length < 3;
}

export function tryFire(g, n) {
  if (!canFire(g, n)) return false;
  const t = g.tanks[n], a = (t.heading * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  g.shells.push({ x: t.x + c * 1.6, z: t.z + s * 1.6, vx: c * SHELL_SPEED, vz: s * SHELL_SPEED, owner: n, bounces: 0 });
  t.last = g.steps * DT;
  t.shots++;
  return true;
}

// Push tank t out of the arena edge, the other tank, and the inner walls.
function resolve(t, o) {
  const dx = t.x - o.x, dz = t.z - o.z, d = Math.hypot(dx, dz);
  if (d < 2 * R) {
    if (d > 0) { t.x = o.x + (dx / d) * 2 * R; t.z = o.z + (dz / d) * 2 * R; } else t.x = o.x + 2 * R;
  }
  for (const w of WALLS) {
    const c = circleBox(t.x, t.z, R, w);
    if (c) { t.x += c.nx * c.pen; t.z += c.nz * c.pen; }
  }
  t.x = Math.max(-TANK_X, Math.min(TANK_X, t.x));
  t.z = Math.max(-TANK_Z, Math.min(TANK_Z, t.z));
}

function move(g, n, i) {
  const t = g.tanks[n];
  t.heading = (((t.heading + (i.turn || 0) * TURN * DT) % 360) + 360) % 360;
  const v = (i.fwd ? SPEED_F : 0) - (i.back ? SPEED_B : 0);
  const a = (t.heading * Math.PI) / 180;
  const ox = t.x, oz = t.z, o = g.tanks[other(n)];
  t.x += Math.cos(a) * v * DT;
  t.z += Math.sin(a) * v * DT;
  resolve(t, o);
  // Pinned between the edge and the other tank: stay put.
  if (Math.hypot(t.x - o.x, t.z - o.z) < 2 * R - 1e-6) { t.x = ox; t.z = oz; }
}

// One fixed step. pin = player input {fwd, back, turn (-1 left, +1 right), fire}.
export function step(g, pin) {
  g.steps++;
  if (g.state === "round_over") {
    if (++g.over >= 120) { g.round++; startRound(g); }
    return;
  }
  const inputs = { player: pin, computer: g.ai ? aiInput(g) : NONE };
  for (const n of NAMES) {
    const t = g.tanks[n], i = inputs[n];
    if (i.fire && !t.prev) tryFire(g, n);
    t.prev = !!i.fire;
    move(g, n, i);
  }
  stepShells(g);
  const dead = NAMES.find((n) => g.tanks[n].health <= 0);
  if (dead) {
    g.state = "round_over";
    g.over = 0;
    g.score[other(dead)]++;
    g.banner = dead === "computer" ? "You win the round" : "The computer wins the round";
  }
}

// Returns an error string, or null after moving the tank.
export function place(g, n, x, z, heading) {
  const o = g.tanks[other(n)];
  if (Math.abs(x) > TANK_X || Math.abs(z) > TANK_Z) return "outside the arena";
  if (Math.hypot(x - o.x, z - o.z) < 2 * R - 1e-9) return "overlaps the other tank";
  if (WALLS.some((w) => { const c = circleBox(x, z, R, w); return c && c.pen > 1e-9; })) return "inside a wall";
  Object.assign(g.tanks[n], { x, z, heading: ((heading % 360) + 360) % 360 });
  return null;
}

export function describe(g) {
  const tank = (t) => {
    let h = r4(t.heading);
    if (h >= 360) h = 0;
    return { x: r4(t.x), z: r4(t.z), heading: h, health: t.health, shots: t.shots };
  };
  return {
    ok: true,
    arena: { width: 40, depth: 30 },
    walls: WALLS,
    tanks: { player: tank(g.tanks.player), computer: tank(g.tanks.computer) },
    shells: g.shells.map((s) => ({ x: r4(s.x), z: r4(s.z), owner: s.owner, bounces: s.bounces })),
    score: { ...g.score },
    round: g.round,
    state: g.state,
    paused: g.paused,
    ai: g.ai,
  };
}
