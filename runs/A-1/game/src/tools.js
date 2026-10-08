// The WebMCP tools. Every answer is a JSON object; bad input answers { ok: false, error }.
import { advance, describe, fits, place, reset } from './game.js';
import { fire, NAMES } from './tank.js';

const TANK = { type: 'string', enum: NAMES, description: 'player or computer' };
const num = v => typeof v === 'number' && Number.isFinite(v);
const bad = error => ({ ok: false, error });

export function registerTools(game, controls) {
  const mc = document.modelContext;
  if (!mc) return;
  const add = (name, description, properties, required, run) => {
    const execute = async input => {
      try {
        return input && typeof input === 'object' && !Array.isArray(input) ? run(input) : bad('input must be an object');
      } catch (e) {
        return bad(String(e));
      } finally {
        game.dirty = true;
      }
    };
    mc.registerTool({ name, description, inputSchema: { type: 'object', properties, required }, execute,
      annotations: { readOnlyHint: name === 'describe' } }).catch(() => {});
  };
  const badTank = i => (NAMES.includes(i.tank) ? null : bad('tank must be "player" or "computer"'));

  add('describe', 'Read the game: arena, walls, both tanks, shells, score, round, state, paused and ai.',
    {}, [], () => describe(game));
  add('pause', 'Pause or resume real-time play.', { paused: { type: 'boolean' } }, ['paused'], i => {
    if (typeof i.paused !== 'boolean') return bad('paused must be true or false');
    game.paused = i.paused;
    return { ok: true, paused: game.paused };
  });
  add('step', 'Only while paused: advance the game by this many seconds (more than 0, at most 30) in 1/60 s steps, reading the keys held now.',
    { seconds: { type: 'number', exclusiveMinimum: 0, maximum: 30 } }, ['seconds'], i => {
      if (!game.paused) return bad('step works only while paused');
      if (!num(i.seconds) || i.seconds <= 0 || i.seconds > 30) return bad('seconds must be more than 0 and at most 30');
      advance(game, controls, i.seconds);
      return describe(game);
    });
  add('place', 'Move a tank to x, z (in the arena, clear of walls and the other tank) with a heading in degrees.',
    { tank: TANK, x: { type: 'number' }, z: { type: 'number' }, heading: { type: 'number' } }, ['tank', 'x', 'z', 'heading'], i => {
      if (badTank(i)) return badTank(i);
      if (![i.x, i.z, i.heading].every(num)) return bad('x, z and heading must be numbers');
      if (!fits(game, i.tank, i.x, i.z)) return bad('that spot is inside a wall, overlaps the other tank or is outside the arena');
      place(game, i.tank, i.x, i.z, i.heading);
      return describe(game);
    });
  add('fire', 'Fire a shell, as Space does. fired is false while the tank must wait or has 3 shells out.',
    { tank: TANK }, ['tank'], i => badTank(i) || { ok: true, fired: fire(game, i.tank) });
  add('set_ai', "Switch the computer's driving and firing on or off.",
    { enabled: { type: 'boolean' } }, ['enabled'], i => {
      if (typeof i.enabled !== 'boolean') return bad('enabled must be true or false');
      game.ai = i.enabled;
      return { ok: true, ai: game.ai };
    });
  add('reset', 'Start a new game: round 1, score 0 to 0, start positions, full health, no shells. Pause and AI stay as they are.',
    {}, [], () => { reset(game); return describe(game); });
}
