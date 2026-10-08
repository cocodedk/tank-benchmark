// The simulation: tanks, shells, rounds. One call to step() is one 1/60 s tick.
import { WIDTH, DEPTH, HALF_W, HALF_D, WALLS, closest, blocked, pushOut } from "./arena.js";
import { think } from "./ai.js";

export const DT = 1 / 60;
export const TANK_R = 1.2, SHELL_R = 0.25;
const FORWARD = 6, REVERSE = 4, TURN = 120, SHELL_SPEED = 15, MUZZLE = 1.6;
const COOLDOWN = 30, MAX_SHELLS = 3, DAMAGE = 25, BANNER = 120, BLAST = 30;
const START = { player: [-15, 0, 0], computer: [15, 0, 180] };
const NAMES = { player: "You win the round", computer: "The computer wins the round" };

export const game = { paused: false, ai: true };
const rad = (deg) => deg * Math.PI / 180;
export const norm = (deg) => ((deg % 360) + 360) % 360 % 360;
const other = (name) => (name === "player" ? "computer" : "player");

function startRound() {
  for (const [name, [x, z, heading]] of Object.entries(START)) {
    Object.assign(game.tanks[name], { x, z, heading, health: 100, lastShot: -Infinity });
  }
  game.shells = [];
  game.state = "playing";
}

export function reset() {
  game.tick = 0;
  game.tanks = { player: { shots: 0 }, computer: { shots: 0 } };
  game.explosions = [];
  game.score = { player: 0, computer: 0 };
  game.round = 1;
  game.banner = "";
  game.spaceWas = false;
  startRound();
}

// True when a tank at (x, z) would overlap a wall or the other tank.
export function overlaps(name, x, z) {
  const o = game.tanks[other(name)];
  return blocked(x, z, TANK_R) || Math.hypot(x - o.x, z - o.z) < 2 * TANK_R - 1e-6;
}

export function fire(name) {
  const t = game.tanks[name];
  const out = game.shells.filter((s) => s.owner === name).length;
  if (game.state !== "playing" || game.tick - t.lastShot < COOLDOWN || out >= MAX_SHELLS) return false;
  const [dx, dz] = [Math.cos(rad(t.heading)), Math.sin(rad(t.heading))];
  game.shells.push({ x: t.x + dx * MUZZLE, z: t.z + dz * MUZZLE, vx: dx * SHELL_SPEED, vz: dz * SHELL_SPEED,
    owner: name, bounces: 0 });
  t.lastShot = game.tick;
  t.shots += 1;
  return true;
}

function drive(name, { move, turn }) {
  const t = game.tanks[name];
  t.heading = norm(t.heading + turn * TURN * DT);
  if (!move) return;
  const speed = move > 0 ? FORWARD : -REVERSE;
  let x = t.x + Math.cos(rad(t.heading)) * speed * DT, z = t.z + Math.sin(rad(t.heading)) * speed * DT;
  const o = game.tanks[other(name)], d = Math.hypot(x - o.x, z - o.z);
  if (d < 2 * TANK_R && d > 0) [x, z] = [o.x + (x - o.x) / d * 2 * TANK_R, o.z + (z - o.z) / d * 2 * TANK_R];
  [x, z] = pushOut(x, z, TANK_R);
  if (!overlaps(name, x, z)) Object.assign(t, { x, z });
}

// Reflects a shell off whatever wall it touches; true when it touched one.
function bounce(s) {
  let hit = false;
  for (const [k, v, half] of [["x", "vx", HALF_W], ["z", "vz", HALF_D]]) {
    if (Math.abs(s[k]) + SHELL_R > half) {
      s[k] = Math.sign(s[k]) * (half - SHELL_R);
      s[v] = -Math.sign(s[k]) * Math.abs(s[v]);
      hit = true;
    }
  }
  for (const w of WALLS) {
    const [cx, cz] = closest(w, s.x, s.z);
    if (Math.hypot(s.x - cx, s.z - cz) >= SHELL_R) continue;
    const px = w.width / 2 + SHELL_R - Math.abs(s.x - w.x), pz = w.depth / 2 + SHELL_R - Math.abs(s.z - w.z);
    const [k, v, c, half] = px < pz ? ["x", "vx", w.x, w.width / 2] : ["z", "vz", w.z, w.depth / 2];
    const side = Math.sign(s[k] - c) || 1;
    s[k] = c + side * (half + SHELL_R);
    s[v] = side * Math.abs(s[v]);
    hit = true;
  }
  return hit;
}

function fly(s) {
  const [x0, z0, dx, dz] = [s.x, s.z, s.vx * DT, s.vz * DT];
  s.x += dx;
  s.z += dz;
  for (const t of Object.values(game.tanks)) {
    // The closest point of this tick's whole path to the tank, so a shell cannot skip past its edge.
    const k = Math.max(0, Math.min(1, ((t.x - x0) * dx + (t.z - z0) * dz) / (dx * dx + dz * dz)));
    const [x, z] = [x0 + k * dx, z0 + k * dz];
    if (Math.hypot(x - t.x, z - t.z) <= TANK_R + SHELL_R + 1e-9) {  // touching counts as a hit
      t.health = Math.max(0, t.health - DAMAGE);
      game.explosions.push({ x, z, born: game.tick });
      return false;
    }
  }
  return !bounce(s) || ++s.bounces < 2;
}

// One tick. keys: {move, turn, fire} for the player, read from the held keys.
export function step(keys) {
  game.tick += 1;
  game.explosions = game.explosions.filter((e) => game.tick - e.born < BLAST);
  if (game.state === "round_over") {
    if (--game.bannerTicks <= 0) {
      game.round += 1;
      game.banner = "";
      startRound();
    }
    return;
  }
  const bot = game.ai ? think(game.tanks.computer, game.tanks.player) : { move: 0, turn: 0, fire: false };
  drive("player", keys);
  drive("computer", bot);
  if (keys.fire && !game.spaceWas) fire("player");
  game.spaceWas = keys.fire;
  if (bot.fire) fire("computer");
  game.shells = game.shells.filter(fly);
  const loser = ["player", "computer"].find((n) => game.tanks[n].health <= 0);
  if (loser) {
    const winner = other(loser);
    game.score[winner] += 1;
    game.banner = NAMES[winner];
    game.state = "round_over";
    game.bannerTicks = BANNER;
  }
}

export function place(name, x, z, heading) {
  if (overlaps(name, x, z)) return false;
  Object.assign(game.tanks[name], { x, z, heading: norm(heading) });
  return true;
}

const tank = ({ x, z, heading, health, shots }) => ({ x, z, heading, health, shots });

export function describe() {
  return {
    ok: true,
    arena: { width: WIDTH, depth: DEPTH },
    walls: WALLS.map((w) => ({ ...w })),
    tanks: { player: tank(game.tanks.player), computer: tank(game.tanks.computer) },
    shells: game.shells.map(({ x, z, owner, bounces }) => ({ x, z, owner, bounces })),
    score: { ...game.score },
    round: game.round, state: game.state, paused: game.paused, ai: game.ai,
  };
}

reset();
