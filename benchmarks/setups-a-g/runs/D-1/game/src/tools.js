import { resetGame, snapshot, step } from './game.js';
import { DT } from './config.js';
import { fire, other, spotFree, wrap } from './tank.js';

const TANKS = ['player', 'computer'];
const fail = (error) => ({ ok: false, error });
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const tankProp = { type: 'string', enum: TANKS, description: 'player or computer' };

/** Register the game's WebMCP tools. Silent when the browser has no document.modelContext. */
export function registerTools(g) {
  const mc = document.modelContext;
  if (!mc) return;
  const tools = [
    ['describe', 'Read the game: arena, walls, both tanks, shells, score, round, state, pause and AI.', {}, () => snapshot(g)],
    ['pause', 'Pause or resume real-time play.', { paused: { type: 'boolean' } }, ({ paused }) => {
      if (typeof paused !== 'boolean') return fail('paused must be true or false');
      g.paused = paused;
      return { ok: true, paused };
    }],
    ['step', 'Only while paused: advance the game by this many seconds (more than 0, at most 30) in 1/60 s steps, reading the keys held now.',
      { seconds: { type: 'number', exclusiveMinimum: 0, maximum: 30 } }, ({ seconds }) => {
        if (!g.paused) return fail('the game is not paused');
        if (!num(seconds) || seconds <= 0 || seconds > 30) return fail('seconds must be more than 0 and at most 30');
        g.owed = (g.owed ?? 0) + seconds / DT; // part-steps carry over to the next call
        const steps = Math.floor(g.owed + 1e-6);
        g.owed -= steps;
        for (let i = 0; i < steps; i++) step(g);
        return snapshot(g);
      }],
    ['place', 'Move a tank to x, z with a heading in degrees; refuses a spot inside a wall, overlapping the other tank or outside the arena.',
      { tank: tankProp, x: { type: 'number' }, z: { type: 'number' }, heading: { type: 'number' } }, ({ tank, x, z, heading }) => {
        if (!TANKS.includes(tank)) return fail('tank must be player or computer');
        if (!num(x) || !num(z) || !num(heading)) return fail('x, z and heading must be numbers');
        if (!spotFree(g, tank, x, z)) return fail('that spot is inside a wall, outside the arena or overlaps the other tank');
        Object.assign(g.tanks[tank], { x, z, heading: wrap(heading) });
        return snapshot(g);
      }],
    ['fire', 'Fire a shell from a tank, as Space does; fired is false while the tank must wait or has 3 shells out.',
      { tank: tankProp }, ({ tank }) => (TANKS.includes(tank) ? { ok: true, fired: fire(g, tank) } : fail('tank must be player or computer'))],
    ['set_ai', 'Switch the computer\'s driving and firing on or off.', { enabled: { type: 'boolean' } }, ({ enabled }) => {
      if (typeof enabled !== 'boolean') return fail('enabled must be true or false');
      g.ai = enabled;
      return { ok: true, ai: enabled };
    }],
    ['reset', 'Start a new game: round 1, score 0 to 0, start positions, full health, no shells; pause and AI stay as they are.', {}, () => {
      resetGame(g);
      return snapshot(g);
    }],
  ];
  for (const [name, description, properties, run] of tools) {
    mc.registerTool({
      name,
      description,
      inputSchema: { type: 'object', properties },
      execute: async (input) => {
        try {
          return run(input && typeof input === 'object' ? input : {});
        } catch (e) {
          return fail(String(e));
        } finally {
          g.dirty = true;
        }
      },
    }).catch(() => {});
  }
}
