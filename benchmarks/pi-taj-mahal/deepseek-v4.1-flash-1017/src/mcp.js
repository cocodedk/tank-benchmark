/* WebMCP tools. Without document.modelContext the page is unchanged. */

import { describe, panBy, reset, zoomBy } from "./view.js";

const error = (message) => ({ ok: false, error: message });

function number(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safe(fn) {
  return async (input) => {
    try {
      return fn(input || {});
    } catch (e) {
      return error(e && e.message ? e.message : "the tool failed");
    }
  };
}

export function registerTools(view, redraw) {
  const mc = typeof document !== "undefined" ? document.modelContext : null;
  if (!mc || typeof mc.registerTool !== "function") return;

  const size = () => ({ w: window.innerWidth, h: window.innerHeight });
  const after = () => {
    redraw();
    return describe(view);
  };

  const tools = [
    {
      name: "describe",
      description: "What is on the page: zoom, the model point at the centre, and the parts drawn.",
      inputSchema: { type: "object", properties: {} },
      execute: safe(() => describe(view)),
    },
    {
      name: "zoom_by",
      description: "Multiply the zoom about the window centre, clamped to 1..20.",
      inputSchema: {
        type: "object",
        properties: { factor: { type: "number", description: "multiplication factor, e.g. 2" } },
      },
      execute: safe((input) => {
        const factor = number(input.factor);
        if (factor === null || factor <= 0) return error("factor must be a positive number");
        zoomBy(view, factor, size().w, size().h);
        return after();
      }),
    },
    {
      name: "pan",
      description: "Move the view by dx and dy model units.",
      inputSchema: {
        type: "object",
        properties: {
          dx: { type: "number", description: "model units right" },
          dy: { type: "number", description: "model units down" },
        },
      },
      execute: safe((input) => {
        const dx = number(input.dx);
        const dy = number(input.dy);
        if (dx === null || dy === null) return error("dx and dy must be numbers");
        panBy(view, dx, dy);
        return after();
      }),
    },
    {
      name: "reset",
      description: "Show the whole picture again: zoom 1, centred.",
      inputSchema: { type: "object", properties: {} },
      execute: safe(() => {
        reset(view);
        return after();
      }),
    },
  ];

  for (const tool of tools) {
    try {
      const pending = mc.registerTool(tool);
      if (pending && typeof pending.catch === "function") pending.catch(() => {});
    } catch {
      /* an older browser may not take this tool; the page still works. */
    }
  }
}
