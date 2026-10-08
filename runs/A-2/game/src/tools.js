import { resetGame, tryFire, place, snapshot } from './game.js';

const fail = (error) => ({ ok: false, error });
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const isTank = (name) => name === 'player' || name === 'computer';
const TANK ={ type: 'string', enum: ['player', 'computer'] };

/** Registers the seven tools; `advance(seconds)` runs the game by that much, in fixed steps. */
export function registerTools(g, advance) {
  const mc = document.modelContext;
  if (!mc) return;
  const tools = [
    ['describe', 'Read the game: arena, walls, both tanks, shells, score, round, state, paused and ai.', {}, true,
      () => snapshot(g)],
    ['pause', 'Pause or resume real-time play.', { paused: { type: 'boolean' } }, false, ({ paused }) => {
      if (typeof paused !== 'boolean') return fail('paused must be true or false');
      g.paused = paused;
      return { ok: true, paused };
    }],
    ['step', 'While paused, advance the game by that many seconds (more than 0, at most 30) in 1/60 s steps, reading the keys held now.',
      { seconds: { type: 'number', exclusiveMinimum: 0, maximum: 30 } }, false, ({ seconds }) => {
        if (!g.paused) return fail('step works only while paused');
        if (!num(seconds) || seconds <= 0 || seconds > 30) return fail('seconds must be more than 0 and at most 30');
        advance(seconds);
        return snapshot(g);
      }],
    ['place', 'Move a tank (player or computer) to x, z with a heading in degrees; refused inside a wall, over the other tank or outside the arena.',
      { tank: TANK, x: { type: 'number' }, z: { type: 'number' }, heading: { type: 'number' } }, false, ({ tank, x, z, heading }) => {
        if (!isTank(tank)) return fail('tank must be "player" or "computer"');
        if (!num(x) || !num(z) || (heading !== undefined && !num(heading))) return fail('x, z and heading must be numbers');
        const refused = place(g, tank, x, z, heading);
        return refused ? fail(`cannot place there: ${refused}`) : snapshot(g);
      }],
    ['fire', 'Fire a shell from a tank, as Space does; fired is false while the tank must wait or has 3 shells out.',
      { tank: TANK }, false, ({ tank }) => (isTank(tank) ? { ok: true, fired: tryFire(g, tank) } : fail('tank must be "player" or "computer"'))],
    ['set_ai', 'Switch the computer\'s driving and firing on or off.', { enabled: { type: 'boolean' } }, false, ({ enabled }) => {
      if (typeof enabled !== 'boolean') return fail('enabled must be true or false');
      g.ai = enabled;
      return { ok: true, ai: enabled };
    }],
    ['reset', 'Start a new game: round 1, score 0 to 0, start positions, full health, no shells. Pause and AI stay as they are.', {}, false, () => {
      resetGame(g);
      return snapshot(g);
    }],
  ];
  for (const [name, description, properties, readOnlyHint, run] of tools) {
    const execute = async (input) => {
      try {
        g.tick++;
        return run(input && typeof input === 'object' ? input : {});
      } catch (e) {
        return fail(String(e));
      }
    };
    try {
      Promise.resolve(mc.registerTool({ name, description, inputSchema: { type: 'object', properties }, execute, annotations: { readOnlyHint } }))
        .catch(() => {});
    } catch {
      // one refused tool must not stop the rest
    }
  }
}
