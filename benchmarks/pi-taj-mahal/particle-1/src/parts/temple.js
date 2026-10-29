// The mausoleum itself: wings of stacked arches, the great central iwan behind
// its portal, the drum, the onion dome with its finial, and the chhatris.
import { el, g, archD, domeD } from "../svg.js";

const BASE = 548;

export function temple() {
  return g({},
    wings(),
    portal(),
    roof(),
    chhatris(),
    drum(),
    dome(),
    finial());
}

function wall(x0, x1, top) {
  return g({},
    el("rect", { x: x0, y: top, width: x1 - x0, height: BASE - top, fill: "url(#marbleFace)" }),
    el("rect", { x: x0, y: top, width: x1 - x0, height: BASE - top, fill: "url(#stone)", opacity: 0.7 }),
    el("rect", { x: x0, y: top, width: x1 - x0, height: BASE - top, fill: "url(#shadow)", opacity: 0.12 }),
    el("rect", { x: x0, y: top, width: x1 - x0, height: 3.5, fill: "#f8f4e9" }));
}

function wings() {
  const out = [];
  for (const [x0, x1] of [[350, 480], [720, 850]]) {
    out.push(wall(x0, x1, 306));
    const bays = x0 === 350 ? [388, 444] : [756, 812];
    for (const cx of bays) {
      out.push(bay(cx, 22, 542, 466, 424));
    }
    // the inlaid band and the blind niches above the arches
    out.push(el("rect", { x: x0 + 8, y: 316, width: x1 - x0 - 16, height: 26, fill: "url(#inlay)", opacity: 0.4 }));
    out.push(el("rect", { x: x0 + 8, y: 316, width: x1 - x0 - 16, height: 26, fill: "none", stroke: "#b9ad93", "stroke-width": 0.7 }));
    for (const cx of bays) {
      out.push(bay(cx, 13, 404, 382, 358));
    }
    out.push(el("rect", { x: x0 + 8, y: 348, width: x1 - x0 - 16, height: 56, fill: "url(#inlay)", opacity: 0.3 }));
    out.push(el("rect", { x: x0 + 8, y: 348, width: x1 - x0 - 16, height: 56, fill: "none", stroke: "#b9ad93", "stroke-width": 0.7 }));
    // a shadowed outer edge, so the wings read as turning away from the light
    out.push(el("rect", { x: x1 - 9, y: 306, width: 9, height: BASE - 306, fill: "#b6ab94", opacity: 0.35 }));
  }
  return g({}, out);
}

/** One pointed arch: marble surround, a shadowed recess, and a pierced screen. */
function bay(cx, halfW, yBase, ySpring, yApex) {
  return g({},
    el("path", { d: archD(cx, halfW + 3.5, yBase, ySpring + 2, yApex - 3), fill: "#f6f1e4" }),
    el("path", { d: archD(cx, halfW, yBase, ySpring, yApex), fill: "#6b6457" }),
    el("path", { d: archD(cx, halfW - 2.2, yBase, ySpring - 1, yApex + 2.5), fill: "#494437" }),
    el("rect", { x: cx - halfW + 3.4, y: yBase - 20, width: (halfW - 3.4) * 2, height: 20, fill: "url(#jali)", opacity: 0.8 }),
    el("path", { d: archD(cx, halfW, yBase, ySpring, yApex), fill: "none", stroke: "#d6ccb5", "stroke-width": 0.7 }));
}

function portal() {
  const cx = 600;
  return g({},
    wall(480, 720, 292),
    // the frame of the pishtaq, stepped in from the edge
    ...[6, 13, 20].map((o) => el("rect", {
      x: 480 + o, y: 292 + o * 0.7, width: 240 - o * 2, height: BASE - 292 - o * 0.7,
      fill: "none", stroke: o === 13 ? "#8c7f61" : "#e4dcc7", "stroke-width": o === 13 ? 1.1 : 0.9,
    })),
    el("rect", { x: 492, y: 300, width: 216, height: 9, fill: "url(#inlay)", opacity: 0.5 }),
    // the recess of the iwan, deeper and cooler than the frame
    el("path", { d: archD(cx, 62, BASE - 2, 428, 348), fill: "#ddd3bb" }),
    el("path", { d: archD(cx, 62, BASE - 2, 428, 348), fill: "none", stroke: "#f9f5e9", "stroke-width": 3 }),
    el("path", { d: archD(cx, 55, BASE - 2, 432, 360), fill: "none", stroke: "#a8997b", "stroke-width": 0.9 }),
    // its inner portal, and behind it a pierced screen and a doorway
    el("path", { d: archD(cx, 42, BASE - 6, 452, 392), fill: "#565040" }),
    el("path", { d: archD(cx, 38, BASE - 6, 450, 396), fill: "#3d382f" }),
    el("rect", { x: cx - 34, y: 470, width: 68, height: BASE - 476, fill: "url(#jali)", opacity: 0.9 }),
    el("rect", { x: cx - 10, y: 502, width: 20, height: BASE - 508, fill: "#221d17" }),
    el("path", { d: archD(cx, 42, BASE - 6, 452, 392), fill: "none", stroke: "#dad0b7", "stroke-width": 1.1 }),
    // spandrel medallions either side of the arch head
    medallion(528, 392, 11),
    medallion(672, 392, 11));
}

/** An eight-petal inlaid flower, the sort that fills the spandrels. */
function medallion(cx, cy, r) {
  const petals = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    const px = cx + Math.cos(a) * r * 0.55, py = cy + Math.sin(a) * r * 0.55;
    petals.push(el("ellipse", {
      cx: px, cy: py, rx: r * 0.3, ry: r * 0.19,
      transform: `rotate(${i * 45} ${px} ${py})`, fill: "#ab6a51", opacity: 0.75,
    }));
  }
  return g({},
    el("circle", { cx, cy, r: r * 1.15, fill: "none", stroke: "#b09a76", "stroke-width": 0.7 }),
    el("circle", { cx, cy, r: r * 0.95, fill: "none", stroke: "#c3b294", "stroke-width": 0.4 }),
    ...petals,
    el("circle", { cx, cy, r: r * 0.26, fill: "#7d9455" }));
}

function roof() {
  return g({},
    el("rect", { x: 344, y: 302, width: 512, height: 7, fill: "#f8f3e6" }),
    el("rect", { x: 344, y: 309, width: 512, height: 3.5, fill: "#c1b59b" }),
    el("rect", { x: 476, y: 288, width: 248, height: 5, fill: "#fbf7ec" }),
    el("path", { d: "M348 302H852", stroke: "#8e8266", "stroke-width": 1, opacity: 0.45 }));
}

/** Two chhatris on the roof either side of the dome, and two small kiosks. */
function chhatris() {
  return g({},
    kiosk(462, 302, 18), kiosk(738, 302, 18),
    kiosk(364, 306, 10), kiosk(836, 306, 10));
}

function kiosk(cx, yBase, r) {
  const yDrum = yBase - r * 0.85;
  return g({},
    el("rect", { x: cx - r - 2, y: yBase - 4, width: (r + 2) * 2, height: 6, fill: "#f4eee0" }),
    el("rect", { x: cx - r, y: yDrum, width: r * 2, height: yBase - yDrum, fill: "url(#marbleFace)" }),
    ...[0, 1, 2, 3].map((i) =>
      el("rect", { x: cx - r + (r * 2 * (i + 0.6)) / 4 - 1, y: yDrum + 1, width: 1.6, height: yBase - yDrum - 1, fill: "#a2957a", opacity: 0.8 })),
    el("path", { d: domeD(cx, yDrum + 1, r, yDrum - r * 1.6), fill: "url(#domeShade)" }),
    el("path", { d: domeD(cx, yDrum + 1, r, yDrum - r * 1.6), fill: "url(#domeBlocks)", opacity: 0.5 }),
    el("line", { x1: cx, y1: yDrum - r * 1.6, x2: cx, y2: yDrum - r * 2.4, stroke: "#8c7a55", "stroke-width": 0.9 }));
}

function drum() {
  const arcs = [];
  for (let x = 520; x < 676; x += 13) {
    arcs.push(el("path", { d: archD(x + 5, 4, 306, 294, 286), fill: "#cdc2a8", opacity: 0.75 }));
  }
  return g({},
    el("rect", { x: 508, y: 260, width: 184, height: 46, fill: "url(#marbleFace)" }),
    el("rect", { x: 508, y: 260, width: 184, height: 46, fill: "url(#stone)", opacity: 0.6 }),
    el("rect", { x: 508, y: 260, width: 184, height: 5, fill: "#f8f3e7" }),
    el("rect", { x: 512, y: 268, width: 176, height: 6, fill: "url(#inlay)", opacity: 0.45 }),
    g({}, arcs),
    el("rect", { x: 504, y: 304, width: 192, height: 4, fill: "#e8e0cd" }));
}

function dome() {
  const d = domeD(600, 260, 116, 88);
  return g({},
    el("path", { d, fill: "url(#domeShade)" }),
    el("path", { d, fill: "url(#domeBlocks)", opacity: 0.5 }),
    el("path", { d, fill: "url(#shadow)", opacity: 0.22 }),
    el("rect", { x: 512, y: 252, width: 176, height: 9, fill: "#f7f2e4" }),
    el("rect", { x: 512, y: 252, width: 176, height: 9, fill: "url(#inlay)", opacity: 0.3 }));
}

function finial() {
  return g({ fill: "#efe7d4" },
    el("rect", { x: 587, y: 80, width: 26, height: 9, rx: 2 }),
    el("rect", { x: 591, y: 72, width: 18, height: 8, rx: 2, fill: "#f6efdd" }),
    ...[0, 1, 2, 3].map((i) => el("rect", { x: 589 + i * 6, y: 60, width: 1.9, height: 12, fill: "#e3d8bf" })),
    el("rect", { x: 585, y: 56, width: 30, height: 4, rx: 2, fill: "#f3ecda" }),
    el("rect", { x: 598.7, y: 30, width: 2.6, height: 26, fill: "#a99b7c" }),
    el("ellipse", { cx: 600, cy: 46, rx: 6, ry: 1.7, fill: "#8f8c7c" }),
    el("ellipse", { cx: 600, cy: 39, rx: 4.2, ry: 1.4, fill: "#8f8c7c" }),
    el("circle", { cx: 600, cy: 32, r: 2.4, fill: "#9b9787" }),
    el("path", { d: "M600 16a7.6 7.6 0 1 0 0 13.4 6.1 6.1 0 1 1 0-13.4Z", fill: "#8f8c7c" }));
}
