// Pure game state and the fixed-step simulation. No three.js.
import { DT, WALLS, TANK_R, HALF_X, HALF_Z, SHELL_R, pushOut, resolveTank, boxDist, touchAt } from './collide.js';
import { think } from './ai.js';

const TURN = 120, FWD = 6, BACK = 4, SHELL_V = 15, HIT_R = 1.45;
const START = { player: [-15, 0, 0], computer: [15, 0, 180] };
const rad = Math.PI / 180;
const r3 = (v) => Math.round(v * 1000) / 1000;
const other = (who) => (who === 'player' ? 'computer' : 'player');

function makeTank(who) {
  const [x, z, heading] = START[who];
  return { x, z, heading, health: 100, shots: 0, last: -Infinity };
}

function startRound(s) {
  for (const k of ['player', 'computer']) Object.assign(s.tanks[k], makeTank(k), { shots: s.tanks[k].shots });
  s.shells = []; s.explosions = []; s.mem = { t: 0, path: [] };
  s.state = 'playing'; s.banner = ''; s.timer = 0;
}

export function create() {
  const s = { tanks: { player: makeTank('player'), computer: makeTank('computer') }, time: 0, prevSpace: false,
    paused: false, ai: true };
  reset(s);
  return s;
}

export function reset(s) {
  s.tanks.player.shots = 0; s.tanks.computer.shots = 0;
  s.score = { player: 0, computer: 0 }; s.round = 1;
  startRound(s);
}

export function fire(s, who) {
  const t = s.tanks[who];
  if (s.state !== 'playing' || s.time - t.last < 0.5 - 1e-9) return false;
  if (s.shells.filter((sh) => sh.owner === who).length >= 3) return false;
  const dx = Math.cos(t.heading * rad), dz = Math.sin(t.heading * rad);
  s.shells.push({ x: t.x + 1.6 * dx, z: t.z + 1.6 * dz, vx: SHELL_V * dx, vz: SHELL_V * dz, owner: who, bounces: 0 });
  t.last = s.time; t.shots++;
  return true;
}

// Returns an error string, or null after moving the tank.
export function place(s, who, x, z, heading) {
  const o = s.tanks[other(who)];
  if (Math.abs(x) > HALF_X || Math.abs(z) > HALF_Z) return 'outside the arena';
  if (WALLS.some((w) => boxDist(x, z, w) < TANK_R)) return 'overlaps a wall';
  if (Math.hypot(x - o.x, z - o.z) < 2 * TANK_R) return 'overlaps the other tank';
  const t = s.tanks[who];
  t.x = x; t.z = z;
  if (heading !== undefined) t.heading = ((heading % 360) + 360) % 360;
  return null;
}

function move(s, who, dh, v) {
  const t = s.tanks[who], ox = t.x, oz = t.z;
  t.heading = (((t.heading + dh) % 360) + 360) % 360;
  t.x += Math.cos(t.heading * rad) * v * DT;
  t.z += Math.sin(t.heading * rad) * v * DT;
  resolveTank(t, s.tanks[other(who)], ox, oz);
}

// Moves the shell one step, stopping at its first inner-wall contact; returns the wall normals it touched.
function travel(sh) {
  const dx = sh.vx * DT, dz = sh.vz * DT, ns = [];
  let u = 1;
  for (const w of WALLS) {
    const t = touchAt(sh.x, sh.z, dx, dz, w, SHELL_R);
    if (t === null || t >= u) continue;
    const n = pushOut({ x: sh.x + t * dx, z: sh.z + t * dz }, w, SHELL_R + 1e-6);
    if (n && sh.vx * n[0] + sh.vz * n[1] < 0) { u = t; ns[0] = n; } // only contact while heading into the wall
  }
  sh.x += u * dx; sh.z += u * dz;
  const bx = HALF_X + 0.95, bz = HALF_Z + 0.95;
  if (Math.abs(sh.x) > bx) { sh.x = Math.sign(sh.x) * bx; ns.push([-Math.sign(sh.x), 0]); }
  if (Math.abs(sh.z) > bz) { sh.z = Math.sign(sh.z) * bz; ns.push([0, -Math.sign(sh.z)]); }
  return ns;
}

// Returns true when the shell is spent on a second wall contact.
function bounce(sh, ns) {
  if (!ns.length) return false;
  if (sh.bounces) return true;
  for (const n of ns) { // reflect the velocity across the contact normal
    const vn = sh.vx * n[0] + sh.vz * n[1];
    if (vn < 0) { sh.vx -= 2 * vn * n[0]; sh.vz -= 2 * vn * n[1]; }
  }
  sh.bounces = 1;
  return false;
}

function stepShells(s) {
  s.shells = s.shells.filter((sh) => {
    const ax = sh.x, az = sh.z, ns = travel(sh), dx = sh.x - ax, dz = sh.z - az;
    const near = (t) => { // closest approach of this step's path to the tank centre
      const u = Math.max(0, Math.min(1, ((t.x - ax) * dx + (t.z - az) * dz) / (dx * dx + dz * dz || 1)));
      return Math.hypot(ax + u * dx - t.x, az + u * dz - t.z);
    };
    const hit = ['player', 'computer'].find((k) => near(s.tanks[k]) <= HIT_R + 1e-9);
    if (hit) {
      s.tanks[hit].health = Math.max(0, s.tanks[hit].health - 25);
      s.explosions.push({ x: sh.x, z: sh.z, age: 0 });
      return false;
    }
    return !bounce(sh, ns);
  });
}

export function step(s, keys) {
  s.time += DT;
  for (const e of s.explosions) e.age += DT;
  s.explosions = s.explosions.filter((e) => e.age < 0.5);
  const space = keys.has('Space'), edge = space && !s.prevSpace;
  s.prevSpace = space;
  if (s.state === 'round_over') {
    s.timer -= DT;
    if (s.timer <= 1e-9) { s.round++; startRound(s); }
    return;
  }
  if (edge) fire(s, 'player');
  const h = (a, b) => (keys.has(a) || keys.has(b) ? 1 : 0);
  const v = h('KeyW', 'ArrowUp') * FWD - h('KeyS', 'ArrowDown') * BACK;
  move(s, 'player', (h('KeyD', 'ArrowRight') - h('KeyA', 'ArrowLeft')) * TURN * DT, v);
  if (s.ai) {
    const a = think(s);
    move(s, 'computer', a.dh, a.fwd);
    if (a.fire) fire(s, 'computer');
  }
  stepShells(s);
  const dead = ['player', 'computer'].find((k) => s.tanks[k].health <= 0);
  if (dead) {
    const winner = other(dead);
    s.score[winner]++;
    s.state = 'round_over'; s.timer = 2;
    s.banner = winner === 'player' ? 'You win the round' : 'The computer wins the round';
  }
}

export function snapshot(s) {
  const tank = (t) => ({ x: r3(t.x), z: r3(t.z), heading: r3(t.heading) % 360, health: t.health, shots: t.shots });
  return {
    ok: true, arena: { width: 40, depth: 30 }, walls: WALLS.map((w) => ({ ...w })),
    tanks: { player: tank(s.tanks.player), computer: tank(s.tanks.computer) },
    shells: s.shells.map((sh) => ({ x: r3(sh.x), z: r3(sh.z), owner: sh.owner, bounces: sh.bounces })),
    score: { ...s.score }, round: s.round, state: s.state, paused: s.paused, ai: s.ai,
  };
}
