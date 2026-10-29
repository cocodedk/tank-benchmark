// The WebMCP tools: describe, pause, step, place, fire, set_ai, reset.
import { DT, newGame, step, place, fire, stateOf, isTank } from './sim.js';

const bad = error => ({ ok: false, error });
const tank = { type: 'string', enum: ['player', 'computer'] };

export function registerTools(game, controls) {
  const mc = document.modelContext;
  if (!mc) return;
  const tools = [
    ['describe', 'Reads the game: arena, walls, tanks, shells, score, round and state.', {}, () => stateOf(game)],
    ['pause', 'Pauses or resumes real-time play.', { paused: { type: 'boolean' } }, ({ paused }) => {
      if (typeof paused !== 'boolean') return bad('paused must be true or false');
      game.paused = paused;
      return { ok: true, paused };
    }],
    ['step', 'While paused, advances the game by seconds (0 < seconds <= 30) in 1/60 s steps, reading the held keys.',
      { seconds: { type: 'number' } }, ({ seconds }) => {
        if (!game.paused) return bad('step works only while paused');
        if (typeof seconds !== 'number' || !(seconds > 0 && seconds <= 30)) return bad('seconds must be more than 0 and at most 30');
        // Carry the part of a step left over, so many short calls add up like one long one.
        game.owed = (game.owed ?? 0) + seconds;
        const n = Math.floor(game.owed / DT + 1e-6);
        game.owed -= n * DT;
        for (let i = 0; i < n; i++) step(game, controls());
        return stateOf(game);
      }],
    ['place', 'Moves a tank to x, z with a heading in degrees, unless the spot is in a wall, on the other tank or outside.',
      { tank, x: { type: 'number' }, z: { type: 'number' }, heading: { type: 'number' } },
      ({ tank: who, x, z, heading }) => {
        const error = place(game, who, x, z, heading);
        return error ? bad(error) : stateOf(game);
      }],
    ['fire', 'Fires a shell from a tank, as Space does.', { tank }, ({ tank: who }) =>
      isTank(who) ? { ok: true, fired: fire(game, who) } : bad('tank must be "player" or "computer"')],
    ['set_ai', "Switches the computer's driving and firing on or off.", { enabled: { type: 'boolean' } }, ({ enabled }) => {
      if (typeof enabled !== 'boolean') return bad('enabled must be true or false');
      game.ai = enabled;
      return { ok: true, ai: enabled };
    }],
    ['reset', 'Starts a new game: round 1, score 0 to 0, start positions; pause and AI stay.', {}, () => stateOf(newGame(game))],
  ];
  for (const [name, description, properties, run] of tools) {
    const inputSchema = { type: 'object', properties, required: Object.keys(properties) };
    mc.registerTool({ name, description, inputSchema, execute: async input => {
      try {
        return run(input ?? {});
      } catch (e) {
        return bad(String(e));
      }
    } });
  }
}
