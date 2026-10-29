/* The dark cypress avenue in the foreground. */

import { seeded, shadowEllipse } from "./util.js";

const LEFT = [
  [82, 940, 300, 38],
  [126, 905, 285, 36],
  [172, 878, 275, 35],
  [218, 850, 265, 34],
  [262, 822, 255, 33],
  [305, 795, 245, 32],
  [346, 772, 230, 30],
  [386, 748, 205, 28],
  [108, 812, 210, 27],
  [204, 790, 205, 26],
  [300, 766, 198, 26],
];

const RIGHT = [
  [944, 772, 230, 30],
  [988, 795, 245, 32],
  [1032, 822, 255, 33],
  [1076, 850, 265, 34],
  [1120, 878, 275, 35],
  [1164, 905, 285, 36],
  [1208, 940, 300, 38],
  [1252, 970, 315, 39],
  [902, 766, 198, 26],
  [1010, 790, 205, 26],
  [1122, 812, 210, 27],
  [1234, 834, 215, 28],
];

function cypress(ctx, x, baseY, h, w, zoom, px, seed) {
  const top = baseY - h;
  const rand = seeded(seed);
  shadowEllipse(ctx, x, baseY + 1, w * 0.8, 4, 0.35);

  // Trunk.
  ctx.fillStyle = "#4b3826";
  ctx.fillRect(x - 2.4, baseY - h * 0.18, 4.8, h * 0.18);

  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.bezierCurveTo(x + w * 0.36, top + h * 0.22, x + w * 0.52, top + h * 0.62, x + w * 0.34, baseY);
  ctx.lineTo(x - w * 0.34, baseY);
  ctx.bezierCurveTo(x - w * 0.52, top + h * 0.62, x - w * 0.36, top + h * 0.22, x, top);
  const g = ctx.createLinearGradient(x - w * 0.5, top, x + w * 0.5, baseY);
  g.addColorStop(0, "#476d2f");
  g.addColorStop(0.4, "#2f5222");
  g.addColorStop(1, "#1b2f16");
  ctx.fillStyle = g;
  ctx.fill();

  // Sunlit edge and the denser heart of the tree.
  ctx.fillStyle = "rgba(111,146,69,0.55)";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.04, top + h * 0.04);
  ctx.bezierCurveTo(x - w * 0.26, top + h * 0.3, x - w * 0.3, top + h * 0.64, x - w * 0.2, baseY);
  ctx.lineTo(x - w * 0.06, baseY);
  ctx.bezierCurveTo(x - w * 0.12, top + h * 0.6, x - w * 0.12, top + h * 0.3, x + w * 0.03, top + h * 0.05);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.bezierCurveTo(x + w * 0.36, top + h * 0.22, x + w * 0.52, top + h * 0.62, x + w * 0.34, baseY);
  ctx.lineTo(x - w * 0.34, baseY);
  ctx.bezierCurveTo(x - w * 0.52, top + h * 0.62, x - w * 0.36, top + h * 0.22, x, top);
  ctx.clip();
  if (zoom > 2) {
    ctx.strokeStyle = "rgba(12,28,12,0.45)";
    ctx.lineWidth = Math.max(px * 1.2, 0.4);
    for (let i = 0; i < 60; i++) {
      const yy = top + rand() * h;
      const xx = x + (rand() - 0.5) * w * 0.9;
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx + (rand() - 0.5) * 4, yy + 3 + rand() * 4);
      ctx.stroke();
    }
  }
  if (zoom > 4) {
    ctx.fillStyle = "rgba(148,176,96,0.4)";
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      ctx.arc(x - w * 0.2 + rand() * w * 0.35, top + rand() * h, 0.7 + rand() * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawCypresses(ctx, zoom, px) {
  LEFT.forEach(([x, base, h, w], i) => cypress(ctx, x, base, h, w, zoom, px, 100 + i));
  RIGHT.forEach(([x, base, h, w], i) => cypress(ctx, x, base, h, w, zoom, px, 200 + i));
}
