// The long marble platform the mausoleum stands on: cornice, balustrade of
// lathe-turned posts, an inlaid band, the red sandstone base with its gateway,
// the marble stair and the small crowd along the edge.
import { el, g, prng, archD, figure } from "../svg.js";

export const PLINTH = { x0: 118, x1: 1082, top: 546, foot: 600, red: 648 };

export function plinth() {
  const rnd = prng(5);
  const posts = [];
  for (let x = PLINTH.x0 + 12; x < PLINTH.x1 - 8; x += 7) {
    posts.push(g({},
      el("rect", { x, y: 558, width: 4.4, height: 20, rx: 1.5, fill: "#eee8d8" }),
      el("ellipse", { cx: x + 2.2, cy: 567, rx: 3.1, ry: 4, fill: "#f4efe1" }),
      el("rect", { x: x - 0.8, y: 555, width: 6, height: 3, fill: "#f8f4e7" }),
      el("rect", { x: x - 0.8, y: 576, width: 6, height: 3.4, fill: "#e3dac6" })));
  }
  const crowd = [];
  for (let i = 0; i < 46; i += 1) {
    const x = PLINTH.x0 + 16 + rnd() * (PLINTH.x1 - PLINTH.x0 - 32);
    crowd.push(figure(x, 550, 5 + rnd() * 4.5, ["#33333a", "#5a453f", "#2f4050", "#6b3f3a"][i % 4]));
  }
  for (let i = 0; i < 20; i += 1) {
    crowd.push(figure(150 + rnd() * 900, 604 + rnd() * 26, 5 + rnd() * 4,
      ["#33333a", "#6b3f3a", "#3a5a44"][i % 3]));
  }
  return g({},
    el("rect", { x: PLINTH.x0, y: PLINTH.top, width: PLINTH.x1 - PLINTH.x0, height: 12, fill: "#faf6ec" }),
    el("rect", { x: PLINTH.x0, y: PLINTH.top + 12, width: PLINTH.x1 - PLINTH.x0, height: 34, fill: "#c9c2ae" }),
    el("rect", { x: PLINTH.x0, y: PLINTH.top + 12, width: PLINTH.x1 - PLINTH.x0, height: 34, fill: "url(#shadow)" }),
    g({}, posts),
    el("rect", { x: PLINTH.x0, y: 578, width: PLINTH.x1 - PLINTH.x0, height: 10, fill: "#f4eee0" }),
    el("rect", { x: PLINTH.x0, y: 578, width: PLINTH.x1 - PLINTH.x0, height: 10, fill: "url(#inlay)", opacity: 0.22 }),
    // the shadow the mausoleum throws across the platform
    el("rect", { x: 380, y: 546, width: 470, height: 12, fill: "#8f8570", opacity: 0.22 }),
    el("rect", { x: PLINTH.x0, y: 588, width: PLINTH.x1 - PLINTH.x0, height: 12, fill: "url(#plinthFace)" }),
    el("rect", { x: PLINTH.x0, y: 596, width: PLINTH.x1 - PLINTH.x0, height: 4, fill: "#cdc3ac" }),
    redBase(),
    g({}, crowd));
}

function redBase() {
  const arcade = [];
  for (let x = PLINTH.x0 + 30; x < PLINTH.x1 - 40; x += 15) {
    arcade.push(el("path", { d: archD(x + 5, 4.4, 636, 626, 618), fill: "#7c4130", opacity: 0.55 }));
  }
  return g({},
    g({}, arcade),
    el("rect", { x: PLINTH.x0 + 18, y: 600, width: PLINTH.x1 - PLINTH.x0 - 36, height: 44, fill: "url(#sandstone)" }),
    el("rect", { x: PLINTH.x0 + 18, y: 600, width: PLINTH.x1 - PLINTH.x0 - 36, height: 5, fill: "#6f3a2b", opacity: 0.55 }),
    el("rect", { x: PLINTH.x0 + 18, y: 638, width: PLINTH.x1 - PLINTH.x0 - 36, height: 6, fill: "#8b4a37" }),
    el("line", { x1: PLINTH.x0, y1: 648, x2: PLINTH.x1, y2: 648, stroke: "#6b3527", "stroke-width": 2, opacity: 0.5 }),
    // the gateway that leads under the platform, and its stair
    el("rect", { x: 572, y: 604, width: 56, height: 44, fill: "#f0e9d8" }),
    el("path", { d: archD(600, 21, 648, 626, 610), fill: "#2a231d" }),
    el("path", { d: archD(600, 25, 648, 628, 606), fill: "none", stroke: "#e5dcc7", "stroke-width": 2.4 }),
    g({ opacity: 0.5, fill: "#6f3a2b" },
      el("rect", { x: 574, y: 606, width: 52, height: 6 }),
      el("rect", { x: 574, y: 632, width: 52, height: 4 })),
    // marble steps down from the platform
    g({ fill: "#eee7d5" },
      ...Array.from({ length: 6 }, (v, i) =>
        el("rect", { x: 548 - i * 9, y: 648 + i * 2.4, width: 104 + i * 18, height: 2.6 })),
      el("rect", { x: 488, y: 662, width: 224, height: 4, fill: "#d8cfba" })),
    el("path", { d: "M548 648L488 662H486L546 646Z", fill: "#f3ecdb" }),
    el("path", { d: "M652 648L712 662H714L654 646Z", fill: "#e7dfcc" }));
}
