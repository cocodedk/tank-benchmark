import { TOWER_TOP } from "./model.js";
import { C } from "./palette.js";

export function slateCourses(ctx, path, lod) {
  if (lod < 3) return;
  ctx.save();
  ctx.beginPath();
  path();
  ctx.clip();
  ctx.strokeStyle = "rgba(22, 31, 33, 0.3)";
  ctx.lineWidth = lod >= 12 ? 0.2 : lod >= 6 ? 0.35 : 0.6;
  const step = lod >= 12 ? 3 : lod >= 7 ? 5 : 7;
  ctx.beginPath();
  for (let y = TOWER_TOP - 6; y > -420; y -= step) {
    ctx.moveTo(-5000, y);
    ctx.lineTo(5000, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawRearPinnacles(ctx, cx) {
  for (const sign of [-1, 1]) {
    const x = cx + sign * 30;
    ctx.fillStyle = C.stone;
    ctx.beginPath();
    ctx.moveTo(x - 6, TOWER_TOP);
    ctx.lineTo(x + 6, TOWER_TOP);
    ctx.lineTo(x + 4, -378);
    ctx.lineTo(x, -388);
    ctx.lineTo(x - 4, -378);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(55, 45, 31, 0.45)";
    ctx.fillRect(x - 1, -370, 2, 8);
  }
}

function drawDormer(ctx, x, roofLine, lod) {
  const base = roofLine;
  ctx.fillStyle = C.stone;
  ctx.fillRect(x - 8, base - 14, 16, 14);
  ctx.fillStyle = C.slate;
  ctx.beginPath();
  ctx.moveTo(x - 11, base - 14);
  ctx.lineTo(x + 11, base - 14);
  ctx.lineTo(x, base - 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(31, 49, 54, 0.9)";
  ctx.fillRect(x - 4, base - 11, 8, 8);
  if (lod >= 5) {
    ctx.strokeStyle = "rgba(210, 196, 162, 0.6)";
    ctx.lineWidth = 0.6;
    ctx.strokeRect(x - 4, base - 11, 8, 8);
    ctx.beginPath();
    ctx.moveTo(x, base - 11);
    ctx.lineTo(x, base - 3);
    ctx.stroke();
  }
}

function drawMainRoof(ctx, cx, lod) {
  const base = -304;
  const ridge = -366;
  const half = 60;
  const ridgeHalf = 26;
  const roof = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
  roof.addColorStop(0, C.slateLight);
  roof.addColorStop(0.5, C.slate);
  roof.addColorStop(1, C.slateDark);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(cx - half, base);
    ctx.lineTo(cx + half, base);
    ctx.lineTo(cx + ridgeHalf, ridge);
    ctx.lineTo(cx - ridgeHalf, ridge);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = roof;
  ctx.fill();
  slateCourses(ctx, shape, lod);

  ctx.strokeStyle = "rgba(17, 25, 27, 0.5)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - half, base);
  ctx.lineTo(cx - ridgeHalf, ridge);
  ctx.lineTo(cx + ridgeHalf, ridge);
  ctx.lineTo(cx + half, base);
  ctx.stroke();

  if (lod >= 3) {
    for (const sign of [-1, 1]) {
      const dx = sign * 46;
      const roofLine = base - ((half - Math.abs(dx)) / (half - ridgeHalf)) * (base - ridge);
      drawDormer(ctx, cx + dx, roofLine, lod);
    }
  }

  // A small central finial ties the roofline together.
  ctx.fillStyle = C.stoneLight;
  ctx.beginPath();
  ctx.moveTo(cx - 5, ridge);
  ctx.lineTo(cx + 5, ridge);
  ctx.lineTo(cx + 3, -386);
  ctx.lineTo(cx, -393);
  ctx.lineTo(cx - 3, -386);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.bronze;
  ctx.beginPath();
  ctx.arc(cx, -394, 2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRoof(ctx, cx, lod) {
  drawRearPinnacles(ctx, cx);
  drawMainRoof(ctx, cx, lod);
}
