/* The WebMCP surface: describe, zoom_by, pan, reset. Nothing here may throw. */

import { VIEW } from "./world.js";

const round = (v) => Math.round(v * 1e6) / 1e6;

export function registerTools(app) {
  const mc = globalThis.document && document.modelContext;
  if (!mc || typeof mc.registerTool !== "function") return;

  const { camera } = app;
  const state = () => ({
    ok: true,
    zoom: round(camera.zoom),
    x: round(camera.cx),
    y: round(camera.cy),
    parts: VIEW.parts.slice(),
  });
  const fail = (error) => ({ ok: false, error });

  const describe = () => state();

  const zoomBy = (input) => {
    const factor = input.factor;
    if (typeof factor !== "number" || !Number.isFinite(factor) || factor <= 0) {
      return fail("factor must be a positive finite number");
    }
    const { w, h } = app.viewport();
    camera.zoomAtCentre(factor, w, h);
    app.draw();
    return state();
  };

  const pan = (input) => {
    const dx = input.dx === undefined ? 0 : input.dx;
    const dy = input.dy === undefined ? 0 : input.dy;
    if (typeof dx !== "number" || !Number.isFinite(dx)) return fail("dx must be a finite number");
    if (typeof dy !== "number" || !Number.isFinite(dy)) return fail("dy must be a finite number");
    camera.pan(dx, dy);
    app.draw();
    return state();
  };

  const reset = () => {
    camera.reset();
    app.draw();
    return state();
  };

  const wrap = (fn) => (input) => {
    try {
      const data = input && typeof input === "object" ? input : {};
      return fn(data);
    } catch (error) {
      return fail(error && error.message ? error.message : String(error));
    }
  };

  const tools = [
    {
      name: "describe",
      description: "Describe the view: zoom, the model point at the centre of the window, and what is drawn.",
      inputSchema: { type: "object", properties: {} },
      execute: wrap(describe),
    },
    {
      name: "zoom_by",
      description: "Multiply the zoom about the window centre. Clamped to 1..20.",
      inputSchema: { type: "object", properties: { factor: {} } },
      execute: wrap(zoomBy),
    },
    {
      name: "pan",
      description: "Move the view by dx and dy in the model's units.",
      inputSchema: { type: "object", properties: { dx: {}, dy: {} } },
      execute: wrap(pan),
    },
    {
      name: "reset",
      description: "Return to zoom 1, centred on the bridge.",
      inputSchema: { type: "object", properties: {} },
      execute: wrap(reset),
    },
  ];

  for (const tool of tools) {
    try {
      mc.registerTool(tool);
    } catch {
      // An older modelContext without this tool is not a reason to break the page.
    }
  }
}
