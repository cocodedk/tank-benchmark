/* Chhatri kiosks and the slender corner spires around the dome. */

import { domePath, finial } from "./dome.js";

function chhatri(ctx, cx, floorY, w, domeH, zoom, px, towerTo) {
  if (towerTo) {
    const g = ctx.createLinearGradient(cx - w, floorY, cx + w, towerTo);
    g.addColorStop(0, "#efe8d8");
    g.addColorStop(1, "#d7ceba");
    ctx.fillStyle = g;
    ctx.fillRect(cx - w * 0.44, floorY, w * 0.88, towerTo - floorY);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(cx - w * 0.44, floorY, 2, towerTo - floorY);
    ctx.fillStyle = "rgba(100,86,68,0.25)";
    ctx.fillRect(cx + w * 0.43, floorY, 2, towerTo - floorY);
  }

  ctx.fillStyle = "#efe9da";
  ctx.fillRect(cx - w / 2, floorY - 5, w, 7);
  ctx.fillStyle = "rgba(110,96,76,0.3)";
  ctx.fillRect(cx - w / 2, floorY - 5, w, 1.5);

  const pierTop = floorY - 44;
  for (let i = 0; i < 4; i++) {
    const px0 = cx - w / 2 + 3 + i * ((w - 6) / 4);
    ctx.fillStyle = "rgba(70,60,47,0.55)";
    ctx.fillRect(px0 + 3, pierTop + 5, (w - 6) / 4 - 6, floorY - pierTop - 10);
    ctx.fillStyle = "#ece5d5";
    ctx.fillRect(px0, pierTop, 4, floorY - pierTop - 4);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(px0, pierTop, 1, floorY - pierTop - 4);
  }

  ctx.fillStyle = "#f1ebdc";
  ctx.fillRect(cx - w / 2 - 2, floorY - 50, w + 4, 7);

  const dr = w * 0.46;
  domePath(ctx, cx, floorY - 50, dr, domeH);
  const g = ctx.createLinearGradient(cx - dr, floorY - 50 - domeH, cx + dr, floorY - 50);
  g.addColorStop(0, "#fbf7eb");
  g.addColorStop(0.6, "#eee7d7");
  g.addColorStop(1, "#cbc1ac");
  ctx.fillStyle = g;
  ctx.fill();
  if (zoom > 2) {
    ctx.strokeStyle = "rgba(120,106,86,0.2)";
    ctx.lineWidth = Math.max(px, 0.3);
    for (let y = floorY - 50 - domeH + 8; y < floorY - 50; y += 8) {
      ctx.beginPath();
      ctx.moveTo(cx - dr, y);
      ctx.quadraticCurveTo(cx, y + 3, cx + dr, y);
      ctx.stroke();
    }
  }
  finial(ctx, cx, floorY - 50 - domeH + 3, 0.5, zoom, px);
}

function spire(ctx, cx, topY, baseY, zoom, px) {
  ctx.fillStyle = "#ece5d5";
  ctx.beginPath();
  ctx.moveTo(cx - 3.5, baseY);
  ctx.lineTo(cx - 2.2, topY);
  ctx.lineTo(cx + 2.2, topY);
  ctx.lineTo(cx + 3.5, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(cx - 2.6, topY, 1.4, baseY - topY);
  ctx.fillStyle = "#e7e0d0";
  ctx.fillRect(cx - 5, topY + 8, 10, 2);
  ctx.fillRect(cx - 4, topY + 20, 8, 2);
  domePath(ctx, cx, topY, 5.5, 12);
  ctx.fillStyle = "#f4eee1";
  ctx.fill();
  finial(ctx, cx, topY - 9, 0.22, zoom, px);
}

export function drawChhatris(ctx, zoom, px) {
  chhatri(ctx, 466, 350, 74, 42, zoom, px, 400);
  chhatri(ctx, 824, 350, 74, 42, zoom, px, 400);
  chhatri(ctx, 398, 398, 50, 26, zoom, px, 0);
  chhatri(ctx, 892, 398, 50, 26, zoom, px, 0);

  spire(ctx, 372, 356, 400, zoom, px);
  spire(ctx, 918, 356, 400, zoom, px);
  spire(ctx, 508, 334, 400, zoom, px);
  spire(ctx, 782, 334, 400, zoom, px);
}
