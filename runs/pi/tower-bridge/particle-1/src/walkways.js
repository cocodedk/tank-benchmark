/* The two enclosed high-level walkways between the towers. */

import { G } from "./world.js";
import { worldLine } from "./shapes.js";

export function drawWalkways(ctx, cam, w, h) {
  const inner = G.towerX - G.towerHalf + 4;
  // The far walkway, a little higher and darker, then the near one.
  drawWalkway(ctx, cam, w, h, -inner, inner, G.walkwayTop - 7, G.walkwayBottom - 7, true);
  drawWalkway(ctx, cam, w, h, -inner, inner, G.walkwayTop, G.walkwayBottom, false);
}

function drawWalkway(ctx, cam, w, h, x0, x1, top, bottom, behind) {
  const z = cam.zoom;
  const S = (x, y) => cam.toScreen(x, y, w, h);
  const [sx0, syTop] = S(x0, top);
  const [sx1, syBottom] = S(x1, bottom);
  const glassTop = top + 13;
  const glassBottom = bottom - 10;
  const [gx0, gy0] = S(x0, glassTop);
  const [gx1, gy1] = S(x1, glassBottom);

  // Glazed band.
  ctx.fillStyle = behind ? "#66818a" : "#7d9ba1";
  ctx.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  const shine = ctx.createLinearGradient(0, gy0, 0, gy1);
  shine.addColorStop(0, "rgba(225,242,244,0.55)");
  shine.addColorStop(0.7, "rgba(120,155,160,0.22)");
  shine.addColorStop(1, "rgba(30,52,56,0.3)");
  ctx.fillStyle = shine;
  ctx.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);

  // Lattice mullions and diagonal bracing.
  const panel = 24;
  ctx.strokeStyle = behind ? "rgba(36,54,56,0.5)" : "rgba(30,48,50,0.62)";
  ctx.lineWidth = z > 2 ? 1.2 : 1;
  if (z > 1.4) {
    for (let x = x0; x <= x1 + 0.1; x += panel) {
      worldLine(ctx, cam, w, h, x, top, x, bottom);
      ctx.stroke();
      if (z > 2) {
        const next = Math.min(x + panel, x1);
        worldLine(ctx, cam, w, h, x, glassTop, next, glassBottom);
        ctx.stroke();
        worldLine(ctx, cam, w, h, x, glassBottom, next, glassTop);
        ctx.stroke();
      }
    }
  }

  // Deck slab and top chord.
  drawBand(ctx, cam, w, h, x0, x1, bottom - 9, 9, behind ? "#4c5a55" : "#5d6d66");
  drawBand(ctx, cam, w, h, x0, x1, top, 5, behind ? "#4c5a55" : "#5d6d66");
  if (!behind) {
    ctx.strokeStyle = "rgba(232,240,238,0.5)";
    ctx.lineWidth = 1;
    worldLine(ctx, cam, w, h, x0, (top + bottom) / 2, x1, (top + bottom) / 2);
    ctx.stroke();
  }

  // Shallow gabled roof with an overhang.
  const ridge = top - 12;
  const [rx0, ry0] = S(x0 - 6, top - 2);
  const [rx1, ry1] = S(x1 + 6, top - 2);
  const [rpx, rpy] = S((x0 + x1) / 2, ridge);
  ctx.beginPath();
  ctx.moveTo(rx0, ry0);
  ctx.lineTo(rx1, ry1);
  ctx.lineTo(rpx, rpy);
  ctx.closePath();
  ctx.fillStyle = behind ? "#52645e" : "#62756d";
  ctx.fill();
  ctx.strokeStyle = "rgba(38,52,48,0.55)";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (!behind && z > 2.2) {
    // Roof ribs.
    ctx.strokeStyle = "rgba(222,232,226,0.18)";
    for (let x = x0 + 20; x < x1; x += 24) {
      worldLine(ctx, cam, w, h, x, top - 2, (x0 + x1) / 2, ridge);
      ctx.stroke();
    }
    // Rivets along the bottom chord.
    ctx.fillStyle = "rgba(214,222,214,0.5)";
    for (let x = x0 + 10; x < x1; x += 14) {
      const [px, py] = S(x, bottom - 4);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.8, 0.8 * cam.scale(w, h)), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // End posts where the walkway meets each tower.
  for (const x of [x0, x1]) {
    drawBand(ctx, cam, w, h, x - 3, x + 3, top - 2, bottom - top + 6, behind ? "#4b5a54" : "#596962");
  }
}

function drawBand(ctx, cam, w, h, x0, x1, y, height, fill) {
  const [sx0, sy] = cam.toScreen(x0, y, w, h);
  const [sx1, sy2] = cam.toScreen(x1, y + height, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(sx0, sy, sx1 - sx0, sy2 - sy);
}
