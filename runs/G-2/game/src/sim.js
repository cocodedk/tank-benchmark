// The game's rules, advanced one fixed 1/60 s step at a time. No rendering here.
import { HALF_W, HALF_D, TANK_R, SHELL_R, WALLS, nearest, wallHit, inside } from './arena.js';
import { aiInput } from './ai.js';

export const DT = 1 / 60;
const START = { player: [-15, 0, 0], computer: [15, 0, 180] };
const COOLDOWN = 30, BANNER = 120; // in steps: 0.5 s and 2 s

export const game = { paused: false, ai: true, explosions: [] };

function newRound() {
  for (const [name, [x, z, heading]] of Object.entries(START)) {
    game.tanks[name] = { x, z, heading, health: 100, shots: game.tanks[name]?.shots ?? 0, last: -Infinity };
  }
  game.shells = [];
  game.state = 'playing';
  game.winner = null;
}

export function reset() {
  Object.assign(game, { tanks: {}, score: { player: 0, computer: 0 }, round: 1, frame: 0, timer: 0 });
  newRound();
}

export const other = name => game.tanks[name === 'player' ? 'computer' : 'player'];
const rad = h => h * Math.PI / 180;

// True when a tank's circle at (x, z) fits: inside the arena, off the walls, off the other tank.
export function fits(name, x, z) {
  const o = other(name);
  return inside(x, z, TANK_R - 1e-6) && !wallHit(x, z, TANK_R - 1e-6) && Math.hypot(x - o.x, z - o.z) >= 2 * TANK_R - 1e-6;
}

function drive(name, { fwd = 0, turn = 0 }) {
  const t = game.tanks[name], o = other(name);
  turn = Math.max(-1, Math.min(1, turn));
  fwd = Math.max(-1, Math.min(1, fwd));
  t.heading = (((t.heading + turn * 120 * DT) % 360) + 360) % 360;
  const d = fwd * (fwd > 0 ? 6 : 4) * DT;
  let x = t.x + Math.cos(rad(t.heading)) * d, z = t.z + Math.sin(rad(t.heading)) * d;
  x = Math.max(-HALF_W + TANK_R, Math.min(HALF_W - TANK_R, x));
  z = Math.max(-HALF_D + TANK_R, Math.min(HALF_D - TANK_R, z));
  // Push out of what it ran into: it stops at the contact and slides along a wall.
  for (const c of [...WALLS.map(w => ({ ...nearest(w, x, z), r: TANK_R })), { x: o.x, z: o.z, r: 2 * TANK_R }]) {
    const dist = Math.hypot(x - c.x, z - c.z);
    if (dist < c.r && dist > 1e-9) { x = c.x + (x - c.x) / dist * c.r; z = c.z + (z - c.z) / dist * c.r; }
  }
  if (fits(name, x, z)) { t.x = x; t.z = z; }
}

export function fire(name) {
  const t = game.tanks[name];
  if (game.state !== 'playing' || game.frame - t.last < COOLDOWN) return false;
  if (game.shells.filter(s => s.owner === name).length >= 3) return false;
  const cx = Math.cos(rad(t.heading)), cz = Math.sin(rad(t.heading));
  game.shells.push({ x: t.x + 1.6 * cx, z: t.z + 1.6 * cz, vx: 15 * cx, vz: 15 * cz, owner: name, bounces: 0 });
  t.last = game.frame;
  t.shots++;
  return true;
}

// Moves a shell; on a wall contact reflects it (true) or reports it spent (false).
function fly(s) {
  s.px = s.x; s.pz = s.z;
  s.x += s.vx * DT; s.z += s.vz * DT;
  let axis = null, edge = 0;
  if (Math.abs(s.x) > HALF_W - SHELL_R) { axis = 'x'; edge = Math.sign(s.x) * HALF_W; }
  else if (Math.abs(s.z) > HALF_D - SHELL_R) { axis = 'z'; edge = Math.sign(s.z) * HALF_D; }
  else {
    const w = wallHit(s.x, s.z, SHELL_R);
    if (!w) return true;
    // The face it crossed last: on each axis, how long ago it passed the face it is moving into.
    const half = { x: w.width / 2, z: w.depth / 2 };
    const ago = a => {
      const v = s['v' + a];
      return v === 0 ? Infinity : ((v > 0 ? s[a] - (w[a] - half[a]) : w[a] + half[a] - s[a]) + SHELL_R) / Math.abs(v);
    };
    axis = ago('x') <= ago('z') ? 'x' : 'z';
    edge = w[axis] - Math.sign(s['v' + axis]) * half[axis];
  }
  if (s.bounces++) return false;
  s['v' + axis] = -s['v' + axis];
  s[axis] = edge + Math.sign(s['v' + axis]) * SHELL_R;
  return true;
}

// Checks the whole path the shell swept this step, so a grazing pass between two steps still hits.
function hit(s) {
  const dx = s.x - s.px, dz = s.z - s.pz, len2 = dx * dx + dz * dz || 1;
  for (const [name, t] of Object.entries(game.tanks)) {
    const u = Math.max(0, Math.min(1, ((t.x - s.px) * dx + (t.z - s.pz) * dz) / len2));
    const x = s.px + u * dx, z = s.pz + u * dz;
    if (Math.hypot(x - t.x, z - t.z) <= TANK_R + SHELL_R + 1e-9) { // touching counts
      t.health = Math.max(0, t.health - 25);
      game.explosions.push({ x, z });
      return name;
    }
  }
  return null;
}

// One 1/60 s step. keys: {fwd, turn, fire} for the player.
export function step(keys) {
  game.frame++;
  if (game.state === 'round_over') {
    if (--game.timer <= 0) { game.round++; newRound(); }
    return;
  }
  const ai = game.ai ? aiInput(game) : {};
  drive('player', keys);
  drive('computer', ai);
  if (keys.fire) fire('player');
  if (ai.fire) fire('computer');
  game.shells = game.shells.filter(s => fly(s) && !hit(s));
  const loser = Object.keys(game.tanks).find(n => game.tanks[n].health <= 0);
  if (loser) {
    game.winner = loser === 'player' ? 'computer' : 'player';
    game.score[game.winner]++;
    game.state = 'round_over';
    game.timer = BANNER;
  }
}

const r3 = v => Math.round(v * 1000) / 1000;

export function snapshot() {
  const tank = t => ({ x: r3(t.x), z: r3(t.z), heading: r3(t.heading) % 360, health: t.health, shots: t.shots });
  return {
    ok: true,
    arena: { width: 2 * HALF_W, depth: 2 * HALF_D },
    walls: WALLS.map(w => ({ ...w })),
    tanks: { player: tank(game.tanks.player), computer: tank(game.tanks.computer) },
    shells: game.shells.map(s => ({ x: r3(s.x), z: r3(s.z), owner: s.owner, bounces: s.bounces })),
    score: { ...game.score }, round: game.round, state: game.state, paused: game.paused, ai: game.ai,
  };
}

reset();
