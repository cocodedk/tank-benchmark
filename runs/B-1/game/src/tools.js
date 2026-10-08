// WebMCP tools. Registered only when the browser has document.modelContext.
import { step, place, fire, reset, snapshot, DT } from './sim.js';

const bad = (error) => ({ ok: false, error });
const obj = (properties = {}, required = []) => ({ type: 'object', properties, required });
const TANK = { type: 'string', enum: ['player', 'computer'] };

export function registerTools(sim, keys) {
  const mc = document.modelContext;
  if (!mc) return;
  const tool = (name, description, inputSchema, run) =>
    mc.registerTool({
      name, description, inputSchema,
      execute: async (input) => {
        try {
          const a = input && typeof input === 'object' ? input : {};
          sim.dirty = true;
          return (await run(a)) ?? bad('failed');
        } catch (e) {
          return bad(String(e && e.message || e));
        }
      },
    });
  const tankOk = (a) => a.tank === 'player' || a.tank === 'computer';

  tool('describe', 'Read the whole game state.', obj(), () => snapshot(sim));
  tool('pause', 'Pause or resume real-time play.', obj({ paused: { type: 'boolean' } }, ['paused']), (a) => {
    if (typeof a.paused !== 'boolean') return bad('paused must be true or false');
    sim.paused = a.paused;
    return { ok: true, paused: sim.paused };
  });
  tool('step', 'While paused, advance the game by that many seconds (more than 0, at most 30).',
    obj({ seconds: { type: 'number' } }, ['seconds']), (a) => {
      if (!sim.paused) return bad('the game is not paused');
      if (typeof a.seconds !== 'number' || !(a.seconds > 0 && a.seconds <= 30)) return bad('seconds must be a number above 0 and at most 30');
      for (let i = Math.round(a.seconds / DT); i > 0; i--) step(sim, keys);
      return snapshot(sim);
    });
  tool('place', 'Move a tank to x, z and an optional heading in degrees.',
    obj({ tank: TANK, x: { type: 'number' }, z: { type: 'number' }, heading: { type: 'number' } }, ['tank', 'x', 'z']), (a) => {
      if (!tankOk(a)) return bad('tank must be "player" or "computer"');
      const err = place(sim, a.tank, a.x, a.z, a.heading);
      return err ? bad(err) : snapshot(sim);
    });
  tool('fire', 'Fire a shell from that tank, as Space does.', obj({ tank: TANK }, ['tank']), (a) => {
    if (!tankOk(a)) return bad('tank must be "player" or "computer"');
    return { ok: true, fired: fire(sim, a.tank) };
  });
  tool('set_ai', "Switch the computer's driving and firing on or off.", obj({ enabled: { type: 'boolean' } }, ['enabled']), (a) => {
    if (typeof a.enabled !== 'boolean') return bad('enabled must be true or false');
    sim.ai = a.enabled;
    return { ok: true, ai: sim.ai };
  });
  tool('reset', 'Start a new game: round 1, score 0 to 0, start positions.', obj(), () => {
    reset(sim);
    return snapshot(sim);
  });
}
