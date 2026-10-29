import { ARENA, TANK_R, SHELL_R, WALLS, pushOut, blocked, clamp } from './arena.js';
import { aiInput } from './ai.js';

export const DT = 1 / 60;
const RAD = Math.PI / 180;
const START = { player: { x: -15, z: 0, heading: 0 }, computer: { x: 15, z: 0, heading: 180 } };
const norm = (h) => ((h % 360) + 360) % 360;
const other = (name) => (name === 'player' ? 'computer' : 'player');

export function createGame() {
  const g = { ai: true, paused: false, tick: 0, tanks: { player: { shots: 0 }, computer: { shots: 0 } } };
  resetGame(g);
  return g;
}

export function resetGame(g) {
  g.score = { player: 0, computer: 0 };
  g.round = 1;
  for (const t of Object.values(g.tanks)) t.shots = 0;
  startRound(g);
}

function startRound(g) {
  for (const k of Object.keys(g.tanks)) {
    Object.assign(g.tanks[k], START[k], { health: 100, lastShot: -1000, prevFire: false });
  }
  g.shells = [];
  g.explosions = [];
  g.state = 'playing';
  g.timer = 0;
  g.winner = null;
  g.aiWp = null;
  g.aiPlan = 0;
}

function resolve(t, o, prev) {
  const fix = () => {
    for (const w of WALLS) pushOut(t, TANK_R, w);
    t.x = clamp(t.x, -ARENA.width / 2 + TANK_R, ARENA.width / 2 - TANK_R);
    t.z = clamp(t.z, -ARENA.depth / 2 + TANK_R, ARENA.depth / 2 - TANK_R);
  };
  fix();
  const dx = t.x - o.x, dz = t.z - o.z, d = Math.hypot(dx, dz), m = 2 * TANK_R;
  if (d < m) {
    t.x = o.x + (d > 0 ? dx / d : 1) * m;
    t.z = o.z + (d > 0 ? dz / d : 0) * m;
    fix();
    // a wall kept it from clearing the other tank: stop where it was
    if (Math.hypot(t.x - o.x, t.z - o.z) < m - 1e-6) { t.x = prev.x; t.z = prev.z; }
  }
}

export function drive(g, name, inp) {
  const t = g.tanks[name];
  t.heading = norm(t.heading + ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * 120 * DT);
  const f = !!inp.forward, b = !!inp.back;
  const v = f === b ? 0 : f ? 6 : -4;
  const prev = { x: t.x, z: t.z };
  t.x += Math.cos(t.heading * RAD) * v * DT;
  t.z += Math.sin(t.heading * RAD) * v * DT;
  resolve(t, g.tanks[other(name)], prev);
}

export function fire(g, name) {
  const t = g.tanks[name];
  if (g.state !== 'playing' || g.tick - t.lastShot < 30) return false;
  if (g.shells.filter((s) => s.owner === name).length >= 3) return false;
  const c = Math.cos(t.heading * RAD), s = Math.sin(t.heading * RAD);
  g.shells.push({ x: t.x + c * 1.6, z: t.z + s * 1.6, vx: c * 15, vz: s * 15, owner: name, bounces: 0 });
  t.lastShot = g.tick;
  t.shots++;
  return true;
}

const SUBSTEPS = 5; // a shell moves 0.25 per tick: small steps so it cannot skip a wall corner

// Move shell s by 1/SUBSTEPS of a tick. Returns false when it is gone.
function moveShell(g, s) {
  const lx = ARENA.width / 2 - SHELL_R, lz = ARENA.depth / 2 - SHELL_R;
  {
    const ox = s.x, oz = s.z, dx = s.vx * DT / SUBSTEPS, dz = s.vz * DT / SUBSTEPS;
    s.x += dx;
    s.z += dz;
    for (const t of Object.values(g.tanks)) {
      // distance from the tank centre to the segment travelled, exact contact counts as a hit
      const k = clamp(((t.x - ox) * dx + (t.z - oz) * dz) / (dx * dx + dz * dz), 0, 1);
      if (Math.hypot(ox + dx * k - t.x, oz + dz * k - t.z) <= TANK_R + SHELL_R + 1e-9) {
        t.health = Math.max(0, t.health - 25);
        g.explosions.push({ x: s.x, z: s.z, ticks: 20 });
        return false;
      }
    }
    const ns = [];
    for (const w of WALLS) {
      const n = pushOut(s, SHELL_R, w);
      if (n) ns.push(n);
    }
    if (Math.abs(s.x) > lx) { const q = Math.sign(s.x); s.x = q * lx; ns.push({ x: -q, z: 0 }); }
    if (Math.abs(s.z) > lz) { const q = Math.sign(s.z); s.z = q * lz; ns.push({ x: 0, z: -q }); }
    if (!ns.length) return true;
    if (++s.bounces >= 2) return false;
    for (const n of ns) {
      const dot = s.vx * n.x + s.vz * n.z;
      if (dot < 0) { s.vx -= 2 * dot * n.x; s.vz -= 2 * dot * n.z; }
    }
    return true;
  }
}

function updateShells(g) {
  g.shells = g.shells.filter((s) => {
    for (let i = 0; i < SUBSTEPS; i++) if (!moveShell(g, s)) return false;
    return true;
  });
}

// Advance one 1/60 s tick. `input` is the player's held-key input.
export function step(g, input) {
  g.tick++;
  if (g.state === 'round_over') {
    if (--g.timer <= 0) { g.round++; startRound(g); }
    return;
  }
  const inputs = { player: input, computer: g.ai ? aiInput(g) : {} };
  for (const name of ['player', 'computer']) {
    const inp = inputs[name], t = g.tanks[name];
    drive(g, name, inp);
    if (inp.fire && !t.prevFire) fire(g, name);
    t.prevFire = !!inp.fire;
  }
  updateShells(g);
  g.explosions = g.explosions.filter((e) => --e.ticks > 0);
  const loser = g.tanks.player.health <= 0 ? 'player' : g.tanks.computer.health <= 0 ? 'computer' : null;
  if (loser) {
    g.winner = other(loser);
    g.score[g.winner]++;
    g.state = 'round_over';
    g.timer = 120;
  }
}

// Returns an error string, or null after moving the tank.
export function place(g, name, x, z, heading) {
  const o = g.tanks[other(name)];
  if (blocked(x, z, TANK_R)) return 'spot is inside a wall or outside the arena';
  if (Math.hypot(x - o.x, z - o.z) < 2 * TANK_R) return 'spot overlaps the other tank';
  const t = g.tanks[name];
  t.x = x;
  t.z = z;
  if (heading !== undefined) t.heading = norm(heading);
  return null;
}

export function snapshot(g) {
  const tank = (t) => ({ x: t.x, z: t.z, heading: t.heading, health: t.health, shots: t.shots });
  return {
    ok: true,
    arena: { ...ARENA },
    walls: WALLS.map((w) => ({ ...w })),
    tanks: { player: tank(g.tanks.player), computer: tank(g.tanks.computer) },
    shells: g.shells.map((s) => ({ x: s.x, z: s.z, owner: s.owner, bounces: s.bounces })),
    score: { ...g.score },
    round: g.round,
    state: g.state,
    paused: g.paused,
    ai: g.ai,
  };
}
