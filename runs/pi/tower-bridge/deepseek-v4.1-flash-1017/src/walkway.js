import { TOWER_INNER, WALKWAY_BOTTOM, WALKWAY_TOP } from "./model.js";
import { C } from "./palette.js";

export function drawWalkway(ctx, lod) {
  const x0 = -TOWER_INNER;
  const x1 = TOWER_INNER;
  ctx.fillStyle = C.steel;
  ctx.fillRect(x0, WALKWAY_TOP, x1 - x0, WALKWAY_BOTTOM - WALKWAY_TOP);
  ctx.fillStyle = C.steelLight;
  ctx.fillRect(x0, WALKWAY_TOP, x1 - x0, 1.4);
  ctx.fillStyle = C.iron;
  ctx.fillRect(x0, WALKWAY_BOTTOM - 2, x1 - x0, 2);

  if (lod >= 2) {
    ctx.strokeStyle = "rgba(22, 34, 37, 0.55)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let x = x0 + 12; x < x1; x += 24) {
      ctx.moveTo(x, WALKWAY_TOP + 3);
      ctx.lineTo(x + 24, WALKWAY_BOTTOM - 3);
      ctx.moveTo(x + 24, WALKWAY_TOP + 3);
      ctx.lineTo(x, WALKWAY_BOTTOM - 3);
    }
    for (let x = x0 + 12; x <= x1; x += 24) {
      ctx.moveTo(x, WALKWAY_TOP);
      ctx.lineTo(x, WALKWAY_BOTTOM);
    }
    ctx.stroke();
  }

  // Its delicate railing appears as the camera comes closer.
  ctx.strokeStyle = C.iron;
  ctx.lineWidth = lod >= 5 ? 0.9 : 1.3;
  ctx.beginPath();
  ctx.moveTo(x0, WALKWAY_TOP - 15);
  ctx.lineTo(x1, WALKWAY_TOP - 15);
  ctx.stroke();
  if (lod >= 2) {
    const step = lod >= 6 ? 8 : 16;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += step) {
      ctx.moveTo(x, WALKWAY_TOP - 15);
      ctx.lineTo(x, WALKWAY_TOP);
    }
    ctx.stroke();
  }
}
