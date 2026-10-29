// The simulation: fixed 1/60 s steps, the same code for real time and the step tool.
import { TANK_R, SHELL_R, WALLS, hitsWall, inArena, pushOut, shellContact } from './world.js';
import { think } from './ai.js';

export const DT = 1 / 60;
const FWD = 6, REV = 4, TURN = 120, SHELL_V = 15, MUZZLE = 1.6, COOLDOWN = 30, MAX_SHELLS = 3, BANNER = 120;
const START = { player: [-15, 0, 0], computer: [15, 0, 180] };

export const game = { paused: false, ai: true };
export const keys = new Set();   // KeyboardEvent.code values held now

function startRound() {
  for (const [name, [x, z, heading]] of Object.entries(START)) {
    const t = game.tanks[name];
    Object.assign(t, { x, z, heading, health: 100, lastShot: -Infinity });
  }
  game.shells = [];
  game.blasts = [];
  game.state = 'playing';
}

export function reset() {
  game.tick = 0;
  game.tanks = { player: { shots: 0 }, computer: { shots: 0 } };
  game.score = { player: 0, computer: 0 };
  game.round = 1;
  game.spaceWas = false;
  startRound();
}
reset();

export function fire(name) {
  const t = game.tanks[name];
  if (game.state !== 'playing' || game.tick - t.lastShot < COOLDOWN) return false;
  if (game.shells.filter(s => s.owner === name).length >= MAX_SHELLS) return false;
  const a = t.heading * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  game.shells.push({ x: t.x + c * MUZZLE, z: t.z + s * MUZZLE, vx: c * SHELL_V, vz: s * SHELL_V, owner: name, bounces: 0 });
  t.lastShot = game.tick;
  t.shots++;
  return true;
}

// Drive one tank: move is -1..1 (forward), turn is -1..1 (+1 turns right, heading grows).
export function drive(name, move, turn) {
  const t = game.tanks[name], other = game.tanks[name === 'player' ? 'computer' : 'player'];
  t.heading = ((t.heading + turn * TURN * DT) % 360 + 360) % 360;
  const a = t.heading * Math.PI / 180, v = (move > 0 ? FWD : REV) * move * DT;
  let [x, z] = pushOut(t.x + Math.cos(a) * v, t.z + Math.sin(a) * v, TANK_R);
  const dx = x - other.x, dz = z - other.z, d = Math.hypot(dx, dz);
  if (d < 2 * TANK_R) { x = other.x + dx / d * 2 * TANK_R; z = other.z + dz / d * 2 * TANK_R; [x, z] = pushOut(x, z, TANK_R); }
  if (Math.hypot(x - other.x, z - other.z) >= 2 * TANK_R - 1e-9) { t.x = x; t.z = z; }
}

function held(...codes) { return codes.some(c => keys.has(c)) ? 1 : 0; }

// Distance from tank t to the segment a shell swept this step, from (x, z) by (dx, dz).
function sweptGap(t, x, z, dx, dz) {
  const u = Math.max(0, Math.min(1, ((t.x - x) * dx + (t.z - z) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(t.x - x - u * dx, t.z - z - u * dz);
}

function moveShells() {
  for (const s of game.shells) {
    const x = s.x, z = s.z, dx = s.vx * DT, dz = s.vz * DT;
    s.x += dx; s.z += dz;
    const hit = Object.entries(game.tanks).find(([, t]) => sweptGap(t, x, z, dx, dz) < TANK_R + SHELL_R);
    if (hit) {
      hit[1].health = Math.max(0, hit[1].health - 25);
      game.blasts.push({ x: s.x, z: s.z, tick: game.tick });
      s.dead = true;
      continue;
    }
    const axis = shellContact(s);
    if (!axis) continue;
    if (s.bounces++) { s.dead = true; continue; }
    if (axis === 'x') s.vx = -s.vx; else s.vz = -s.vz;
    [s.x, s.z] = pushOut(s.x, s.z, SHELL_R);
  }
  game.shells = game.shells.filter(s => !s.dead);
  game.blasts = game.blasts.filter(b => game.tick - b.tick < 30);
}

export function step() {
  game.tick++;
  if (game.state === 'round_over') {
    if (--game.bannerLeft <= 0) { game.round++; startRound(); }
    return;
  }
  drive('player', held('KeyW', 'ArrowUp') - held('KeyS', 'ArrowDown'), held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft'));
  const space = keys.has('Space');
  if (space && !game.spaceWas) fire('player');
  game.spaceWas = space;
  if (game.ai) think();
  moveShells();
  const { player, computer } = game.tanks;
  if (player.health <= 0 || computer.health <= 0) {
    game.winner = computer.health <= 0 ? 'player' : 'computer';
    game.score[game.winner]++;
    game.state = 'round_over';
    game.bannerLeft = BANNER;
  }
}

// Move a tank by the place tool; returns an error or null.
export function place(name, x, z, heading) {
  const other = game.tanks[name === 'player' ? 'computer' : 'player'];
  if (!inArena(x, z, TANK_R)) return 'outside the arena';
  if (hitsWall(x, z, TANK_R)) return 'inside a wall';
  if (Math.hypot(x - other.x, z - other.z) < 2 * TANK_R) return 'overlaps the other tank';
  Object.assign(game.tanks[name], { x, z, heading: ((heading % 360) + 360) % 360 });
  return null;
}

const r3 = v => Math.round(v * 1000) / 1000;

export function describe() {
  const tank = t => ({ x: r3(t.x), z: r3(t.z), heading: r3(t.heading) % 360, health: t.health, shots: t.shots });
  return {
    ok: true,
    arena: { width: 40, depth: 30 },
    walls: WALLS.map(w => ({ ...w })),
    tanks: { player: tank(game.tanks.player), computer: tank(game.tanks.computer) },
    shells: game.shells.map(s => ({ x: r3(s.x), z: r3(s.z), owner: s.owner, bounces: s.bounces })),
    score: { ...game.score },
    round: game.round, state: game.state, paused: game.paused, ai: game.ai,
  };
}
