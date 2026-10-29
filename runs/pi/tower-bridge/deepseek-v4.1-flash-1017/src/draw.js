import { TOWER_X } from "./model.js";
import { drawDeck } from "./deck.js";
import { drawFoam, drawRiver } from "./river.js";
import { drawSky } from "./sky.js";
import { drawAbutment, drawSuspension } from "./suspension.js";
import { drawTower } from "./tower.js";
import { drawWalkway } from "./walkway.js";

export function drawScene(ctx, cam) {
  const lod = cam.zoom;

  drawSky(ctx, lod);
  drawRiver(ctx, cam, lod);

  for (const sign of [-1, 1]) {
    drawAbutment(ctx, sign, lod);
    drawTower(ctx, sign * TOWER_X, lod);
    drawSuspension(ctx, sign, lod);
  }

  drawDeck(ctx, lod);
  drawWalkway(ctx, lod);

  drawFoam(ctx, -TOWER_X, lod);
  drawFoam(ctx, TOWER_X, lod);
}
