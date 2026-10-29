// The game state and one fixed step. No three.js here.
import { WALLS, HALF_X, HALF_Z, R_TANK, pushOut, overlapsWall, insideArena } from './collide.js';
import { think } from './ai.js';
import { fire as fireShell, updateShells } from './shells.js';

export const DT = 1 / 60;
const START = { player: [-15, 0, 0], computer: [15, 0, 180] };
const rad = (h) => (h * Math.PI) / 180;
export const norm = (h) => { const v = ((h % 360) + 360) % 360; return v >= 360 ? 0 : v; };

function startRound(s) {
  s.tanks = {};
  for (const k of ['player', 'computer']) {
    const [x, z, heading] = START[k];
    s.tanks[k] = { x, z, heading, health: 100, last: -Infinity };
  }
  s.shells = [];
  s.state = 'playing';
  s.winner = null;
  s.timer = 0;
}

export function reset(s) {
  s.shots = { player: 0, computer: 0 };
  s.score = { player: 0, computer: 0 };
  s.round = 1;
  s.explosions = [];
  s.time = 0;
  startRound(s);
}

export function createSim() {
  const s = { paused: false, ai: true, prevSpace: false };
  reset(s);
  return s;
}

export const fire = fireShell;

function move(s, name, drive, turn) {
  const t = s.tanks[name], o = s.tanks[name === 'player' ? 'computer' : 'player'];
  t.heading = norm(t.heading + turn * 120 * DT);
  const [x0, z0] = [t.x, t.z];
  const d = drive * (drive > 0 ? 6 : 4) * DT;
  t.x += Math.cos(rad(t.heading)) * d;
  t.z += Math.sin(rad(t.heading)) * d;
  const walls = () => {
    for (const w of WALLS) Object.assign(t, pushOut(t.x, t.z, R_TANK, w));
    t.x = Math.max(-(HALF_X - R_TANK), Math.min(HALF_X - R_TANK, t.x));
    t.z = Math.max(-(HALF_Z - R_TANK), Math.min(HALF_Z - R_TANK, t.z));
  };
  walls();
  const dx = t.x - o.x, dz = t.z - o.z, dist = Math.hypot(dx, dz);
  if (dist < 2 * R_TANK) {
    const nx = dist > 0 ? dx / dist : -Math.cos(rad(t.heading));
    const nz = dist > 0 ? dz / dist : -Math.sin(rad(t.heading));
    t.x = o.x + nx * 2 * R_TANK;
    t.z = o.z + nz * 2 * R_TANK;
    walls();
    // pinned between wall and tank: stay put rather than overlap
    if (Math.hypot(t.x - o.x, t.z - o.z) < 2 * R_TANK - 1e-6) { t.x = x0; t.z = z0; }
  }
}

export function step(s, keys) {
  s.time += DT;
  for (const e of s.explosions) e.t -= DT;
  s.explosions = s.explosions.filter((e) => e.t > 0);
  const space = keys.has('Space');
  if (s.state === 'round_over') {
    s.prevSpace = space;
    s.timer -= DT;
    if (s.timer <= 1e-9) { s.round++; startRound(s); }
    return;
  }
  const turn = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
  const drive = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
  move(s, 'player', drive, turn);
  if (space && !s.prevSpace) fireShell(s, 'player');
  s.prevSpace = space;
  if (s.ai) {
    const c = think(s);
    move(s, 'computer', c.drive, c.turn);
    if (c.fire) fireShell(s, 'computer');
  }
  updateShells(s, DT);
  const dead = s.tanks.player.health <= 0 ? 'computer' : s.tanks.computer.health <= 0 ? 'player' : null;
  if (dead) {
    s.state = 'round_over';
    s.winner = dead;
    s.score[dead]++;
    s.timer = 2;
    s.shells = [];
  }
}

export function place(s, name, x, z, heading) {
  const t = s.tanks[name], o = s.tanks[name === 'player' ? 'computer' : 'player'];
  if (!t) return 'tank must be "player" or "computer"';
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 'x and z must be finite numbers';
  if (heading !== undefined && !Number.isFinite(heading)) return 'heading must be a finite number';
  if (!insideArena(x, z)) return 'outside the arena';
  if (WALLS.some((w) => overlapsWall(x, z, R_TANK, w))) return 'inside a wall';
  if (Math.hypot(x - o.x, z - o.z) < 2 * R_TANK) return 'overlaps the other tank';
  t.x = x;
  t.z = z;
  if (heading !== undefined) t.heading = norm(heading);
  return null;
}

export function snapshot(s) {
  const tank = (k) => { const t = s.tanks[k]; return { x: t.x, z: t.z, heading: t.heading, health: t.health, shots: s.shots[k] }; };
  return {
    ok: true,
    arena: { width: 40, depth: 30 },
    walls: WALLS.map((w) => ({ ...w })),
    tanks: { player: tank('player'), computer: tank('computer') },
    shells: s.shells.map((b) => ({ x: b.x, z: b.z, owner: b.owner, bounces: b.bounces })),
    score: { ...s.score },
    round: s.round,
    state: s.state,
    paused: s.paused,
    ai: s.ai,
  };
}
