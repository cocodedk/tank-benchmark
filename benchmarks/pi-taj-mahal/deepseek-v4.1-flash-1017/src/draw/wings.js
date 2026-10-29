/* The two side wings: two storeys of pointed arches on either side. */

import { archPath } from "./util.js";
import { blockJoints, floralSpray, inlayBorder, jali } from "./ornament.js";

function archBay(ctx, x, y, w, h, open, zoom, px) {
  // Outer marble frame.
  ctx.fillStyle = "#f1ebdc";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = Math.max(px, 0.4);
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  // Recessed pointed arch.
  archPath(ctx, x + 5, y + 5, w - 10, h - 5, 0.48);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#7d705c");
  g.addColorStop(0.5, "#5e5344");
  g.addColorStop(1, "#3f362b");
  ctx.fillStyle = g;
  ctx.fill();

  const innerX = x + 10;
  const innerW = w - 20;
  if (open) {
    archPath(ctx, innerX, y + 13, innerW, h - 13, 0.5);
    ctx.fillStyle = "#776a56";
    ctx.fill();
    ctx.strokeStyle = "rgba(244,236,219,0.5)";
    ctx.lineWidth = Math.max(px * 1.2, 0.5);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#4b4135";
    archPath(ctx, innerX, y + 13, innerW, h - 13, 0.5);
    ctx.fill();
    jali(ctx, innerX + 2, y + 16, innerW - 4, h - 19, zoom, px, "rgba(242,233,214,0.62)");
    ctx.strokeStyle = "rgba(244,236,219,0.55)";
    ctx.lineWidth = Math.max(px * 1.2, 0.5);
    archPath(ctx, innerX, y + 13, innerW, h - 13, 0.5);
    ctx.stroke();
  }

  // Inlay strip around the inner arch.
  inlayBorder(ctx, x + 2, y + 2, w - 4, 3, zoom, px, false, 8);
  if (zoom > 3) floralSpray(ctx, x + w / 2, y + 14, 0.35, zoom, px);
}

function wing(ctx, x0, zoom, px) {
  marbleWing(ctx, x0);
  const cols = [x0 + 13, x0 + 75];
  for (const x of cols) {
    archBay(ctx, x, 416, 52, 94, false, zoom, px);
    archBay(ctx, x, 518, 52, 100, true, zoom, px);
  }

  // Central pilaster and the mid-storey balcony line.
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillRect(x0 + 69, 410, 4, 208);
  ctx.fillStyle = "rgba(120,106,86,0.35)";
  ctx.fillRect(x0 + 7, 514, 126, 2);
  if (zoom > 1.6) {
    ctx.fillStyle = "rgba(244,238,225,0.9)";
    for (let x = x0 + 12; x < x0 + 128; x += 7) ctx.fillRect(x, 508, 2, 5);
  }

  // Base moulding.
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(x0 + 2, 620, 136, 2);

  blockJoints(ctx, x0, 398, 138, 40, zoom, px, 30, 14);
  if (zoom > 2) {
    floralSpray(ctx, x0 + 12, 470, 0.7, zoom, px);
    floralSpray(ctx, x0 + 126, 470, 0.7, zoom, px);
  }
}

function marbleWing(ctx, x0) {
  const g = ctx.createLinearGradient(x0, 398, x0 + 138, 632);
  g.addColorStop(0, "#ece5d4");
  g.addColorStop(0.55, "#f3eddf");
  g.addColorStop(1, "#ddd4c0");
  ctx.fillStyle = g;
  ctx.fillRect(x0, 398, 138, 234);

  ctx.fillStyle = "rgba(90,78,60,0.18)";
  ctx.fillRect(x0, 398, 138, 7);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(x0, 398, 138, 2);
  ctx.fillRect(x0, 626, 138, 3);
  ctx.fillStyle = "rgba(130,116,95,0.4)";
  ctx.fillRect(x0, 398, 3, 234);
  ctx.fillRect(x0 + 135, 398, 3, 234);
}

export function drawWings(ctx, zoom, px) {
  wing(ctx, 356, zoom, px);
  wing(ctx, 796, zoom, px);
}
