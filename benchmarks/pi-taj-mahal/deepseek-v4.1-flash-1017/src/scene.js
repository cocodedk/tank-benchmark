/* Compose the picture, in the order a camera would see it. */

import { drawBuilding } from "./draw/building.js";
import { drawCypresses } from "./draw/cypress.js";
import { drawChhatris } from "./draw/chhatris.js";
import { drawGreatDome } from "./draw/dome.js";
import { drawGarden } from "./draw/garden.js";
import { drawMinarets } from "./draw/minarets.js";
import { drawGardenCrowd, drawTerraceCrowd } from "./draw/people.js";
import { drawPlinth } from "./draw/plinth.js";
import { drawSky } from "./draw/sky.js";
import { drawTerrain } from "./draw/terrain.js";
import { scaleFor, WORLD } from "./view.js";

export function drawScene(ctx, view, cw, ch, dpr) {
  const scale = scaleFor(view, cw, ch);
  const px = 1 / scale;
  const zoom = view.zoom;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.scale(scale, scale);
  ctx.translate(-(view.x + WORLD.w / 2), -(view.y + WORLD.h / 2));

  drawSky(ctx, zoom, px);
  drawTerrain(ctx, zoom, px);
  drawGarden(ctx, zoom, px);
  drawPlinth(ctx, zoom, px);
  drawBuilding(ctx, zoom, px);
  drawGreatDome(ctx, zoom, px);
  drawChhatris(ctx, zoom, px);
  drawMinarets(ctx, zoom, px);
  drawTerraceCrowd(ctx, zoom, px);
  drawCypresses(ctx, zoom, px);
  drawGardenCrowd(ctx, zoom, px);

  ctx.restore();
}
