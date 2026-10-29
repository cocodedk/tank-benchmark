import { fire, place, resetGame, snapshot, step } from './game.js';

const TANKS = ['player', 'computer'];
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const bad = (error) => ({ ok: false, error });

// Registers WebMCP tools; does nothing when the browser has no document.modelContext.
export function registerTools(g, getInput) {
  const mc = document.modelContext;
  if (!mc) return;
  const tool = (name, description, properties, run) => mc.registerTool({
    name,
    description,
    inputSchema: { type: 'object', properties },
    async execute(args) {
      try { return run(args && typeof args === 'object' ? args : {}); } catch (e) { return bad(String(e)); }
    },
  });
  let owed = 0; // fractional ticks carried between step calls
  const tankArg = { tank: { type: 'string', enum: TANKS } };

  tool('describe', 'Describe the game: arena, walls, tanks, shells, score, round, state, pause and AI.', {}, () => snapshot(g));
  tool('pause', 'Pause or resume real-time play.', { paused: { type: 'boolean' } }, (a) => {
    if (typeof a.paused !== 'boolean') return bad('paused must be a boolean');
    g.paused = a.paused;
    return { ok: true, paused: g.paused };
  });
  tool('step', 'While paused, advance the game by the given seconds (0 to 30) using the keys held now.',
    { seconds: { type: 'number', exclusiveMinimum: 0, maximum: 30 } }, (a) => {
      if (!g.paused) return bad('step only works while paused');
      if (!num(a.seconds) || a.seconds <= 0 || a.seconds > 30) return bad('seconds must be a number above 0 and at most 30');
      owed += a.seconds * 60; // keep the fraction, so many short calls add up to the same time as one long call
      for (; owed >= 1 - 1e-6; owed--) step(g, getInput());
      owed = Math.max(owed, 0);
      return snapshot(g);
    });
  tool('place', 'Move a tank to a free spot inside the arena, optionally setting its heading in degrees.',
    { ...tankArg, x: { type: 'number' }, z: { type: 'number' }, heading: { type: 'number' } }, (a) => {
      if (!TANKS.includes(a.tank)) return bad('tank must be "player" or "computer"');
      if (!num(a.x) || !num(a.z)) return bad('x and z must be finite numbers');
      if (a.heading !== undefined && !num(a.heading)) return bad('heading must be a finite number');
      const error = place(g, a.tank, a.x, a.z, a.heading);
      return error ? bad(error) : snapshot(g);
    });
  tool('fire', 'Fire a shell from a tank as Space does, if it may.', tankArg, (a) => {
    if (!TANKS.includes(a.tank)) return bad('tank must be "player" or "computer"');
    return { ok: true, fired: fire(g, a.tank) };
  });
  tool('set_ai', 'Turn the computer tank\'s driving and firing on or off.', { enabled: { type: 'boolean' } }, (a) => {
    if (typeof a.enabled !== 'boolean') return bad('enabled must be a boolean');
    g.ai = a.enabled;
    return { ok: true, ai: g.ai };
  });
  tool('reset', 'Start a new game: round 1, score 0-0, start positions, full health.', {}, () => {
    resetGame(g);
    return snapshot(g);
  });
}
