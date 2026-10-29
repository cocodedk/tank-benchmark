import { describe, place, reset, step, tryFire } from "./game.js";

const TANKS = ["player", "computer"];
const bad = (error) => ({ ok: false, error });
const num = (v) => typeof v === "number" && Number.isFinite(v);
const obj = { type: "object", properties: {} };

export function registerTools(g, readInput) {
  const mc = document.modelContext;
  if (!mc || typeof mc.registerTool !== "function") return;
  const tank = (i) => (TANKS.includes(i.tank) ? null : bad('tank must be "player" or "computer"'));
  const defs = [
    ["describe", "Reads the whole game state: arena, walls, tanks, shells, score, round, and flags.", obj, () => describe(g)],
    ["pause", "Pauses or resumes real-time play.", { type: "object", properties: { paused: { type: "boolean" } }, required: ["paused"] },
      (i) => {
        if (typeof i.paused !== "boolean") return bad("paused must be a boolean");
        g.paused = i.paused;
        return { ok: true, paused: g.paused };
      }],
    ["step", "While paused, runs n seconds (0 < n <= 30) of simulation steps reading the keys held now.",
      { type: "object", properties: { seconds: { type: "number" } }, required: ["seconds"] },
      (i) => {
        if (!g.paused) return bad("step works only while paused");
        if (!num(i.seconds) || i.seconds <= 0 || i.seconds > 30) return bad("seconds must be a number in (0, 30]");
        for (let k = Math.round(i.seconds * 60); k > 0; k--) step(g, readInput());
        return describe(g);
      }],
    ["place", "Moves a tank to x, z (and optionally heading) if the spot is free and inside the arena.",
      { type: "object", properties: { tank: { type: "string", enum: TANKS }, x: { type: "number" }, z: { type: "number" }, heading: { type: "number" } }, required: ["tank", "x", "z"] },
      (i) => {
        const e = tank(i);
        if (e) return e;
        if (!num(i.x) || !num(i.z)) return bad("x and z must be numbers");
        if (i.heading !== undefined && !num(i.heading)) return bad("heading must be a number");
        const err = place(g, i.tank, i.x, i.z, i.heading === undefined ? g.tanks[i.tank].heading : i.heading);
        return err ? bad(err) : describe(g);
      }],
    ["fire", "Fires a shell from the given tank, as Space does.",
      { type: "object", properties: { tank: { type: "string", enum: TANKS } }, required: ["tank"] },
      (i) => tank(i) || { ok: true, fired: tryFire(g, i.tank) }],
    ["set_ai", "Turns the computer player on or off.", { type: "object", properties: { enabled: { type: "boolean" } }, required: ["enabled"] },
      (i) => {
        if (typeof i.enabled !== "boolean") return bad("enabled must be a boolean");
        g.ai = i.enabled;
        return { ok: true, ai: g.ai };
      }],
    ["reset", "Restarts the match: round 1, score 0-0, start positions, full health, no shells.", obj,
      () => { reset(g); return describe(g); }],
  ];
  for (const [name, description, inputSchema, run] of defs) {
    try {
      const execute = async (input) => {
        try {
          return run(input && typeof input === "object" && !Array.isArray(input) ? input : {});
        } catch (e) {
          return bad(String(e));
        }
      };
      Promise.resolve(mc.registerTool({ name, description, inputSchema, execute })).catch(() => {});
    } catch (e) {
      /* a failed registration must not stop the others */
    }
  }
}
