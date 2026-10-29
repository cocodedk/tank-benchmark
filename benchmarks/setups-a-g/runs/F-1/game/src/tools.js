// WebMCP tools. Registered only when document.modelContext exists.
import { s, stepOnce, fire, place, reset, state } from './sim.js';
import { blocked, TANK_R } from './world.js';

const TANKS = ['player', 'computer'];
const num = v => typeof v === 'number' && Number.isFinite(v);
const fail = error => ({ ok: false, error });
const tankProp = { type: 'string', enum: TANKS, description: 'player or computer' };

function tankError(tank) {
  return TANKS.includes(tank) ? null : 'tank must be "player" or "computer"';
}

export function registerTools(keys) {
  const mc = document.modelContext;
  if (!mc) return;
  const add = (name, description, properties, required, run) => mc.registerTool({
    name, description,
    inputSchema: { type: 'object', properties, required },
    execute: async (input = {}) => {
      try { return JSON.stringify(run(input ?? {})); } catch (e) { return JSON.stringify(fail(String(e))); }
    },
  });

  add('describe', 'Read the whole game: arena, walls, tanks, shells, score, round, state, pause and AI flags.', {}, [], state);
  add('pause', 'Pause or resume real-time play.', { paused: { type: 'boolean' } }, ['paused'], ({ paused }) => {
    if (typeof paused !== 'boolean') return fail('paused must be a boolean');
    s.paused = paused;
    return { ok: true, paused };
  });
  add('step', 'While paused, advance the game by that many seconds in 1/60 s steps, reading the keys held now.',
    { seconds: { type: 'number', exclusiveMinimum: 0, maximum: 30 } }, ['seconds'], ({ seconds }) => {
      if (!num(seconds) || seconds <= 0 || seconds > 30) return fail('seconds must be more than 0 and at most 30');
      if (!s.paused) return fail('step works only while paused');
      for (let i = Math.max(1, Math.round(seconds * 60)); i > 0; i--) stepOnce(keys);
      return state();
    });
  add('place', 'Move a tank to a spot and heading in degrees, refusing walls, the other tank and the outside.',
    { tank: tankProp, x: { type: 'number' }, z: { type: 'number' }, heading: { type: 'number' } },
    ['tank', 'x', 'z', 'heading'], ({ tank, x, z, heading }) => {
      if (tankError(tank)) return fail(tankError(tank));
      if (![x, z, heading].every(num)) return fail('x, z and heading must be numbers');
      if (blocked(x, z, TANK_R)) return fail('that spot is inside a wall or outside the arena');
      const o = s.tanks[tank === 'player' ? 'computer' : 'player'];
      if (Math.hypot(x - o.x, z - o.z) < 2 * TANK_R) return fail('that spot overlaps the other tank');
      place(tank, x, z, heading);
      return state();
    });
  add('fire', 'Fire a shell from that tank, as Space does.', { tank: tankProp }, ['tank'], ({ tank }) => {
    if (tankError(tank)) return fail(tankError(tank));
    return { ok: true, fired: fire(tank) };
  });
  add('set_ai', 'Switch the computer\'s driving and firing on or off.', { enabled: { type: 'boolean' } }, ['enabled'], ({ enabled }) => {
    if (typeof enabled !== 'boolean') return fail('enabled must be a boolean');
    s.ai = enabled;
    return { ok: true, ai: enabled };
  });
  add('reset', 'Start a new game: round 1, score 0 to 0, start positions, full health, no shells.', {}, [], () => {
    reset();
    return state();
  });
}
