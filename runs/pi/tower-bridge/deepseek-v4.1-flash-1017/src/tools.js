const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const failure = (message) => ({ ok: false, error: message });

export function registerTools(camera, render) {
  const modelContext = document.modelContext;
  if (!modelContext || typeof modelContext.registerTool !== "function") return;

  const guarded = (run) => (input) => {
    try {
      return run(input && typeof input === "object" ? input : {});
    } catch (error) {
      return failure(error && error.message ? error.message : String(error));
    }
  };

  const changed = () => {
    render();
    return camera.describe();
  };

  const tools = [
    {
      name: "describe",
      description:
        "Describe the view: the zoom, the model point at the centre of the window, and the parts of Tower Bridge on the page.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: guarded(() => camera.describe()),
    },
    {
      name: "zoom_by",
      description:
        "Multiply the zoom by factor about the centre of the window, clamped between 1 and 20.",
      inputSchema: {
        type: "object",
        properties: {
          factor: { type: "number", description: "Multiplier greater than zero, e.g. 2 or 0.5." },
        },
        required: ["factor"],
        additionalProperties: false,
      },
      execute: guarded((input) => {
        if (!isNumber(input.factor)) return failure("factor must be a finite number");
        if (input.factor <= 0) return failure("factor must be greater than zero");
        camera.zoomAt(input.factor);
        return changed();
      }),
    },
    {
      name: "pan",
      description: "Move the view by dx and dy model units. The centre of the window moves with it.",
      inputSchema: {
        type: "object",
        properties: {
          dx: { type: "number", description: "Horizontal move in model units." },
          dy: { type: "number", description: "Vertical move in model units." },
        },
        required: ["dx", "dy"],
        additionalProperties: false,
      },
      execute: guarded((input) => {
        if (!isNumber(input.dx) || !isNumber(input.dy)) {
          return failure("dx and dy must be finite numbers");
        }
        if (!camera.pan(input.dx, input.dy)) return failure("pan is out of range");
        return changed();
      }),
    },
    {
      name: "reset",
      description: "Return to zoom 1, centred on the whole bridge.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: guarded(() => {
        camera.reset();
        return changed();
      }),
    },
  ];

  for (const tool of tools) {
    try {
      const result = modelContext.registerTool(tool);
      if (result && typeof result.catch === "function") result.catch(() => {});
    } catch (error) {
      // A browser without working WebMCP should still show the bridge.
    }
  }
}
