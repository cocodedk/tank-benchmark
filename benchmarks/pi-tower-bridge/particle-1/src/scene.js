/* Paints the whole model, back to front. */

import { drawBackground } from "./background.js";
import { drawChains, drawDeck } from "./spans.js";
import { drawTowers } from "./towers.js";
import { drawWalkways } from "./walkways.js";

export function drawScene(ctx, cam, w, h) {
  drawBackground(ctx, cam, w, h);
  drawChains(ctx, cam, w, h);
  drawTowers(ctx, cam, w, h);
  drawWalkways(ctx, cam, w, h);
  drawDeck(ctx, cam, w, h);
}
