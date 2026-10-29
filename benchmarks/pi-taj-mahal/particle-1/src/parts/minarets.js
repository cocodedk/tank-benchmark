// The four minarets: two tall ones at the near corners of the platform, two
// shorter ones further back, each with ringed balconies and a domed chhatri.
import { el, g, domeD } from "../svg.js";

const OUTER_TOP = 214;
const INNER_TOP = 330;

export function minarets() {
  return g({},
    minaret(252, 548, INNER_TOP, 17),
    minaret(948, 548, INNER_TOP, 17),
    minaret(158, 552, OUTER_TOP, 21),
    minaret(1042, 552, OUTER_TOP, 21));
}

function minaret(cx, baseY, topY, hb) {
  const ht = hb * 0.82;
  const shaft = `M${cx - hb} ${baseY}L${cx - ht} ${topY + 6}H${cx + ht}L${cx + hb} ${baseY}Z`;
  const rings = [0.3, 0.56, 0.8].map((t) => ring(cx, baseY - (baseY - topY) * t, hb, t));
  return g({},
    el("path", { d: shaft, fill: "url(#shaft)" }),
    el("path", { d: shaft, fill: "url(#stone)", opacity: 0.5 }),
    el("path", { d: shaft, fill: "url(#shadow)", opacity: 0.5 }),
    el("path", { d: shaft, fill: "none", stroke: "#a89a7c", "stroke-width": 0.5, opacity: 0.6 }),
    ...rings,
    // capital and chhatri
    el("rect", { x: cx - ht - 3, y: topY + 2, width: (ht + 3) * 2, height: 5, fill: "#f6f1e3" }),
    chhatri(cx, topY + 2, ht * 1.35),
    el("rect", { x: cx - hb - 4, y: baseY - 6, width: (hb + 4) * 2, height: 7, fill: "#eee7d5" }),
    el("rect", { x: cx - hb - 6, y: baseY, width: (hb + 6) * 2, height: 3, fill: "#d9d0ba" }));
}

/** A projecting gallery ring around the shaft, with its railing. */
function ring(cx, y, hb, t) {
  const w = hb * (1 - t * 0.18) * 1.55;
  const posts = [];
  for (let x = cx - w + 1.5; x < cx + w - 1; x += 2.6) {
    posts.push(el("rect", { x, y: y - 5, width: 1, height: 4.4, fill: "#cbbe9f" }));
  }
  return g({},
    el("rect", { x: cx - w, y: y - 1.6, width: w * 2, height: 3.4, fill: "#f5f0e1" }),
    el("rect", { x: cx - w, y: y + 1.8, width: w * 2, height: 1.8, fill: "#b3a68a", opacity: 0.85 }),
    g({ opacity: 0.8 }, posts));
}

/** The little domed pavilion that crowns each minaret. */
function chhatri(cx, yBase, r) {
  const cols = [];
  for (let i = 0; i < 8; i += 1) {
    const x = cx - r + (i * 2 * r) / 7;
    cols.push(el("rect", { x, y: yBase - 15, width: 1.8, height: 15, fill: "#e7dfca" }));
  }
  const d = domeD(cx, yBase - 15, r, yBase - 15 - r * 1.4);
  return g({},
    el("rect", { x: cx - r - 1.5, y: yBase - 3, width: (r + 1.5) * 2, height: 3.4, fill: "#f2ecdc" }),
    g({ fill: "#3f4a3a", opacity: 0.55 }, el("rect", { x: cx - r + 1, y: yBase - 15, width: r * 2 - 2, height: 15 })),
    ...cols,
    el("path", { d, fill: "url(#domeShade)" }),
    el("path", { d, fill: "url(#domeBlocks)", opacity: 0.45 }),
    el("rect", { x: cx - r - 1, y: yBase - 18, width: (r + 1) * 2, height: 3.4, fill: "#f7f2e4" }),
    el("line", { x1: cx, y1: yBase - 15 - r * 1.45, x2: cx, y2: yBase - 15 - r * 2.1, stroke: "#8a7a58", "stroke-width": 1 }),
    el("ellipse", { cx, cy: yBase - 15 - r * 1.9, rx: 1.8, ry: 1.1, fill: "#8a7a58" }));
}
