// WebMCP tools. Registers nothing when document.modelContext is absent.
import { WALLS, HALF_X, HALF_Z, R, rectDist } from './geom.js';
import { NAMES, OTHER, fire, resetGame } from './sim.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const norm = (h) => { const r = ((h % 360) + 360) % 360; return r >= 360 ? 0 : r; };
const bad = (error) => ({ ok: false, error });
const TANK = { type: 'string', enum: NAMES };

export function registerTools({ sim: s, ctl, stepOnce }) {
  const mc = document.modelContext;
  if (!mc) return;

  const state = () => ({
    ok: true, arena: { width: 2 * HALF_X, depth: 2 * HALF_Z }, walls: WALLS.map((w) => ({ ...w })),
    tanks: Object.fromEntries(NAMES.map((n) => { const t = s.tanks[n]; return [n, { x: t.x, z: t.z, heading: norm(t.h), health: t.health, shots: t.shots }]; })),
    shells: s.shells.map(({ x, z, owner, bounces }) => ({ x, z, owner, bounces })),
    score: { ...s.score }, round: s.round, state: s.state, paused: ctl.paused, ai: s.ai,
  });
  const tankName = (i) => (NAMES.includes(i.tank) ? null : bad('tank must be "player" or "computer"'));

  const defs = [
    ['describe', 'Read the whole game state.', {}, () => state()],
    ['pause', 'Pause or resume real-time play.', { paused: { type: 'boolean' } }, (i) =>
      typeof i.paused !== 'boolean' ? bad('paused must be a boolean') : ((ctl.paused = i.paused), { ok: true, paused: ctl.paused })],
    ['step', 'While paused, advance the game by that many seconds (more than 0, at most 30) using the held keys.',
      { seconds: { type: 'number' } }, (i) => {
        if (!ctl.paused) return bad('step only works while paused');
        if (!isNum(i.seconds) || i.seconds <= 0 || i.seconds > 30) return bad('seconds must be a number > 0 and <= 30');
        for (let n = Math.round(i.seconds * 60); n > 0; n--) stepOnce();
        return state();
      }],
    ['place', 'Move a tank to x, z with a heading in degrees; refuses walls, the other tank and the outside.',
      { tank: TANK, x: { type: 'number' }, z: { type: 'number' }, heading: { type: 'number' } }, (i) => {
        const e = tankName(i);
        if (e) return e;
        const h = i.heading;
        if (![i.x, i.z, h].every(isNum)) return bad('x, z and heading must be finite numbers');
        if (Math.abs(i.x) > HALF_X - R || Math.abs(i.z) > HALF_Z - R) return bad('outside the arena');
        if (WALLS.some((w) => rectDist(w, i.x, i.z) < R - 1e-9)) return bad('overlaps a wall');
        const o = s.tanks[OTHER[i.tank]];
        if (Math.hypot(i.x - o.x, i.z - o.z) < 2 * R - 1e-9) return bad('overlaps the other tank');
        Object.assign(s.tanks[i.tank], { x: i.x, z: i.z, h: norm(h) });
        return state();
      }],
    ['fire', 'Fire the tank\'s gun as Space does.', { tank: TANK }, (i) => tankName(i) || { ok: true, fired: fire(s, i.tank) }],
    ['set_ai', 'Switch the computer\'s driving and firing on or off.', { enabled: { type: 'boolean' } }, (i) =>
      typeof i.enabled !== 'boolean' ? bad('enabled must be a boolean') : ((s.ai = i.enabled), { ok: true, ai: s.ai })],
    ['reset', 'Start a new game: round 1, score 0-0, start positions; pause and AI stay.', {}, () => { resetGame(s); return state(); }],
  ];

  for (const [name, description, properties, run] of defs) {
    try {
      mc.registerTool({
        name, description, inputSchema: { type: 'object', properties },
        execute: (input) => {
          ctl.dirty = true;
          try {
            if (typeof input === 'string') { try { input = JSON.parse(input); } catch { input = {}; } }
            return run(isObj(input) ? input : {});
          } catch (err) { return bad(String((err && err.message) || err)); }
        },
      });
    } catch (err) { console.warn('registerTool failed', name, err); }
  }
}
