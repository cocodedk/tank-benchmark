// Small DOM/SVG helpers and the shared shape formulas the parts draw with.
export const NS = "http://www.w3.org/2000/svg";

export function el(tag, attrs = {}, ...kids) {
  const node = document.createElementNS(NS, tag);
  for (const key of Object.keys(attrs)) {
    const value = attrs[key];
    if (value === null || value === undefined || value === false) continue;
    node.setAttribute(key, String(value));
  }
  for (const kid of kids.flat(9)) if (kid) node.append(kid);
  return node;
}

export const g = (attrs, ...kids) => el("g", attrs, ...kids);

/** A pointed Mughal arch, closed along its base. */
export function archD(cx, halfW, yBase, ySpring, yApex) {
  const l = cx - halfW, r = cx + halfW, h = ySpring - yApex;
  return `M${l} ${yBase}V${ySpring}` +
    `C${l} ${ySpring - h * 0.55} ${l + halfW * 0.38} ${yApex + h * 0.1} ${cx} ${yApex}` +
    `C${r - halfW * 0.38} ${yApex + h * 0.1} ${r} ${ySpring - h * 0.55} ${r} ${ySpring}` +
    `V${yBase}Z`;
}

/** A smooth open/closed curve through points, Catmull-Rom turned into cubics. */
export function smoothPath(pts, close = true) {
  const p = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  let d = `M${p(0)[0]} ${p(0)[1]}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [x0, y0] = p(i - 1), [x1, y1] = p(i), [x2, y2] = p(i + 1), [x3, y3] = p(i + 2);
    d += `C${x1 + (x2 - x0) / 6} ${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6} ${y2 - (y3 - y1) / 6} ${x2} ${y2}`;
  }
  return close ? `${d}Z` : d;
}

// Half-silhouette of the dome: a narrow foot, a wide belly, then a fast taper to the tip.
const DOME = [
  [0.00, 0.76], [0.05, 0.89], [0.12, 0.97], [0.21, 1.00], [0.32, 0.99],
  [0.44, 0.94], [0.56, 0.86], [0.68, 0.74], [0.79, 0.58], [0.88, 0.41],
  [0.94, 0.27], [0.98, 0.14], [1.00, 0.03],
];

/** The onion dome: `yBase` at its foot, `halfBelly` at its widest, apex at `yApex`. */
export function domeD(cx, yBase, halfBelly, yApex) {
  const right = DOME.map(([t, r]) => [cx + r * halfBelly, yBase - t * (yBase - yApex)]);
  const left = DOME.map(([t, r]) => [cx - r * halfBelly, yBase - t * (yBase - yApex)]);
  return smoothPath([...left, ...right.reverse()]);
}

/** Deterministic pseudo random, so the crowd and plants are the same every load. */
export function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function cypress(x, baseY, h) {
  const w = h * 0.23;
  const d = `M0 0C${-w * 0.52} ${-h * 0.06} ${-w * 0.58} ${-h * 0.46} ${-w * 0.26} ${-h * 0.9}` +
    `Q0 ${-h * 1.02} ${w * 0.26} ${-h * 0.9}` +
    `C${w * 0.58} ${-h * 0.46} ${w * 0.52} ${-h * 0.06} 0 0Z`;
  return g({ transform: `translate(${x} ${baseY})` },
    el("ellipse", { cx: 0, cy: 0, rx: w * 0.95, ry: w * 0.22, fill: "#25400f", opacity: 0.32 }),
    el("path", { d, fill: "url(#cypress)" }),
    el("path", { d, fill: "none", stroke: "#16240f", "stroke-width": 0.45, opacity: 0.55 }));
}

export function figure(x, y, h, tone = "#3a3a40") {
  const w = h * 0.36;
  return g({ transform: `translate(${x} ${y})` },
    el("path", {
      d: `M${-w * 0.5} 0L${-w * 0.34} ${-h * 0.78}Q0 ${-h * 0.9} ${w * 0.34} ${-h * 0.78}L${w * 0.5} 0Z`,
      fill: tone,
    }),
    el("circle", { cx: 0, cy: -h * 0.86, r: h * 0.11, fill: tone }));
}
