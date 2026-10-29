/* Clear north-Indian sky and a couple of distant birds. */

import { PAL } from "./util.js";

function bird(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.quadraticCurveTo(x - size * 0.45, y - size * 0.75, x, y);
  ctx.quadraticCurveTo(x + size * 0.45, y - size * 0.75, x + size, y);
}

export function drawSky(ctx, zoom, px) {
  const sky = ctx.createLinearGradient(0, -500, 0, 665);
  sky.addColorStop(0, PAL.skyTop);
  sky.addColorStop(0.58, PAL.skyMid);
  sky.addColorStop(1, PAL.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(-6000, -6000, 15000, 6665);

  const haze = ctx.createLinearGradient(0, 430, 0, 670);
  haze.addColorStop(0, "rgba(255,250,238,0)");
  haze.addColorStop(1, "rgba(255,248,233,0.42)");
  ctx.fillStyle = haze;
  ctx.fillRect(-6000, 430, 15000, 240);

  if (zoom < 14) {
    ctx.save();
    ctx.strokeStyle = `rgba(45,58,70,${zoom < 6 ? 0.6 : 0.35})`;
    ctx.lineWidth = Math.max(px * 1.1, 0.7);
    ctx.lineCap = "round";
    bird(ctx, 824, 126, 4);
    bird(ctx, 839, 118, 3);
    bird(ctx, 853, 125, 2.5);
    ctx.restore();
  }
}
