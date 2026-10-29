// WebMCP: the page's own zoom and pan as tools an agent in the browser can call.
// No registry -> nothing happens here and the page works as before.
const ROUND = (v) => Math.round(v * 100) / 100;
const fail = (error) => ({ ok: false, error });

function number(value, name) {
  if (value === undefined || value === null) return 0;
  if (typeof value !== "number" || !Number.isFinite(value)) return NaN;
  return value;
}

export function registerTools(api) {
  const mc = typeof document !== "undefined" ? document.modelContext : null;
  if (!mc || typeof mc.registerTool !== "function") return [];

  const answer = () => {
    const s = api.state();
    return { ok: true, zoom: ROUND(s.zoom), x: ROUND(s.x), y: ROUND(s.y), parts: s.parts.slice() };
  };

  const tools = [
    {
      name: "describe",
      title: "Describe the view",
      description:
        "What the page is showing: the zoom (1 = the whole drawing fits the window, 20 = closest), " +
        "the model point at the centre of the window in model units (the drawing is 1200 wide by 780 tall, " +
        "x to the right, y downwards), and the parts of the Taj Mahal that are drawn.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: () => answer(),
    },
    {
      name: "zoom_by",
      title: "Zoom by a factor",
      description:
        "Multiply the zoom about the centre of the window, clamped to 1..20. factor 2 doubles it, " +
        "0.5 halves it. Returns the same fields as describe.",
      inputSchema: {
        type: "object",
        properties: { factor: { type: "number", description: "Positive multiplier, e.g. 2 or 0.5." } },
        required: ["factor"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: (input) => {
        const factor = number(input && input.factor, "factor");
        if (Number.isNaN(factor) || factor <= 0 || factor > 1000) {
          return fail("factor must be a number greater than 0 and at most 1000");
        }
        api.zoomBy(factor);
        return answer();
      },
    },
    {
      name: "pan",
      title: "Pan the view",
      description:
        "Slide the drawing by dx and dy model units (1200 by 780 in total). Positive dx moves the " +
        "drawing right, positive dy moves it down; the view stops at the edges of the drawing, so at " +
        "zoom 1 a pan may change nothing. Returns the same fields as describe.",
      inputSchema: {
        type: "object",
        properties: {
          dx: { type: "number", description: "Model units to move the drawing horizontally." },
          dy: { type: "number", description: "Model units to move the drawing vertically." },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: (input) => {
        const dx = number(input && input.dx, "dx");
        const dy = number(input && input.dy, "dy");
        if (Number.isNaN(dx) || Number.isNaN(dy)) return fail("dx and dy must be numbers");
        api.pan(dx, dy);
        return answer();
      },
    },
    {
      name: "reset",
      title: "Reset the view",
      description: "Back to zoom 1, the whole drawing centred in the window. Returns the same fields as describe.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: () => {
        api.reset();
        return answer();
      },
    },
  ];

  for (const tool of tools) {
    try {
      Promise.resolve(mc.registerTool(tool)).catch(() => {});
    } catch {
      /* a refused tool must not stop the rest */
    }
  }
  return tools.map((t) => t.name);
}
