// The computer's control for one step: {drive, turn, fire}.
import { R_SHELL, segBlocked, insideArena, clearOfWalls } from './collide.js';

const deg = (r) => (r * 180) / Math.PI;
const diffTo = (t, x, z) => {
  const d = deg(Math.atan2(z - t.z, x - t.x)) - t.heading;
  return ((((d + 180) % 360) + 360) % 360) - 180;
};
const turnFor = (diff) => Math.max(-1, Math.min(1, diff / 2));

function waypoint(c, p) {
  let best = null, bd = Infinity;
  for (let x = -18; x <= 18; x += 2) {
    for (let z = -14; z <= 14; z += 2) {
      const d = Math.hypot(x - c.x, z - c.z);
      if (d >= bd || !insideArena(x, z) || !clearOfWalls(x, z)) continue;
      if (Math.hypot(x - p.x, z - p.z) < 2.4) continue;
      // sight with a margin, so a tank that stops within 0.5 of the waypoint still sees the player
      if (segBlocked(x, z, p.x, p.z, R_SHELL + 0.55) ||segBlocked(c.x, c.z, x, z, 1.3)) continue;
      best = { x, z };
      bd = d;
    }
  }
  return best;
}

export function think(s) {
  const c = s.tanks.computer, p = s.tanks.player;
  if (s.state !== 'playing') return { drive: 0, turn: 0, fire: false };
  if (!segBlocked(c.x, c.z, p.x, p.z, R_SHELL)) {
    const diff = diffTo(c, p.x, p.z);
    return { drive: 0, turn: turnFor(diff), fire: Math.abs(diff) < 3 };
  }
  const w = waypoint(c, p);
  if (!w || Math.hypot(w.x - c.x, w.z - c.z) < 0.5) return { drive: 0, turn: 0, fire: false };
  const diff = diffTo(c, w.x, w.z);
  return { drive: Math.abs(diff) < 30 ? 1 : 0, turn: turnFor(diff), fire: false };
}
