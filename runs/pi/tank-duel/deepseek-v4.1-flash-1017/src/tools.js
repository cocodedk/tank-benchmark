import { STEP } from './constants.js';

const fail = (error) => ({ ok: false, error });
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function guard(run) {
  return async (raw) => {
    try {
      if (!isObject(raw)) return fail('input must be an object');
      return await run(raw);
    } catch (error) {
      return fail(error && error.message ? error.message : String(error));
    }
  };
}

function tankName(value) {
  return value === 'player' || value === 'computer';
}

function toolDefinitions(game, input, changed) {
  return [
    {
      name: 'describe',
      description: 'Read the current Tank Duel state: arena, inner walls, both tanks, shells, score, round, game state, pause flag and whether the computer AI is on. Changes nothing.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: guard(async () => game.describe()),
    },
    {
      name: 'pause',
      description: 'Pause or resume real-time play. While paused the tanks only move when the step tool is called.',
      inputSchema: {
        type: 'object',
        properties: { paused: { type: 'boolean' } },
        required: ['paused'],
        additionalProperties: false,
      },
      execute: guard(async (payload) => {
        if (typeof payload.paused !== 'boolean') return fail('paused must be true or false');
        game.paused = payload.paused;
        changed();
        return { ok: true, paused: game.paused };
      }),
    },
    {
      name: 'step',
      description: 'Only while paused: advance the game by that many seconds in fixed 1/60 s steps, using the keys held now. Seconds must be more than 0 and at most 30.',
      inputSchema: {
        type: 'object',
        properties: { seconds: { type: 'number', exclusiveMinimum: 0, maximum: 30 } },
        required: ['seconds'],
        additionalProperties: false,
      },
      execute: guard(async (payload) => {
        const seconds = payload.seconds;
        if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0 || seconds > 30) {
          return fail('seconds must be a number greater than 0 and at most 30');
        }
        if (!game.paused) return fail('pause the game before stepping');
        const steps = Math.floor(seconds / STEP + 1e-9);
        for (let i = 0; i < steps; i += 1) game.tick(input.held, input.consumeFire());
        changed();
        return game.describe();
      }),
    },
    {
      name: 'place',
      description: 'Move one tank to an arena position and heading, in degrees. Refuses a spot that is outside the arena, inside a wall or overlapping the other tank. Returns the state.',
      inputSchema: {
        type: 'object',
        properties: {
          tank: { type: 'string', enum: ['player', 'computer'] },
          x: { type: 'number' },
          z: { type: 'number' },
          heading: { type: 'number' },
        },
        required: ['tank', 'x', 'z', 'heading'],
        additionalProperties: false,
      },
      execute: guard(async (payload) => {
        if (!tankName(payload.tank)) return fail('tank must be "player" or "computer"');
        const error = game.place(payload.tank, payload.x, payload.z, payload.heading);
        if (error) return fail(error);
        changed();
        return game.describe();
      }),
    },
    {
      name: 'fire',
      description: 'Fire one shell for that tank, exactly as Space does. fired is false while the 0.5 s cooldown runs, while three of that tank\'s shells are in flight, or between rounds.',
      inputSchema: {
        type: 'object',
        properties: { tank: { type: 'string', enum: ['player', 'computer'] } },
        required: ['tank'],
        additionalProperties: false,
      },
      execute: guard(async (payload) => {
        if (!tankName(payload.tank)) return fail('tank must be "player" or "computer"');
        const fired = game.fire(payload.tank);
        changed();
        return { ok: true, fired };
      }),
    },
    {
      name: 'set_ai',
      description: 'Switch the computer\'s driving and firing on or off. The AI does not move while it is off.',
      inputSchema: {
        type: 'object',
        properties: { enabled: { type: 'boolean' } },
        required: ['enabled'],
        additionalProperties: false,
      },
      execute: guard(async (payload) => {
        if (typeof payload.enabled !== 'boolean') return fail('enabled must be true or false');
        game.setAI(payload.enabled);
        changed();
        return { ok: true, ai: game.aiEnabled };
      }),
    },
    {
      name: 'reset',
      description: 'Start a new game: round 1, score 0 to 0, start positions, full health and no shells. Pause and AI settings stay as they are. Returns the state.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      execute: guard(async () => {
        input.consumeFire();
        game.reset();
        changed();
        return game.describe();
      }),
    },
  ];
}

/** Register the tools when the browser has WebMCP; otherwise the game just plays. */
export function registerTools(game, input, changed = () => {}) {
  const registry = document.modelContext;
  if (!registry) return;

  for (const tool of toolDefinitions(game, input, changed)) {
    try {
      const result = registry.registerTool(tool);
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {
      // One refused tool must not stop the others from registering.
    }
  }
}
