// The charbagh garden: lawns, the red sandstone walkways, the long reflecting
// pool with its fountains, the hedge and the two avenues of cypresses.
// Everything on the ground is drawn to one vanishing point on the axis.
import { el, g, prng, cypress, figure } from "../svg.js";

const AXIS = 600;
const EYE = 560;               // the horizon line the ground converges on
const NEAR = 780;              // the near edge used for the proportions below
const FAR = 646;               // where the pool runs out of sight under the terrace

const proj = (y) => (y - EYE) / (NEAR - EYE);          // 1 at the near plane, 0 at the horizon
const halfPool = (y) => 104 * proj(y);
const halfPath = (y) => 96 * proj(y);
const edgeX = (xNear, y) => AXIS + (xNear - AXIS) * proj(y);

/** Lawn and the trees behind the platform, drawn before the building. */
export function gardenBack() {
  return g({},
    el("rect", { x: -1400, y: 570, width: 4000, height: 1400, fill: "url(#lawn)" }),
    el("rect", { x: -1400, y: 570, width: 4000, height: 30, fill: "#415c22", opacity: 0.45 }));
}

export function gardenFront() {
  return g({},
    walkways(),
    pool(),
    hedges(),
    rows(),
    foregroundPeople());
}

function strip(inner, outer, fill, stroke) {
  const y1 = FAR, y2 = NEAR + 260;
  return g({},
    el("path", {
      d: `M${edgeX(inner, y1)} ${y1}L${edgeX(outer, y1)} ${y1}` +
        `L${edgeX(outer, y2)} ${y2}H${edgeX(inner, y2)}Z`,
      fill,
    }),
    stroke ? el("path", {
      d: `M${edgeX(inner, y1)} ${y1}L${edgeX(inner, y2)} ${y2}`,
      stroke, "stroke-width": 0.8, opacity: 0.65,
    }) : null);
}

function walkways() {
  const out = [];
  for (const side of [-1, 1]) {
    const a = (y) => AXIS + side * (halfPool(y) + 8);
    const b = (y) => AXIS + side * (halfPool(y) + 8 + halfPath(y));
    out.push(strip(a(NEAR), b(NEAR), "url(#paving)", "#8b4b38"));
    out.push(strip(b(NEAR), b(NEAR) + side * 10, "#5c7c31"));
  }
  return g({}, out);
}

function pool() {
  const y2 = NEAR + 260;
  const p = `M${AXIS - halfPool(FAR)} ${FAR}H${AXIS + halfPool(FAR)}` +
    `L${AXIS + halfPool(y2)} ${y2}H${AXIS - halfPool(y2)}Z`;
  return g({},
    el("path", {
      d: `M${AXIS - halfPool(FAR) - 9} ${FAR}H${AXIS + halfPool(FAR) + 9}` +
        `L${AXIS + halfPool(y2) + 9} ${y2}H${AXIS - halfPool(y2) - 9}Z`,
      fill: "url(#plinthFace)",
    }),
    el("path", { d: p, fill: "url(#water)" }),
    // the pale reflection of the mausoleum lying on the water
    g({ opacity: 0.22, fill: "#f1ece0" },
      el("ellipse", { cx: 600, cy: 686, rx: 26, ry: 9 }),
      el("path", { d: "M572 656H628L638 706H562Z", opacity: 0.5 })),
    el("path", { d: p, fill: "url(#ripples)", opacity: 0.5 }),
    fountain(600, 748, 74),
    fountain(600, 676, 30));
}

/** A single jet of water arching out of the pool, with its ring of ripples. */
function fountain(x, y, h) {
  const spray = `M${x - 2.2} ${y}C${x - 1.3} ${y - h * 0.5} ${x - 5} ${y - h * 0.8} ${x} ${y - h}` +
    `C${x + 5} ${y - h * 0.8} ${x + 1.3} ${y - h * 0.5} ${x + 2.2} ${y}Z`;
  return g({},
    el("ellipse", { cx: x, cy: y, rx: 30, ry: 4.6, fill: "none", stroke: "#eef6f1", "stroke-width": 0.7, opacity: 0.4 }),
    el("ellipse", { cx: x, cy: y, rx: 16, ry: 2.8, fill: "none", stroke: "#f7fbf8", "stroke-width": 0.7, opacity: 0.55 }),
    el("path", { d: spray, fill: "#f6faf7", opacity: 0.9 }),
    el("ellipse", { cx: x, cy: y - h, rx: 2.4, ry: 1.4, fill: "#fff", opacity: 0.9 }),
    el("ellipse", { cx: x, cy: y, rx: 4.4, ry: 1.3, fill: "#dfe9e4" }));
}

function hedges() {
  const out = [];
  for (const side of [-1, 1]) {
    const a = (y) => AXIS + side * (halfPool(y) + 8 + halfPath(y) + 4);
    const b = (y) => AXIS + side * (halfPool(y) + 8 + halfPath(y) + 30);
    out.push(strip(a(NEAR), b(NEAR), "#4a682c"));
  }
  return g({}, out);
}

/** Two avenues of cypresses on each side of the pool, shrinking to the horizon. */
function rows() {
  const rnd = prng(21);
  const trees = [];
  const lanes = [388, 344, 300, 812, 856, 900];
  for (const [n, xNear] of lanes.entries()) {
    for (let i = 0; i < 11; i += 1) {
      const y = EYE + (NEAR - EYE) * Math.pow(0.87, i + (n % 2) * 0.5) + (rnd() - 0.5) * 3;
      const x = edgeX(xNear, y) + (rnd() - 0.5) * 4;
      const h = (Math.abs(xNear - AXIS) > 200 ? 92 : 124) * proj(y) * (0.9 + rnd() * 0.18);
      trees.push(cypress(x, y, h));
    }
  }
  return g({}, trees);
}

function foregroundPeople() {
  const rnd = prng(9);
  const folk = [];
  const tones = ["#3c3a40", "#5b4a44", "#3d4a5c", "#6a4b46", "#2f3a30"];
  for (let i = 0; i < 10; i += 1) {
    folk.push(figure(20 + i * 26 + rnd() * 12, 792 + rnd() * 14, 26 + rnd() * 12, tones[i % 5]));
  }
  for (let i = 0; i < 8; i += 1) {
    folk.push(figure(1060 + i * 26 + rnd() * 10, 786 + rnd() * 16, 24 + rnd() * 12, tones[(i + 2) % 5]));
  }
  return g({}, folk);
}
