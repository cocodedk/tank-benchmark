import { ARENA, WALLS, STARTS, OTHER, TANK_RADIUS, MUZZLE, SHELL_SPEED, MAX_SHELLS, COOLDOWN_STEPS, BANNER_STEPS } from './config.js';
import { rad, norm, wallContact } from './geom.js';

const newTank = (name) => ({ ...STARTS[name], health: 100, shots: 0, cool: 0, lock: 0 });

export function createGame() {
  const g = { paused: false, ai: true, keys: new Set(), firePending: false, tick: 0 }; // tick counts changes, so a paused page need not redraw
  resetGame(g);
  return g;
}

export function resetGame(g) {
  g.score = { player: 0, computer: 0 };
  g.round = 0;
  g.tanks = { player: newTank('player'), computer: newTank('computer') };
  startRound(g);
}

export function startRound(g) {
  g.round++;
  for (const name of Object.keys(g.tanks)) Object.assign(g.tanks[name], newTank(name), { shots: g.tanks[name].shots });
  g.shells = [];
  g.fx = [];
  g.state = 'playing';
  g.banner = '';
  g.timer = 0;
}

export function endRound(g, loser) {
  const winner = OTHER[loser];
  g.score[winner]++;
  g.state = 'round_over';
  g.banner = winner === 'player' ? 'You win the round' : 'The computer wins the round';
  g.timer = BANNER_STEPS;
  g.shells = [];
}

export function tryFire(g, name) {
  const t = g.tanks[name];
  if (g.state !== 'playing' || t.cool > 0 || g.shells.filter((s) => s.owner === name).length >= MAX_SHELLS) return false;
  const c = Math.cos(rad(t.heading));
  const s = Math.sin(rad(t.heading));
  g.shells.push({ x: t.x + c * MUZZLE, z: t.z + s * MUZZLE, vx: c * SHELL_SPEED, vz: s * SHELL_SPEED, owner: name, bounces: 0 });
  t.cool = COOLDOWN_STEPS;
  t.shots++;
  return true;
}

/** Moves a tank; returns an error text when the spot is not allowed. */
export function place(g, name, x, z, heading) {
  const other = g.tanks[OTHER[name]];
  if (Math.abs(x) > ARENA.width / 2 || Math.abs(z) > ARENA.depth / 2) return 'outside the arena';
  if (wallContact(x, z, TANK_RADIUS - 1e-6)) return 'inside a wall';
  if (Math.hypot(x - other.x, z - other.z) < 2 * TANK_RADIUS - 1e-6) return 'overlapping the other tank';
  Object.assign(g.tanks[name], { x, z, heading: norm(heading ?? g.tanks[name].heading) });
  return null;
}

const round = (v) => Math.round(v * 1e6) / 1e6;

export function snapshot(g) {
  const tank = (t) => ({ x: round(t.x), z: round(t.z), heading: round(t.heading) % 360, health: t.health, shots: t.shots });
  return {
    ok: true,
    arena: { ...ARENA },
    walls: WALLS.map((w) => ({ ...w })),
    tanks: { player: tank(g.tanks.player), computer: tank(g.tanks.computer) },
    shells: g.shells.map((s) => ({ x: round(s.x), z: round(s.z), owner: s.owner, bounces: s.bounces })),
    score: { ...g.score },
    round: g.round,
    state: g.state,
    paused: g.paused,
    ai: g.ai,
  };
}
