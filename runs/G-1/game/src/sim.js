// The game: state and one fixed 1/60 s step, shared by real-time play and the step tool.
import { ARENA, WALLS, HALF_X, HALF_Z, TANK_R, SHELL_R, dir, norm, fromWall, outside, blockedAt } from './geom.js';
import { think } from './ai.js';

export { ARENA, WALLS };
export const DT = 1 / 60;
const START = { player: [-15, 0, 0], computer: [15, 0, 180] };
const OTHER = { player: 'computer', computer: 'player' };
export const isTank = who => Object.hasOwn(OTHER, who);

export function newGame(game = {}) {
  Object.assign(game, { score: { player: 0, computer: 0 }, round: 0, time: 0,
    tanks: { player: { shots: 0 }, computer: { shots: 0 } } });
  game.paused ??= false;
  game.ai ??= true;
  return newRound(game);
}

function newRound(game) {
  for (const who in START) {
    const [x, z, heading] = START[who];
    Object.assign(game.tanks[who], { x, z, heading, health: 100, lastShot: -Infinity });
  }
  Object.assign(game, { round: game.round + 1, state: 'playing', banner: '', timer: 0,
    shells: [], blasts: [], fireHeld: false, brain: {} });
  return game;
}

// An error message, or '' once the tank stands there.
export function place(game, who, x, z, heading) {
  if (!isTank(who)) return 'tank must be "player" or "computer"';
  if (![x, z, heading].every(Number.isFinite)) return 'x, z and heading must be numbers';
  if (outside(x, z, TANK_R)) return 'outside the arena';
  if (blockedAt(x, z, TANK_R)) return 'inside a wall';
  const o = game.tanks[OTHER[who]];
  if (Math.hypot(x - o.x, z - o.z) < 2 * TANK_R) return 'overlaps the other tank';
  Object.assign(game.tanks[who], { x, z, heading: norm(heading) });
  return '';
}

export function fire(game, who) {
  const t = game.tanks[who];
  if (game.state !== 'playing' || game.time - t.lastShot < 0.5 - 1e-9) return false;
  if (game.shells.filter(s => s.owner === who).length >= 3) return false;
  const [dx, dz] = dir(t.heading);
  game.shells.push({ x: t.x + 1.6 * dx, z: t.z + 1.6 * dz, vx: 15 * dx, vz: 15 * dz, owner: who, bounces: 0 });
  t.lastShot = game.time;
  t.shots++;
  return true;
}

function drive(game, who, c) {
  const t = game.tanks[who], o = game.tanks[OTHER[who]];
  t.heading = norm(t.heading + 120 * DT * ((c.right ? 1 : 0) - (c.left ? 1 : 0)));
  const [dx, dz] = dir(t.heading), speed = c.forward ? 6 : c.back ? -4 : 0, [x0, z0] = [t.x, t.z];
  t.x += speed * DT * dx;
  t.z += speed * DT * dz;
  const ox = t.x - o.x, oz = t.z - o.z, d = Math.hypot(ox, oz);
  if (d < 2 * TANK_R) {
    t.x = o.x + ox / d * 2 * TANK_R;
    t.z = o.z + oz / d * 2 * TANK_R;
  }
  for (const w of WALLS) {
    const [wx, wz] = fromWall(w, t.x, t.z), wd = Math.hypot(wx, wz);
    if (wd >= TANK_R) continue;
    t.x += wx / wd * (TANK_R - wd);
    t.z += wz / wd * (TANK_R - wd);
  }
  t.x = Math.max(-HALF_X + TANK_R, Math.min(HALF_X - TANK_R, t.x));
  t.z = Math.max(-HALF_Z + TANK_R, Math.min(HALF_Z - TANK_R, t.z));
  // A wall pushed it back onto the other tank: stay put this step.
  if (Math.hypot(t.x - o.x, t.z - o.z) < 2 * TANK_R - 1e-6) [t.x, t.z] = [x0, z0];
}

// On a wall contact: reflects the shell, puts it at the contact and answers true.
function bounce(s) {
  if (Math.abs(s.x) > HALF_X - SHELL_R) {
    s.x = Math.sign(s.x) * (HALF_X - SHELL_R);
    s.vx = -s.vx;
    return true;
  }
  if (Math.abs(s.z) > HALF_Z - SHELL_R) {
    s.z = Math.sign(s.z) * (HALF_Z - SHELL_R);
    s.vz = -s.vz;
    return true;
  }
  for (const w of WALLS) {
    if (Math.hypot(...fromWall(w, s.x, s.z)) >= SHELL_R) continue;
    // Back out along the axis needing the shorter move against the shell's velocity, even from inside.
    const px = s.vx > 0 ? s.x + SHELL_R - (w.x - w.width / 2) : w.x + w.width / 2 - (s.x - SHELL_R);
    const pz = s.vz > 0 ? s.z + SHELL_R - (w.z - w.depth / 2) : w.z + w.depth / 2 - (s.z - SHELL_R);
    if (px < pz) {
      s.x += s.vx > 0 ? -px : px;
      s.vx = -s.vx;
    } else {
      s.z += s.vz > 0 ? -pz : pz;
      s.vz = -s.vz;
    }
    return true;
  }
  return false;
}

// Sweeps the shell's path from (x0, z0) to where it is now against each tank.
function hitTank(game, s, x0, z0) {
  const dx = s.x - x0, dz = s.z - z0, len2 = dx * dx + dz * dz;
  for (const t of Object.values(game.tanks)) {
    const k = len2 && Math.max(0, Math.min(1, ((t.x - x0) * dx + (t.z - z0) * dz) / len2));
    if (Math.hypot(x0 + k * dx - t.x, z0 + k * dz - t.z) >= TANK_R + SHELL_R) continue;
    t.health = Math.max(0, t.health - 25);
    game.blasts.push({ x: s.x, z: s.z, age: 0 });
    return true;
  }
  return false;
}

// Four substeps keep a shell from passing into a wall within one step.
function moveShells(game) {
  game.shells = game.shells.filter(s => {
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = [s.x, s.z];
      s.x += s.vx * DT / 4;
      s.z += s.vz * DT / 4;
      if (hitTank(game, s, x0, z0) || (bounce(s) && ++s.bounces > 1)) return false;
    }
    return true;
  });
}

// keys: the player's held controls {forward, back, left, right, fire}.
export function step(game, keys) {
  game.time += DT;
  for (const b of game.blasts) b.age += DT;
  game.blasts = game.blasts.filter(b => b.age < 0.4);
  if (game.state === 'round_over') {
    if ((game.timer -= DT) <= 1e-9) newRound(game);
    return;
  }
  if (game.ai) {
    const c = think(game);
    drive(game, 'computer', c);
    if (c.fire) fire(game, 'computer');
  }
  drive(game, 'player', keys);
  if (keys.fire && !game.fireHeld) fire(game, 'player');
  game.fireHeld = keys.fire;
  moveShells(game);
  const loser = ['player', 'computer'].find(who => game.tanks[who].health <= 0);
  if (!loser) return;
  game.score[OTHER[loser]]++;
  game.banner = loser === 'computer' ? 'You win the round' : 'The computer wins the round';
  Object.assign(game, { state: 'round_over', timer: 2 });
}

export function stateOf(game) {
  const tank = ({ x, z, heading, health, shots }) => ({ x, z, heading, health, shots });
  return { ok: true, arena: ARENA, walls: WALLS,
    tanks: { player: tank(game.tanks.player), computer: tank(game.tanks.computer) },
    shells: game.shells.map(({ x, z, owner, bounces }) => ({ x, z, owner, bounces })),
    score: { ...game.score }, round: game.round, state: game.state, paused: game.paused, ai: game.ai };
}
