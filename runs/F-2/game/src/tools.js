// WebMCP tools. Nothing is registered when document.modelContext is absent.
import { step, fire, place, reset, snapshot } from './sim.js';
import { keys } from './input.js';

const num = (v) => typeof v === 'number' && Number.isFinite(v);
const tankSchema = { type: 'string', enum: ['player', 'computer'] };
const bool = { type: 'boolean' };
const obj = (properties = {}, required = []) => ({ type: 'object', properties, required });
const isTank = (a) => a.tank === 'player' || a.tank === 'computer';
const BAD_TANK = { ok: false, error: 'tank must be "player" or "computer"' };

export function registerTools(s) {
  const mc = document.modelContext;
  if (!mc) return;
  const defs = [
    ['describe', 'Report the full game state: arena, walls, tanks, shells, score, round, state, pause and AI flags.',
      obj(), () => snapshot(s), { readOnlyHint: true }],
    ['pause', 'Pause or resume real-time play.', obj({ paused: bool }, ['paused']), (a) => {
      if (typeof a.paused !== 'boolean') return { ok: false, error: 'paused must be a boolean' };
      s.paused = a.paused;
      return { ok: true, paused: s.paused };
    }],
    ['step', 'While paused, advance the game by the given seconds (0 to 30) in 1/60 s steps using the keys held now.',
      obj({ seconds: { type: 'number' } }, ['seconds']), (a) => {
        if (!num(a.seconds) || a.seconds <= 0 || a.seconds > 30) return { ok: false, error: 'seconds must be a number in (0, 30]' };
        if (!s.paused) return { ok: false, error: 'step only works while paused' };
        for (let i = Math.round(a.seconds * 60); i > 0; i--) step(s, keys);
        return snapshot(s);
      }],
    ['place', 'Move a tank to x, z (and optionally a heading in degrees), refusing walls, the other tank and the outside.',
      obj({ tank: tankSchema, x: { type: 'number' }, z: { type: 'number' }, heading: { type: 'number' } }, ['tank', 'x', 'z']), (a) => {
        if (!isTank(a)) return BAD_TANK;
        if (!num(a.x) || !num(a.z)) return { ok: false, error: 'x and z must be numbers' };
        if (a.heading !== undefined && !num(a.heading)) return { ok: false, error: 'heading must be a number' };
        const error = place(s, a.tank, a.x, a.z, a.heading);
        return error ? { ok: false, error } : snapshot(s);
      }],
    ['fire', 'Make a tank fire a shell, as Space does, if its cooldown and shell limit allow.',
      obj({ tank: tankSchema }, ['tank']), (a) => (isTank(a) ? { ok: true, fired: fire(s, a.tank) } : BAD_TANK)],
    ['set_ai', 'Turn the computer opponent on or off.', obj({ enabled: bool }, ['enabled']), (a) => {
      if (typeof a.enabled !== 'boolean') return { ok: false, error: 'enabled must be a boolean' };
      s.ai = a.enabled;
      return { ok: true, ai: s.ai };
    }],
    ['reset', 'Restart at round 1 with score 0-0, start positions, full health and no shells; pause and AI stay as they are.',
      obj(), () => { reset(s); return snapshot(s); }],
  ];
  for (const [name, description, inputSchema, fn, annotations] of defs) {
    const execute = async (input) => {
      try { return fn(input && typeof input === 'object' ? input : {}); } catch (e) { return { ok: false, error: String(e) }; }
    };
    try {
      const tool = { name, description, inputSchema, execute };
      if (annotations) tool.annotations = annotations;
      Promise.resolve(mc.registerTool(tool)).catch((e) => console.warn('registerTool failed', name, e));
    } catch (e) { console.warn('registerTool failed', name, e); }
  }
}
