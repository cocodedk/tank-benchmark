import { DT } from './constants.js';

const given = (input) => (input && typeof input === 'object' && !Array.isArray(input) ? input : {});
const refuse = (error) => ({ ok: false, error });
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const isTank = (value) => value === 'player' || value === 'computer';

function definitions(game) {
  return [
    {
      name: 'describe',
      description: 'Read the whole game: arena, walls, tanks, shells, score, round, state, pause and AI.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      execute: async () => game.describe(),
    },
    {
      name: 'pause',
      description: 'Pause or resume real-time play. The game still advances through the step tool while paused.',
      inputSchema: {
        type: 'object',
        properties: { paused: { type: 'boolean', description: 'True to pause, false to resume.' } },
        required: ['paused'],
      },
      execute: async (input) => {
        const { paused } = given(input);
        if (typeof paused !== 'boolean') return refuse('paused must be a boolean');
        game.paused = paused;
        return { ok: true, paused };
      },
    },
    {
      name: 'step',
      description: 'Only while paused: advance the game by the given seconds in 1/60 s steps, reading currently held keys.',
      inputSchema: {
        type: 'object',
        properties: { seconds: { type: 'number', description: 'More than 0 and at most 30.' } },
        required: ['seconds'],
      },
      execute: async (input) => {
        const { seconds } = given(input);
        if (!game.paused) return refuse('step requires the game to be paused');
        if (!isNumber(seconds) || seconds <= 0 || seconds > 30) {
          return refuse('seconds must be a number more than 0 and at most 30');
        }
        const count = Math.round(seconds / DT);
        for (let i = 0; i < count; i += 1) game.step(DT);
        return game.describe();
      },
    },
    {
      name: 'place',
      description: 'Move a tank to a position and heading. Refuses a spot in a wall, on the other tank, or outside the arena.',
      inputSchema: {
        type: 'object',
        properties: {
          tank: { type: 'string', description: 'player or computer' },
          x: { type: 'number' },
          z: { type: 'number' },
          heading: { type: 'number', description: 'Degrees; 0 faces +x and 90 faces +z.' },
        },
        required: ['tank', 'x', 'z', 'heading'],
      },
      execute: async (input) => {
        const { tank, x, z, heading } = given(input);
        if (!isTank(tank)) return refuse('tank must be player or computer');
        if (!isNumber(x) || !isNumber(z) || !isNumber(heading)) {
          return refuse('x, z and heading must be numbers');
        }
        const error = game.place(tank, x, z, heading);
        if (error) return refuse(error);
        return game.describe();
      },
    },
    {
      name: 'fire',
      description: 'Fire a shell from a tank. fired is false while it is reloading or already has three shells out.',
      inputSchema: {
        type: 'object',
        properties: { tank: { type: 'string', description: 'player or computer' } },
        required: ['tank'],
      },
      execute: async (input) => {
        const { tank } = given(input);
        if (!isTank(tank)) return refuse('tank must be player or computer');
        return { ok: true, fired: game.fire(tank) };
      },
    },
    {
      name: 'set_ai',
      description: "Switch the computer's driving and firing on or off.",
      inputSchema: {
        type: 'object',
        properties: { enabled: { type: 'boolean' } },
        required: ['enabled'],
      },
      execute: async (input) => {
        const { enabled } = given(input);
        if (typeof enabled !== 'boolean') return refuse('enabled must be a boolean');
        game.ai = enabled;
        return { ok: true, ai: enabled };
      },
    },
    {
      name: 'reset',
      description: 'Start a new game: round 1, score 0 to 0, start positions, full health, no shells. Pause and AI stay as they are.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => {
        game.reset();
        return game.describe();
      },
    },
  ];
}

export async function initWebMcp(game) {
  const registry = document.modelContext;
  if (!registry || typeof registry.registerTool !== 'function') return [];
  const wanted = definitions(game);
  await Promise.all(wanted.map((tool) => Promise.resolve()
    .then(() => registry.registerTool(tool))
    .catch(() => {})));
  const held = await Promise.resolve().then(() => registry.getTools()).catch(() => []);
  const names = new Set(wanted.map((tool) => tool.name));
  return (Array.isArray(held) ? held : [])
    .map((tool) => tool && tool.name)
    .filter((name) => names.has(name));
}
