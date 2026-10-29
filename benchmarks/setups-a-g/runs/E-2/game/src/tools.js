// WebMCP tools: each answers a JSON object and never throws.
import { game, describe, step, place, fire, reset, DT } from './game.js';

const EMPTY = { type: 'object', properties: {}, required: [] };
const TANK = { type: 'string', enum: ['player', 'computer'] };
const bad = error => ({ ok: false, error });
const isNum = v => typeof v === 'number' && Number.isFinite(v);
const isTank = n => n === 'player' || n === 'computer';
const obj = input => (input && typeof input === 'object' && !Array.isArray(input) ? input : {});

const TOOLS = [
  ['describe', 'Reads the game: arena, inner walls, both tanks, shells in flight, score, round, state, pause and AI.',
    EMPTY, () => describe(), { readOnlyHint: true }],
  ['pause', 'Pauses ({"paused": true}) or resumes ({"paused": false}) real-time play.',
    { type: 'object', properties: { paused: { type: 'boolean' } }, required: ['paused'] },
    ({ paused }) => typeof paused !== 'boolean' ? bad('paused must be true or false')
      : (game.paused = paused, { ok: true, paused })],
  ['step', 'Only while paused: advances the game by the given seconds (more than 0, at most 30) in 1/60 s steps, reading the keys held now; answers the state.',
    { type: 'object', properties: { seconds: { type: 'number', exclusiveMinimum: 0, maximum: 30 } }, required: ['seconds'] },
    ({ seconds }) => {
      if (!game.paused) return bad('pause the game first');
      if (!isNum(seconds) || seconds <= 0 || seconds > 30) return bad('seconds must be more than 0 and at most 30');
      for (let n = Math.max(1, Math.round(seconds / DT)); n > 0; n--) step();
      return describe();
    }],
  ['place', 'Moves a tank ("player" or "computer") to x, z with a heading in degrees; refuses a spot inside a wall, overlapping the other tank or outside the arena. Answers the state.',
    { type: 'object', properties: { tank: TANK, x: { type: 'number' }, z: { type: 'number' }, heading: { type: 'number' } },
      required: ['tank', 'x', 'z', 'heading'] },
    ({ tank, x, z, heading }) => {
      if (!isTank(tank)) return bad('tank must be "player" or "computer"');
      if (![x, z, heading].every(isNum)) return bad('x, z and heading must be numbers');
      const error = place(tank, x, z, heading);
      return error ? bad(error) : describe();
    }],
  ['fire', 'Fires a shell from that tank, as Space does; fired is false while it must wait 0.5 s or has 3 shells out.',
    { type: 'object', properties: { tank: TANK }, required: ['tank'] },
    ({ tank }) => isTank(tank) ? { ok: true, fired: fire(tank) } : bad('tank must be "player" or "computer"')],
  ['set_ai', 'Switches the computer\'s own driving and firing on or off.',
    { type: 'object', properties: { enabled: { type: 'boolean' } }, required: ['enabled'] },
    ({ enabled }) => typeof enabled !== 'boolean' ? bad('enabled must be true or false')
      : (game.ai = enabled, { ok: true, ai: enabled })],
  ['reset', 'Starts a new game: round 1, score 0 to 0, start positions, full health, no shells; pause and AI stay as they are. Answers the state.',
    EMPTY, () => (reset(), describe())],
];

export function registerTools() {
  const mc = document.modelContext;
  if (!mc) return;
  for (const [name, description, inputSchema, run, annotations] of TOOLS) {
    const execute = async input => {
      try { return run(obj(input)); } catch (e) { return bad(String(e)); }
    };
    try {
      mc.registerTool({ name, description, inputSchema, execute, annotations }).catch(() => {});
    } catch { /* one refused tool must not stop the rest */ }
  }
}
