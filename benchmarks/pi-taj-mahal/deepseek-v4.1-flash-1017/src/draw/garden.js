/* Lawn, red sandstone avenue and the hedges along the terrace. */

import { PAL, polygon, seeded } from "./util.js";
import { drawWater } from "./water.js";

const avenueLeft = (y) => 430 - (y - 664) * 0.046;
const avenueRight = (y) => 860 + (y - 664) * 0.046;

const avenue = () => [
  [avenueLeft(664), 664], [avenueRight(664), 664],
  [avenueRight(2400), 2400], [avenueLeft(2400), 2400],
];

function paving(ctx, zoom, px) {
  if (zoom < 1.7) return;
  ctx.save();
  polygon(ctx, avenue());
  ctx.clip();
  ctx.strokeStyle = "rgba(70,35,24,0.35)";
  ctx.lineWidth = Math.max(px * 0.8, 0.35);
  for (let y = 700; y < 1300; y += 26) {
    ctx.beginPath();
    ctx.moveTo(avenueLeft(y), y);
    ctx.lineTo(avenueRight(y), y);
    ctx.stroke();
  }
  const rows = zoom > 3 ? 8 : 4;
  for (let i = 1; i < rows; i++) {
    const y = 680 + i * 26;
    ctx.beginPath();
    ctx.moveTo(avenueLeft(y) + 30, y);
    ctx.lineTo(avenueLeft(y) + 30, y + 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(avenueRight(y) - 30, y);
    ctx.lineTo(avenueRight(y) - 30, y + 26);
    ctx.stroke();
  }
  ctx.restore();
}

function hedge(ctx, zoom, px) {
  const rand = seeded(9);
  for (let x = 300; x < 1000; x += 17) {
    const r = 8 + rand() * 4;
    ctx.fillStyle = x % 34 < 17 ? "#3a6224" : "#2f5220";
    ctx.beginPath();
    ctx.ellipse(x, 681, r, 9, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  if (zoom > 2.2) {
    ctx.fillStyle = "rgba(234,232,214,0.7)";
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(305 + rand() * 690, 671 + rand() * 12, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawGarden(ctx, zoom, px) {
  const lawn = ctx.createLinearGradient(0, 660, 0, 900);
  lawn.addColorStop(0, "#5e8536");
  lawn.addColorStop(0.28, "#48742a");
  lawn.addColorStop(1, "#365c20");
  ctx.fillStyle = lawn;
  ctx.fillRect(-6000, 660, 15000, 4000);

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "#d9edb7";
  for (let x = -6000; x < 9000; x += 120) ctx.fillRect(x, 660, 55, 4000);
  ctx.restore();

  polygon(ctx, avenue());
  const g = ctx.createLinearGradient(0, 664, 0, 1000);
  g.addColorStop(0, "#a3543e");
  g.addColorStop(1, "#91452f");
  ctx.fillStyle = g;
  ctx.fill();

  paving(ctx, zoom, px);
  drawWater(ctx, zoom, px);
  hedge(ctx, zoom, px);

  if (zoom > 1.6) {
    const rand = seeded(19);
    ctx.fillStyle = "rgba(228,206,112,0.75)";
    for (let i = 0; i < 70; i++) {
      const x = rand() < 0.5 ? 330 + rand() * 90 : 880 + rand() * 90;
      ctx.fillRect(x, 716 + rand() * 60, 1.2, 1.2);
    }
    ctx.fillStyle = "rgba(200,92,72,0.6)";
    for (let i = 0; i < 45; i++) {
      const x = rand() < 0.5 ? 330 + rand() * 90 : 880 + rand() * 90;
      ctx.fillRect(x, 716 + rand() * 60, 1.2, 1.2);
    }
  }
}
