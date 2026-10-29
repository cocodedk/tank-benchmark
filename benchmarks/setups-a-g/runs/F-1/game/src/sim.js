// Game state and the fixed-step simulation.
import * as W from './world.js';
import { think } from './ai.js';

const START = { player: { x: -15, z: 0, heading: 0 }, computer: { x: 15, z: 0, heading: 180 } };
const NAMES = ['player', 'computer'];
const other = n => (n === 'player' ? 'computer' : 'player');
const rad = h => h * Math.PI / 180;
const norm = h => ((h % 360) + 360) % 360;
export const s = { paused: false, ai: true, tick: 0 };

function startRound() {
  for (const n of NAMES) s.tanks = { ...s.tanks, [n]: { ...START[n], health: 100, shots: s.tanks?.[n]?.shots ?? 0, last: -1e9 } };
  Object.assign(s, { shells: [], explosions: [], state: 'playing', banner: '' });
}

export function reset() {
  Object.assign(s, { tanks: null, round: 1, score: { player: 0, computer: 0 }, prevSpace: false });
  startRound();
}

// Keep tank t out of walls and out of the other tank; if both can't hold, it stays at (px, pz).
function settle(t, name, px, pz) {
  W.resolve(t, W.TANK_R);
  const o = s.tanks[other(name)], dx = t.x - o.x, dz = t.z - o.z, d = Math.hypot(dx, dz);
  if (d < 2 * W.TANK_R) {
    const nx = d > 0 ? dx / d : -Math.cos(rad(t.heading)), nz = d > 0 ? dz / d : -Math.sin(rad(t.heading));
    t.x = o.x + nx * 2 * W.TANK_R; t.z = o.z + nz * 2 * W.TANK_R;
    W.resolve(t, W.TANK_R);
    if (Math.hypot(t.x - o.x, t.z - o.z) < 2 * W.TANK_R - 1e-9) { t.x = px; t.z = pz; }
  }
}

function drive(name, k) {
  const t = s.tanks[name], has = (...keys) => keys.some(x => k.has(x));
  const turn = has('d', 'arrowright') - has('a', 'arrowleft');
  const move = has('w', 'arrowup') - has('s', 'arrowdown');
  t.heading = norm(t.heading + turn * W.TURN * W.DT);
  const v = move * (move > 0 ? W.FWD : W.REV) * W.DT, px = t.x, pz = t.z;
  t.x += Math.cos(rad(t.heading)) * v; t.z += Math.sin(rad(t.heading)) * v;
  settle(t, name, px, pz);
}

export function fire(name) {
  const t = s.tanks[name], a = rad(t.heading);
  if (s.state !== 'playing' || s.tick - t.last < 30 || s.shells.filter(h => h.owner === name).length >= 3) return false;
  s.shells.push({ x: t.x + 1.6 * Math.cos(a), z: t.z + 1.6 * Math.sin(a),
                  vx: W.SHELL_V * Math.cos(a), vz: W.SHELL_V * Math.sin(a), owner: name, bounces: 0 });
  t.last = s.tick; t.shots++;
  return true;
}

// Returns true when the shell stays in flight.
function moveShell(h) {
  const px = h.x, pz = h.z;
  const dx = h.vx * W.DT, dz = h.vz * W.DT;
  h.x += dx; h.z += dz;
  for (const n of NAMES) {
    // Closest point of this step's path to the tank, so a grazing shell is not missed between steps.
    const t = s.tanks[n], u = Math.max(0, Math.min(1, ((t.x - px) * dx + (t.z - pz) * dz) / (dx * dx + dz * dz)));
    const cx = px + u * dx, cz = pz + u * dz;
    if (Math.hypot(t.x - cx, t.z - cz) < W.TANK_R + W.SHELL_R) {
      t.health = Math.max(0, t.health - 25);
      s.explosions.push({ x: cx, z: cz, t: s.tick });
      return false;
    }
  }
  // Push the shell out of any wall it touches. The wall's normal, seen from before this step (or the push,
  // when the shell started inside the wall), says which velocity components ran into it.
  const p = { x: h.x, z: h.z };
  W.resolve(p, W.SHELL_R);
  let ox = p.x - h.x, oz = p.z - h.z;
  if (!ox && !oz) return true;
  for (const w of W.WALLS) {
    if (!W.pushRect({ x: h.x, z: h.z }, W.SHELL_R, w)) continue;
    const nx = px - Math.max(w.x - w.width / 2, Math.min(w.x + w.width / 2, px));
    const nz = pz - Math.max(w.z - w.depth / 2, Math.min(w.z + w.depth / 2, pz));
    if (nx || nz) { ox = nx; oz = nz; }
  }
  if (h.bounces) return false;
  if (h.vx * ox < 0) h.vx = -h.vx;
  if (h.vz * oz < 0) h.vz = -h.vz;
  Object.assign(h, p, { bounces: 1 });
  return true;
}

function checkRound() {
  const winner = s.tanks.computer.health <= 0 ? 'player' : s.tanks.player.health <= 0 ? 'computer' : null;
  if (!winner) return;
  s.score[winner]++;
  Object.assign(s, { state: 'round_over', timer: 120, banner: winner === 'player' ? 'You win the round' : 'The computer wins the round' });
}

// One 1/60 s step; keys is the Set of held lowercased KeyboardEvent.key values.
export function stepOnce(keys) {
  s.tick++;
  const space = keys.has(' ');
  if (space && !s.prevSpace) fire('player');
  s.prevSpace = space;
  s.explosions = s.explosions.filter(e => s.tick - e.t < 24);
  if (s.state === 'round_over') {
    if (--s.timer <= 0) { s.round++; startRound(); }
    return;
  }
  drive('player', keys);
  if (s.ai) drive('computer', think(s, fire));
  s.shells = s.shells.filter(moveShell);
  checkRound();
}

export function place(name, x, z, heading) {
  Object.assign(s.tanks[name], { x, z, heading: norm(heading) });
}

export function state() {
  const t = n => { const k = s.tanks[n]; return { x: k.x, z: k.z, heading: k.heading, health: k.health, shots: k.shots }; };
  return { ok: true, arena: W.ARENA, walls: W.WALLS, tanks: { player: t('player'), computer: t('computer') },
           shells: s.shells.map(h => ({ x: h.x, z: h.z, owner: h.owner, bounces: h.bounces })),
           score: { ...s.score }, round: s.round, state: s.state, paused: s.paused, ai: s.ai };
}

reset();
