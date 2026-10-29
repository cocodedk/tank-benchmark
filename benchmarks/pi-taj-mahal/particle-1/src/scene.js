// Paints the whole drawing into the page's <svg>, back to front.
import { el } from "./svg.js";
import { paint } from "./paint.js";
import { sky, rightTrees } from "./parts/sky.js";
import { gardenBack, gardenFront } from "./parts/garden.js";
import { plinth } from "./parts/plinth.js";
import { temple } from "./parts/temple.js";
import { minarets } from "./parts/minarets.js";

export const PARTS = [
  "clear sky",
  "trees on the horizon",
  "charbagh lawn",
  "red sandstone walkways",
  "reflecting pool",
  "fountain jets",
  "cypress avenue",
  "marble platform",
  "balustrade",
  "gateway and stair",
  "visitors",
  "central dome",
  "drum with blind arcade",
  "finial and crescent",
  "great iwan and its portal",
  "stacked side arches",
  "chhatris",
  "four minarets",
];

export function paintScene(svg) {
  svg.append(paint());
  svg.append(el("g", { id: "drawing" },
    sky(),
    gardenBack(),
    plinth(),
    minarets(),
    temple(),
    rightTrees(),
    gardenFront()));
}
