// The WebMCP tools: the same moves the keyboard makes, plus reading, pausing and stepping the game.
import { game, step, snapshot, reset, fire, fits, DT } from './sim.js';

const NAMES = ['player', 'computer'];
const bad = error => ({ ok: false, error });
const num = v => typeof v === 'number' && Number.isFinite(v);
const tankSchema = { type: 'string', enum: NAMES };

export function registerTools(keys) {
  const mc = document.modelContext;
  if (!mc) return;
  const tools = [
    ['describe', 'Reads the whole game: arena, walls, tanks, shells, score, round, state, pause and AI.', {}, () => snapshot()],
    ['pause', 'Pauses (true) or resumes (false) real-time play.', { paused: { type: 'boolean' } }, ({ paused }) => {
      if (typeof paused !== 'boolean') return bad('paused must be true or false');
      game.paused = paused;
      return { ok: true, paused };
    }],
    ['step', 'Only while paused: advances the game by seconds (more than 0, at most 30) in 1/60 s steps, reading the keys held now.',
      { seconds: { type: 'number', exclusiveMinimum: 0, maximum: 30 } }, ({ seconds }) => {
        if (!num(seconds) || seconds <= 0 || seconds > 30) return bad('seconds must be a number more than 0 and at most 30');
        if (!game.paused) return bad('step works only while paused; call pause first');
        for (let i = Math.max(1, Math.round(seconds / DT)); i > 0; i--) step(keys());
        return snapshot();
      }],
    ['place', 'Moves a tank (player or computer) to x, z with a heading in degrees; refuses spots in a wall, on the other tank or outside the arena.',
      { tank: tankSchema, x: { type: 'number' }, z: { type: 'number' }, heading: { type: 'number' } }, ({ tank, x, z, heading }) => {
        if (!NAMES.includes(tank)) return bad('tank must be "player" or "computer"');
        if (!num(x) || !num(z)) return bad('x and z must be numbers');
        if (heading !== undefined && !num(heading)) return bad('heading must be a number of degrees');
        if (!fits(tank, x, z)) return bad('that spot is inside a wall, on the other tank or outside the arena');
        const t = game.tanks[tank];
        Object.assign(t, { x, z, heading: ((heading ?? t.heading) % 360 + 360) % 360 });
        return snapshot();
      }],
    ['fire', 'Fires a shell from that tank, as Space does; fired is false while it must wait or has 3 shells out.',
      { tank: tankSchema }, ({ tank }) => NAMES.includes(tank) ? { ok: true, fired: fire(tank) } : bad('tank must be "player" or "computer"')],
    ['set_ai', "Switches the computer's own driving and firing on (true) or off (false).", { enabled: { type: 'boolean' } }, ({ enabled }) => {
      if (typeof enabled !== 'boolean') return bad('enabled must be true or false');
      game.ai = enabled;
      return { ok: true, ai: enabled };
    }],
    ['reset', 'Starts a new game: round 1, score 0 to 0, start positions, full health, no shells; pause and AI stay.', {}, () => (reset(), snapshot())],
  ];
  for (const [name, description, properties, run] of tools) {
    const execute = async input => {
      try {
        if (typeof input === 'string') input = JSON.parse(input);
        return run(input && typeof input === 'object' ? input : {});
      } catch (e) {
        return bad(String(e?.message || e));
      }
    };
    const warn = e => console.warn(`WebMCP tool ${name} not registered`, e);
    try {
      Promise.resolve(mc.registerTool({ name, description, inputSchema: { type: 'object', properties }, execute })).catch(warn);
    } catch (e) {
      warn(e);
    }
  }
}
