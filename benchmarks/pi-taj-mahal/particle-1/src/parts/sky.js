// The clear north-Indian sky, the thin dark band of garden trees on the horizon,
// the two big trees on the right and the low buildings far off to the left.
import { el, g, prng } from "../svg.js";

export function sky() {
  return g({},
    el("rect", { x: -1400, y: -1200, width: 4000, height: 1900, fill: "url(#sky)" }),
    // heat haze lying on the horizon
    g({ fill: "url(#haze)" }, el("rect", { x: -1400, y: 430, width: 4000, height: 170 })),
    distant({ x: 100, w: 330, n: 26, h: 34, fill: "#587a48", seed: 11 }),
    distant({ x: 820, w: 340, n: 26, h: 32, fill: "#517242", seed: 12 }),
    bareTree(214, 590),
    // the pale tomb and its wall far off on the left
    g({ opacity: 0.5, fill: "#cfd6cf" },
      el("rect", { x: 12, y: 556, width: 44, height: 34 }),
      el("ellipse", { cx: 34, cy: 556, rx: 16, ry: 13 }),
      el("rect", { x: 60, y: 570, width: 44, height: 22 })),
    el("rect", { x: -1400, y: 585, width: 4000, height: 12, fill: "#4f6b40", opacity: 0.9 }));
}

export function rightTrees() {
  return g({}, trees());
}

function bareTree(x, y) {
  return g({ stroke: "#4a4335", "stroke-width": 1.6, fill: "none", opacity: 0.75 },
    el("path", { d: `M${x} ${y}V${y - 46}` }),
    el("path", { d: `M${x} ${y - 26}l-13-16M${x} ${y - 34}l12-15M${x} ${y - 18}l10-10`, "stroke-width": 1.2 }));
}

function distant({ x, w, n, h, fill, seed }) {
  const rnd = prng(seed);
  const blobs = [];
  for (let i = 0; i < n; i += 1) {
    const r = h * (0.55 + rnd() * 0.75);
    blobs.push(el("ellipse", {
      cx: x + (i / (n - 1)) * w + (rnd() - 0.5) * 8,
      cy: 588 - r * 0.55 - rnd() * 10,
      rx: r, ry: r * 0.72, fill,
    }));
  }
  return g({ opacity: 0.9 }, blobs);
}

/** The dark mass of trees on the right of the marble platform, touching the sky. */
function trees() {
  const rnd = prng(7);
  const clumps = [];
  const spots = [
    [1074, 512, 52], [1126, 490, 62], [1180, 496, 58], [1226, 520, 52],
    [1040, 546, 40], [1092, 540, 46], [1148, 542, 52], [1204, 556, 48],
    [1064, 578, 34], [1122, 584, 40], [1178, 590, 42], [1234, 596, 38],
  ];
  for (const [cx, cy, r] of spots) {
    clumps.push(el("ellipse", { cx, cy, rx: r, ry: r * 0.82, fill: "#34502b" }));
    for (let i = 0; i < 7; i += 1) {
      clumps.push(el("ellipse", {
        cx: cx + (rnd() - 0.5) * r * 1.5,
        cy: cy + (rnd() - 0.5) * r * 1.2,
        rx: 5 + rnd() * 9, ry: 4 + rnd() * 7,
        fill: rnd() > 0.55 ? "#2b4524" : "#3f5c31", opacity: 0.85,
      }));
    }
  }
  return g({}, clumps);
}
