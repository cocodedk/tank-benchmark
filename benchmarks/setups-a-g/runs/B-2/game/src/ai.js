import { TANK_R, SHELL_R, WALLS, lineClear, wallDist } from './arena.js';

const norm180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
const aim = (t, x, z) => norm180((Math.atan2(z - t.z, x - t.x) * 180) / Math.PI - t.heading);

// Would a shell fired now, along the real heading, reach the player without touching a wall first?
function shotLands(c, p) {
  const ux = Math.cos((c.heading * Math.PI) / 180), uz = Math.sin((c.heading * Math.PI) / 180);
  const along = (p.x - c.x) * ux + (p.z - c.z) * uz;
  const off = Math.abs((p.x - c.x) * uz - (p.z - c.z) * ux);
  return along > 0 && off < TANK_R && lineClear(c.x, c.z, c.x + ux * along, c.z + uz * along, SHELL_R);
}

function turn(inp, err) {
  if (err > 1) inp.right = true;
  else if (err < -1) inp.left = true;
}

// Nearest grid point that sees the player and is reachable; else the reachable one closest to the player.
function plan(c, p) {
  let best = null, bd = Infinity, fall = null, fd = Infinity;
  for (let x = -18.5; x <= 18.5; x++) {
    for (let z = -13.5; z <= 13.5; z++) {
      if (WALLS.some((w) => wallDist(x, z, w) < 1.5) || !lineClear(c.x, c.z, x, z, 1.4)) continue;
      const dp = Math.hypot(x - p.x, z - p.z);
      if (dp <= 2.6) continue;
      // wider than the firing check, so stopping within 0.5 of the point still sees the player
      if (lineClear(x, z, p.x, p.z, 0.9)) {
        const d = Math.hypot(x - c.x, z - c.z);
        if (d < bd) { bd = d; best = { x, z }; }
      } else if (dp < fd) { fd = dp; fall = { x, z }; }
    }
  }
  return best || fall;
}

export function aiInput(g) {
  const c = g.tanks.computer, p = g.tanks.player, inp = {};
  if (lineClear(c.x, c.z, p.x, p.z, 0.6)) {
    const err = aim(c, p.x, p.z);
    turn(inp, err);
    if (g.tick - c.lastShot >= 60 && shotLands(c, p)) inp.fire = true;
    g.aiWp = null;
    return inp;
  }
  if (!g.aiWp || g.tick >= g.aiPlan) {
    g.aiWp = plan(c, p);
    g.aiPlan = g.tick + 30;
  }
  const wp = g.aiWp;
  if (wp && Math.hypot(wp.x - c.x, wp.z - c.z) > 0.5) {
    const err = aim(c, wp.x, wp.z);
    turn(inp, err);
    if (Math.abs(err) < 20) inp.forward = true;
  }
  return inp;
}
