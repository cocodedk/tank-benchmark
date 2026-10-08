import {NAMES} from './config.js';
import {resetGame, snapshot} from './game.js';
import {fire} from './shells.js';
import {stepGame} from './sim.js';
import {placeError} from './tanks.js';

const fail = error => ({ok: false, error});
const isNumber = v => typeof v === 'number' && Number.isFinite(v);
const tankSchema = {type: 'string', enum: NAMES};

/** Registers the WebMCP tools; does nothing when the browser has no document.modelContext. */
export function registerTools(g, input) {
  const tools = [
    {
      name: 'describe',
      description: 'Reads the game: arena, walls, both tanks, shells in flight, score, round, state, pause and AI.',
      inputSchema: {type: 'object', properties: {}},
      annotations: {readOnlyHint: true},
      run: () => snapshot(g),
    },
    {
      name: 'pause',
      description: 'Pauses or resumes real-time play; answers {ok, paused}.',
      inputSchema: {type: 'object', properties: {paused: {type: 'boolean'}}, required: ['paused']},
      run: ({paused}) => {
        if (typeof paused !== 'boolean') return fail('paused must be true or false');
        g.paused = paused;
        return {ok: true, paused};
      },
    },
    {
      name: 'step',
      description: 'Only while paused: advances the game by that many seconds in 1/60 s steps, reading the keys held now; answers the state.',
      inputSchema: {type: 'object', properties: {seconds: {type: 'number', exclusiveMinimum: 0, maximum: 30}}, required: ['seconds']},
      run: ({seconds}) => {
        if (!g.paused) return fail('step works only while paused; call pause first');
        if (!isNumber(seconds) || seconds <= 0 || seconds > 30) return fail('seconds must be a number above 0 and at most 30');
        for (let n = Math.max(1, Math.round(seconds * 60)); n > 0; n--) stepGame(g, input);
        return snapshot(g);
      },
    },
    {
      name: 'place',
      description: 'Moves a tank to x, z with a heading in degrees; refuses a spot inside a wall, overlapping the other tank or outside the arena; answers the state.',
      inputSchema: {
        type: 'object',
        properties: {tank: tankSchema, x: {type: 'number'}, z: {type: 'number'}, heading: {type: 'number'}},
        required: ['tank', 'x', 'z', 'heading'],
      },
      run: ({tank, x, z, heading}) => {
        if (!NAMES.includes(tank)) return fail('tank must be "player" or "computer"');
        if (![x, z, heading].every(isNumber)) return fail('x, z and heading must be numbers');
        const why = placeError(g, tank, x, z);
        if (why) return fail(`cannot place the tank there: ${why}`);
        Object.assign(g.tanks[tank], {x, z, heading: ((heading % 360) + 360) % 360});
        return snapshot(g);
      },
    },
    {
      name: 'fire',
      description: 'Fires that tank as Space does; fired is false while the tank must wait or has 3 shells out.',
      inputSchema: {type: 'object', properties: {tank: tankSchema}, required: ['tank']},
      run: ({tank}) => {
        if (!NAMES.includes(tank)) return fail('tank must be "player" or "computer"');
        return {ok: true, fired: fire(g, tank)};
      },
    },
    {
      name: 'set_ai',
      description: "Switches the computer's driving and firing on or off; answers {ok, ai}.",
      inputSchema: {type: 'object', properties: {enabled: {type: 'boolean'}}, required: ['enabled']},
      run: ({enabled}) => {
        if (typeof enabled !== 'boolean') return fail('enabled must be true or false');
        g.ai = enabled;
        return {ok: true, ai: enabled};
      },
    },
    {
      name: 'reset',
      description: 'Starts a new game: round 1, score 0 to 0, start positions, full health, no shells; pause and AI stay as they are; answers the state.',
      inputSchema: {type: 'object', properties: {}},
      run: () => {
        resetGame(g);
        return snapshot(g);
      },
    },
  ];

  const mc = document.modelContext;
  if (!mc) return;
  for (const {run, ...tool} of tools) {
    const execute = async args => {
      try {
        return run(args && typeof args === 'object' ? args : {});
      } catch (e) {
        return fail(String(e?.message ?? e));
      }
    };
    try {
      Promise.resolve(mc.registerTool({...tool, execute})).catch(() => {});
    } catch {
      // one refused tool must not stop the others
    }
  }
}
