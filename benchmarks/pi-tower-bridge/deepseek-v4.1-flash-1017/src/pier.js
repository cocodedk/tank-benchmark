import { TOWER_BASE, WATER_Y } from "./model.js";
import { C } from "./palette.js";
import { stoneCourses } from "./stone.js";

export function drawPier(ctx, cx, lod) {
  const g = ctx.createLinearGradient(cx - 104, 0, cx + 104, 0);
  g.addColorStop(0, C.stoneDark);
  g.addColorStop(0.45, C.stoneMid);
  g.addColorStop(1, C.stoneShadow);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - 86, TOWER_BASE);
  ctx.lineTo(cx + 86, TOWER_BASE);
  ctx.lineTo(cx + 104, WATER_Y + 24);
  ctx.lineTo(cx - 104, WATER_Y + 24);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.clip();
  stoneCourses(ctx, cx - 104, TOWER_BASE, 208, WATER_Y + 24 - TOWER_BASE, lod);
  ctx.strokeStyle = "rgba(63, 51, 36, 0.35)";
  ctx.lineWidth = 0.8;
  for (let x = cx - 84; x <= cx + 84; x += 17) {
    ctx.beginPath();
    ctx.moveTo(x, TOWER_BASE + 2);
    ctx.lineTo(x, WATER_Y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = C.stoneLight;
  ctx.fillRect(cx - 92, TOWER_BASE - 7, 184, 7);
  ctx.fillStyle = "rgba(64, 82, 62, 0.42)";
  ctx.fillRect(cx - 102, WATER_Y - 4, 204, 7);
  ctx.fillStyle = "rgba(240, 248, 244, 0.28)";
  ctx.fillRect(cx - 100, WATER_Y, 200, 1.5);
}
