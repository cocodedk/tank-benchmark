import { TOWER_BASE } from "./model.js";
import { C } from "./palette.js";
import { slateCourses } from "./roof.js";
import { stoneCourses } from "./stone.js";

export function drawTurret(ctx, tx, lod) {
  const half = 13;
  const shaftTop = -322;
  const face = ctx.createLinearGradient(tx - half, 0, tx + half, 0);
  face.addColorStop(0, C.stoneLight);
  face.addColorStop(0.5, C.stone);
  face.addColorStop(1, C.stoneDark);
  ctx.fillStyle = face;
  ctx.fillRect(tx - half, shaftTop, half * 2, TOWER_BASE - shaftTop);
  stoneCourses(ctx, tx - half, shaftTop, half * 2, TOWER_BASE - shaftTop, lod);

  // Narrow arrow loops up the shaft, finer than the windows on the main face.
  for (let y = -282; y < 45; y += 36) {
    if (lod >= 3) {
      ctx.fillStyle = C.stoneLight;
      ctx.fillRect(tx - 4, y - 2, 8, 16);
    }
    ctx.fillStyle = "rgba(45, 44, 35, 0.65)";
    ctx.fillRect(tx - 1.5, y, 3, 12);
    if (lod >= 6) {
      ctx.fillStyle = "rgba(219, 207, 174, 0.5)";
      ctx.fillRect(tx - 4, y + 12, 8, 1.3);
    }
  }

  // Battlements and a steep lead spire.
  const roofBase = -330;
  const roofHalf = 18;
  const apex = -402;
  const roof = ctx.createLinearGradient(tx - roofHalf, 0, tx + roofHalf, 0);
  roof.addColorStop(0, C.slateLight);
  roof.addColorStop(0.48, C.slate);
  roof.addColorStop(1, C.slateDark);
  const triangle = () => {
    ctx.beginPath();
    ctx.moveTo(tx - roofHalf, roofBase);
    ctx.lineTo(tx + roofHalf, roofBase);
    ctx.lineTo(tx, apex);
    ctx.closePath();
  };
  triangle();
  ctx.fillStyle = roof;
  ctx.fill();
  slateCourses(ctx, triangle, lod);
  ctx.strokeStyle = "rgba(16, 24, 26, 0.4)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(tx, roofBase);
  ctx.lineTo(tx, apex);
  ctx.stroke();

  ctx.fillStyle = C.stone;
  ctx.fillRect(tx - half - 3, roofBase, half * 2 + 6, 5);
  ctx.fillStyle = C.stoneLight;
  for (let i = -1; i <= 1; i += 1) {
    ctx.fillRect(tx + i * 9 - 3, roofBase - 9, 6, 9);
  }

  ctx.strokeStyle = C.iron;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(tx, apex);
  ctx.lineTo(tx, apex - 8);
  ctx.stroke();
  ctx.fillStyle = C.bronze;
  ctx.beginPath();
  ctx.arc(tx, apex - 9, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(64, 76, 59, 0.5)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(tx - roofHalf, roofBase + 8);
  ctx.lineTo(tx + roofHalf, roofBase + 8);
  ctx.stroke();
}
