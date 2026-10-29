// Gradients and repeating patterns: the marble courses, sandstone slabs, grass,
// water ripples, inlay, lattice screens and cypress needles the parts fill with.
import { el } from "./svg.js";

const linear = (id, stops, attrs = {}) =>
  el("linearGradient", { id, ...attrs },
    ...stops.map(([offset, colour, opacity]) =>
      el("stop", { offset, "stop-color": colour, "stop-opacity": opacity })));

const lines = (d, stroke, width, opacity) =>
  el("path", { d, fill: "none", stroke, "stroke-width": width, opacity });

export function paint() {
  return el("defs", {},
    // sky: deepest blue overhead, paling towards the horizon
    linear("sky", [[0, "#74a5d4"], [0.5, "#a3c6e4"], [0.86, "#d3e4f1"], [1, "#e6edf0"]],
      { x1: 0, y1: -200, x2: 0, y2: 640, gradientUnits: "userSpaceOnUse" }),
    linear("domeShade", [[0, "#fefdf9"], [0.3, "#f7f3e9"], [0.66, "#e8e0cd"], [1, "#c7bda6"]],
      { x1: 0.08, y1: 0.02, x2: 1, y2: 0.82 }),
    linear("marbleFace", [[0, "#fbf9f4"], [0.6, "#f2eee5"], [1, "#d9d2c0"]],
      { x1: 0, y1: 0, x2: 0.92, y2: 0.35 }),
    linear("shaft", [[0, "#fcfaf4"], [0.28, "#f4f0e6"], [1, "#cfc7b3"]],
      { x1: 0, y1: 0, x2: 1, y2: 0.08 }),
    linear("water", [[0, "#8fb0a6"], [0.35, "#7ba19a"], [1, "#63867f"]],
      { x1: 0, y1: 0, x2: 0, y2: 1 }),
    linear("plinthFace", [[0, "#f9f6ef"], [1, "#ded6c3"]],
      { x1: 0, y1: 0, x2: 0, y2: 1 }),
    linear("haze", [[0, "#eaf1f3", 0], [0.55, "#eaf1f3", 0.5], [1, "#eaf1f3", 0.85]],
      { x1: 0, y1: 0, x2: 0, y2: 1 }),
    linear("shadow", [[0, "#000", 0], [0.5, "#000", 0.14], [1, "#000", 0.3]],
      { x1: 0, y1: 0, x2: 1, y2: 0 }),

    // marble: cream body, thin courses of stone with staggered joints
    el("pattern", { id: "stone", patternUnits: "userSpaceOnUse", width: 26, height: 7 },
      el("rect", { width: 26, height: 7, fill: "#f3efe6" }),
      lines("M0 0.6H26M0 4.1H26", "#d3ccba", 0.5, 0.75),
      lines("M8 0.6V4.1M19 4.1V7", "#d3ccba", 0.45, 0.6)),
    el("pattern", { id: "stoneLines", patternUnits: "userSpaceOnUse", width: 26, height: 7 },
      lines("M0 0.6H26M0 4.1H26", "#bdb39e", 0.5, 0.4),
      lines("M8 0.6V4.1M19 4.1V7", "#bdb39e", 0.45, 0.3)),
    // the dome: slightly larger, darker blocks
    el("pattern", { id: "domeBlocks", patternUnits: "userSpaceOnUse", width: 30, height: 9 },
      lines("M0 0.7H30M0 5.1H30", "#c2b7a0", 0.6, 0.38),
      lines("M9 0.7V5.1M21 5.1V9", "#c2b7a0", 0.5, 0.28)),
    // red sandstone paving: slabs with a lit top edge and joints
    el("pattern", { id: "paving", patternUnits: "userSpaceOnUse", width: 30, height: 11 },
      el("rect", { width: 30, height: 11, fill: "#9c5b49" }),
      el("path", { d: "M0 1.6H15V6.4H30", fill: "none", stroke: "#7a4130", "stroke-width": 0.8 }),
      el("path", { d: "M0 1.2H15M0 6.1H30M15 1.2V6.1", stroke: "#b98164", "stroke-width": 0.45, opacity: 0.55, fill: "none" }),
      el("path", { d: "M4 7.6h4M19 9.4h5M9 3.6h3", stroke: "#8d5240", "stroke-width": 0.7, opacity: 0.5, fill: "none" })),
    el("pattern", { id: "sandstone", patternUnits: "userSpaceOnUse", width: 22, height: 8 },
      el("rect", { width: 22, height: 8, fill: "#a8684f" }),
      el("path", { d: "M0 0.8H22M0 4.2H22M11 0.8V4.2M22 4.2V8", fill: "none", stroke: "#83462f", "stroke-width": 0.6 }),
      el("path", { d: "M0 0.4H22M0 3.9H22", stroke: "#c08a6c", "stroke-width": 0.35, opacity: 0.5, fill: "none" })),
    // lawn with tufts of grass
    el("pattern", { id: "lawn", patternUnits: "userSpaceOnUse", width: 13, height: 11 },
      el("rect", { width: 13, height: 11, fill: "#5c7730" }),
      el("path", { d: "M2 4l1 -2.4M9 10l1 -2.4M11 5l1 -2.4M5 9l1 -2.2M12 9.5l0.9 -2M7 3.5l0.8 -1.8", stroke: "#72913a", "stroke-width": 0.9, opacity: 0.9, fill: "none" }),
      el("path", { d: "M4 7.5l0.7 -1.6M8.5 6.5l0.8 -1.8M1 9l0.7 -1.7M10.5 2.5l0.7 -1.5", stroke: "#46601f", "stroke-width": 0.9, opacity: 0.9, fill: "none" })),
    el("pattern", { id: "ripples", patternUnits: "userSpaceOnUse", width: 22, height: 8 },
      el("path", { d: "M0 2h11M6 5.6h9M15 1h6", stroke: "#e9f4f0", "stroke-width": 0.55, opacity: 0.4, fill: "none" })),
    // cypress foliage: fine dark needles over a dark green body
    el("pattern", { id: "cypress", patternUnits: "userSpaceOnUse", width: 5, height: 7 },
      el("rect", { width: 5, height: 7, fill: "#263d1c" }),
      el("path", { d: "M0.8 7V1.2M2.4 7V0.6M4 7V1.8", stroke: "#3c5c27", "stroke-width": 0.7, fill: "none" }),
      el("path", { d: "M1.6 6.4V2.6M3.2 6.4V1.4M4.6 6.4V3", stroke: "#1a2b12", "stroke-width": 0.6, fill: "none" }),
      el("path", { d: "M2 4.6l0.7-0.7M3.6 3.4l0.6-0.6M1.2 3l0.6-0.6", stroke: "#547a34", "stroke-width": 0.45, opacity: 0.8, fill: "none" })),
    // inlaid band: a lattice of small diamonds with a green heart
    el("pattern", { id: "inlay", patternUnits: "userSpaceOnUse", width: 8, height: 8 },
      el("path", { d: "M4 0.9L7.1 4 4 7.1 0.9 4Z", fill: "none", stroke: "#a4674f", "stroke-width": 0.45, opacity: 0.9 }),
      el("path", { d: "M4 2.4L5.6 4 4 5.6 2.4 4Z", fill: "#b98a6a", opacity: 0.5 }),
      el("circle", { cx: 4, cy: 4, r: 0.62, fill: "#7d9455" })),
    // a pierced marble screen: dark behind, light lattice in front
    el("pattern", { id: "jali", patternUnits: "userSpaceOnUse", width: 5, height: 5 },
      el("rect", { width: 5, height: 5, fill: "#3c3730" }),
      el("path", { d: "M2.5 0.4L4.6 2.5 2.5 4.6 0.4 2.5Z", fill: "none", stroke: "#cfc6b0", "stroke-width": 0.5 })));
}
