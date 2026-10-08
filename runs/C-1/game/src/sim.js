// Pure game state and the fixed step. No three.js, no DOM.
import { WALLS, HALF_X, HALF_Z, R, SR, pushOut, rectDist } from './geom.js';
import { aiControl } from './ai.js';

export const DT = 1 / 60;
export const NAMES = ['player', 'computer'];
export const OTHER = { player: 'computer', computer: 'player' };
const START = { player: { x: -15, z: 0, h: 0 }, computer: { x: 15, z: 0, h: 180 } };
const IDLE = { fwd: 0, turn: 0, fire: false };

export function createSim() {
  const s = { ai: true, tanks: { player: { shots: 0 }, computer: { shots: 0 } }, hits: [] };
  resetGame(s);
  return s;
}

export function startRound(s, round) {
  s.round = round; s.state = 'playing'; s.winner = null; s.shells = [];
  for (const n of NAMES) Object.assign(s.tanks[n], START[n], { health: 100, last: -Infinity });
}

export function resetGame(s) {
  s.score = { player: 0, computer: 0 }; s.time = 0; s.nav = null;
  for (const n of NAMES) s.tanks[n].shots = 0;
  startRound(s, 1);
}

/** Try to fire; returns whether a shell left the barrel. */
export function fire(s, name) {
  const t = s.tanks[name];
  if (s.state !== 'playing' || s.time - t.last < 0.5 - 1e-9) return false;
  if (s.shells.filter((sh) => sh.owner === name).length >= 3) return false;
  const c = Math.cos((t.h * Math.PI) / 180), z = Math.sin((t.h * Math.PI) / 180);
  s.shells.push({ x: t.x + 1.6 * c, z: t.z + 1.6 * z, vx: 15 * c, vz: 15 * z, owner: name, bounces: 0 });
  t.last = s.time; t.shots++;
  return true;
}

function playerControl(keys) {
  const k = (...a) => (a.some((x) => keys.has(x)) ? 1 : 0);
  return { fwd: k('w', 'arrowup') - k('s', 'arrowdown'), turn: k('d', 'arrowright') - k('a', 'arrowleft'), fire: keys.has(' ') };
}

function drive(s, name, c, dt) {
  const t = s.tanks[name], o = s.tanks[OTHER[name]];
  t.h = (((t.h + c.turn * 120 * dt) % 360) + 360) % 360;
  const d = c.fwd * (c.fwd > 0 ? 6 : 4) * dt, rad = (t.h * Math.PI) / 180, ox = t.x, oz = t.z;
  t.x += Math.cos(rad) * d; t.z += Math.sin(rad) * d;
  t.x = Math.max(-(HALF_X - R), Math.min(HALF_X - R, t.x));
  t.z = Math.max(-(HALF_Z - R), Math.min(HALF_Z - R, t.z));
  for (const w of WALLS) pushOut(t, R, w);
  const dx = t.x - o.x, dz = t.z - o.z, dist = Math.hypot(dx, dz);
  if (dist < 2 * R && dist > 1e-9) { t.x = o.x + (dx / dist) * 2 * R; t.z = o.z + (dz / dist) * 2 * R; }
  // Wedged between a wall and the other tank, the tank push can land in a wall: then it does not move.
  if (WALLS.some((w) => rectDist(w, t.x, t.z) < R - 1e-6) || Math.abs(t.x) > HALF_X - R + 1e-6 || Math.abs(t.z) > HALF_Z - R + 1e-6) {
    t.x = ox; t.z = oz;
  }
}

/** Distance from (px,pz) to the segment (ax,az)-(bx,bz). */
function segDist(ax, az, bx, bz, px, pz) {
  const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz;
  const k = l2 ? Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / l2)) : 0;
  return Math.hypot(ax + k * vx - px, az + k * vz - pz);
}

/** Wall contacts of a shell: pushes it out and returns the contact normals. */
function wallContacts(sh) {
  const ns = [];
  if (sh.x > HALF_X - SR) { sh.x = HALF_X - SR; ns.push([-1, 0]); }
  if (sh.x < SR - HALF_X) { sh.x = SR - HALF_X; ns.push([1, 0]); }
  if (sh.z > HALF_Z - SR) { sh.z = HALF_Z - SR; ns.push([0, -1]); }
  if (sh.z < SR - HALF_Z) { sh.z = SR - HALF_Z; ns.push([0, 1]); }
  for (const w of WALLS) { const n = pushOut(sh, SR, w); if (n) ns.push(n); }
  return ns;
}

const SUB = 25; // substeps per step: a shell moves 0.01 units between wall checks, so it cannot skip a corner

/** Moves a shell one substep; returns false once it is gone. */
function moveShell(s, sh, dt) {
  const ox = sh.x, oz = sh.z;
  sh.x += sh.vx * dt; sh.z += sh.vz * dt;
  const ns = wallContacts(sh);
  if (ns.length) {
    if (sh.bounces) return false;
    sh.bounces = 1;
    for (const [nx, nz] of ns) { const d = sh.vx * nx + sh.vz * nz; sh.vx -= 2 * d * nx; sh.vz -= 2 * d * nz; }
  }
  for (const n of NAMES) {
    const t = s.tanks[n];
    if (segDist(ox, oz, sh.x, sh.z, t.x, t.z) <= R + SR + 1e-9) { // the whole path, touching included
      t.health = Math.max(0, t.health - 25);
      s.hits.push({ x: sh.x, z: sh.z });
      return false;
    }
  }
  return true;
}

function stepShells(s, dt) {
  s.shells = s.shells.filter((sh) => {
    for (let i = 0; i < SUB; i++) if (!moveShell(s, sh, dt / SUB)) return false;
    return true;
  });
}

/** One fixed step of the game; `keys` is the set of held keys. */
export function step(s, keys) {
  s.time += DT;
  if (s.state === 'round_over') {
    if (--s.overSteps <= 0) startRound(s, s.round + 1);
    return;
  }
  const ctl = { player: playerControl(keys), computer: s.ai ? aiControl(s, DT) : IDLE };
  for (const n of NAMES) drive(s, n, ctl[n], DT);
  for (const n of NAMES) if (ctl[n].fire) fire(s, n);
  stepShells(s, DT);
  const loser = NAMES.find((n) => s.tanks[n].health <= 0);
  if (loser) {
    s.winner = OTHER[loser]; s.score[s.winner]++; s.state = 'round_over'; s.overSteps = 120;
  }
}
