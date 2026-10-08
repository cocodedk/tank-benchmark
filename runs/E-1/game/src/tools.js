// The WebMCP tools: the game's own abilities, for an agent in the browser.
import { game, reset, describe, step, fire, place, DT } from "./game.js";
import { controls } from "./keys.js";

const bad = (error) => ({ ok: false, error });
const TANKS = ["player", "computer"];
const finite = (v) => typeof v === "number" && Number.isFinite(v);
const tankSchema = { type: "string", enum: TANKS };

const TOOLS = [
  ["describe", "Reads the game: arena, inner walls, both tanks, shells in flight, score, round and state.", {},
    () => describe()],
  ["pause", "Pauses (true) or resumes (false) real-time play; answers whether the game is now paused.",
    { paused: { type: "boolean" } },
    ({ paused }) => {
      if (typeof paused !== "boolean") return bad("paused must be true or false");
      game.paused = paused;
      return { ok: true, paused };
    }],
  ["step", "Only while paused: advances the game by seconds (0 < seconds <= 30) in 1/60 s steps, reading the keys held now; answers the state.",
    { seconds: { type: "number", exclusiveMinimum: 0, maximum: 30 } },
    ({ seconds }) => {
      if (!game.paused) return bad("pause the game first");
      if (!finite(seconds) || seconds <= 0 || seconds > 30) return bad("seconds must be more than 0 and at most 30");
      for (let i = Math.round(seconds / DT); i > 0; i--) step(controls());
      return describe();
    }],
  ["place", "Moves a tank (player or computer) to x, z with a heading in degrees; refuses a spot inside a wall, on the other tank or outside the arena. Answers the state.",
    { tank: tankSchema, x: { type: "number" }, z: { type: "number" }, heading: { type: "number" } },
    ({ tank, x, z, heading }) => {
      if (!TANKS.includes(tank)) return bad("tank must be player or computer");
      if (!finite(x) || !finite(z) || !finite(heading)) return bad("x, z and heading must be numbers");
      if (!place(tank, x, z, heading)) return bad("that spot is inside a wall, on the other tank or outside the arena");
      return describe();
    }],
  ["fire", "Fires a shell from that tank, as Space does; fired is false while it must wait 0.5 s or has 3 shells out.",
    { tank: tankSchema },
    ({ tank }) => (TANKS.includes(tank) ? { ok: true, fired: fire(tank) } : bad("tank must be player or computer"))],
  ["set_ai", "Switches the computer's own driving and firing on (true) or off (false).",
    { enabled: { type: "boolean" } },
    ({ enabled }) => {
      if (typeof enabled !== "boolean") return bad("enabled must be true or false");
      game.ai = enabled;
      return { ok: true, ai: enabled };
    }],
  ["reset", "Starts a new game: round 1, score 0 to 0, start positions, full health, no shells; pause and AI stay. Answers the state.",
    {}, () => { reset(); return describe(); }],
];

export function registerTools() {
  const mc = document.modelContext;
  if (!mc) return;
  for (const [name, description, properties, run] of TOOLS) {
    const execute = async (input) => {
      try {
        return run(input && typeof input === "object" && !Array.isArray(input) ? input : {});
      } catch (e) {
        return bad(String(e));
      }
    };
    const inputSchema = { type: "object", properties, required: Object.keys(properties) };
    Promise.resolve().then(() => mc.registerTool({ name, description, inputSchema, execute })).catch(() => {});
  }
}
