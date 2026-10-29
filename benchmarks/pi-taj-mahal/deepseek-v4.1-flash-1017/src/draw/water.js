/* The reflecting pool: marble curb, water, reflection, ripples and fountain. */

import { archPath, polygon, seeded } from "./util.js";

export const poolLeft = (y) => 645 - (88 + (y - 700) * 0.06);
export const poolRight = (y) => 645 + (88 + (y - 700) * 0.06);

const pool = () => [
  [poolLeft(700), 700], [poolRight(700), 700],
  [poolRight(2400), 2400], [poolLeft(2400), 2400],
];

function curb(ctx) {
  polygon(ctx, [
    [poolLeft(700) - 14, 696], [poolRight(700) + 14, 696],
    [poolRight(2400) + 14, 2400], [poolLeft(2400) - 14, 2400],
  ]);
  const g = ctx.createLinearGradient(0, 696, 0, 760);
  g.addColorStop(0, "#efe9da");
  g.addColorStop(1, "#d8cfbb");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(90,78,60,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function poolWater(ctx) {
  polygon(ctx, pool());
  const water = ctx.createLinearGradient(0, 700, 0, 900);
  water.addColorStop(0, "#527a72");
  water.addColorStop(0.22, "#3d615a");
  water.addColorStop(1, "#203c36");
  ctx.fillStyle = water;
  ctx.fill();
}

function reflection(ctx, zoom) {
  ctx.save();
  polygon(ctx, pool());
  ctx.clip();

  // A compressed reflection, as a low camera sees it on the water.
  ctx.translate(0, 826);
  ctx.scale(1, -0.18);

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#d9d0bc";
  ctx.fillRect(254, 628, 784, 74);
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#a3503b";
  ctx.fillRect(606, 676, 78, 30);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#f4eee0";
  ctx.fillRect(500, 345, 290, 287);
  ctx.fillStyle = "#5e5141";
  archPath(ctx, 540, 390, 208, 242, 0.44);
  ctx.fill();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = "#e4dcc9";
  ctx.beginPath();
  ctx.ellipse(645, 236, 146, 112, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.24;
  ctx.fillStyle = "#26351f";
  for (const x of [120, 190, 260, 330, 960, 1030, 1100, 1170]) {
    ctx.fillRect(x - 18, 600, 36, 160);
  }
  ctx.restore();

  // Cool depth and the far shadow under the terrace.
  const deep = ctx.createLinearGradient(0, 700, 0, 900);
  deep.addColorStop(0, "rgba(38,74,68,0)");
  deep.addColorStop(0.32, "rgba(30,66,60,0.22)");
  deep.addColorStop(1, "rgba(14,40,35,0.5)");
  ctx.fillStyle = deep;
  polygon(ctx, pool());
  ctx.fill();

  // Ripples and glints on the surface.
  const rand = seeded(5);
  for (let y = 706; y < 900; y += 7) {
    const half = 88 + (y - 700) * 0.06;
    ctx.beginPath();
    for (let x = 645 - half + 10; x < 645 + half - 8; x += 16) {
      const yy = y + Math.sin(x * 0.13 + y * 0.9) * 1.4;
      ctx.moveTo(x, yy);
      ctx.lineTo(x + 6 + rand() * 13, yy);
    }
    ctx.strokeStyle = `rgba(228,242,236,${0.1 + rand() * 0.12})`;
    ctx.lineWidth = y < 735 ? 0.55 : 0.85;
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(645 - 74, 705);
  ctx.lineTo(645 + 74, 705);
  ctx.stroke();

  // Smaller wavelets break up the surface when the camera is close.
  if (zoom > 1.3) {
    const spray = seeded(23);
    for (let i = 0; i < 320; i++) {
      const y = 704 + spray() * 260;
      const half = 88 + (y - 700) * 0.06;
      const x = 645 - half + 8 + spray() * (half * 2 - 20);
      ctx.strokeStyle = `rgba(216,238,232,${0.04 + spray() * 0.13})`;
      ctx.lineWidth = 0.4 + spray() * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 2, y - 0.8, x + 2 + spray() * 8, y);
      ctx.stroke();
    }
  }

  if (zoom > 2.2) {
    // Fine concentric rings around the fountain.
    for (let r = 14; r < 120; r += 12) {
      ctx.strokeStyle = "rgba(220,240,234,0.08)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(645, 768, r, r * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function fountain(ctx, zoom, px) {
  const y = 768;
  ctx.fillStyle = "rgba(10,30,26,0.45)";
  ctx.beginPath();
  ctx.ellipse(645, y + 5, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#cfc6b3";
  ctx.beginPath();
  ctx.ellipse(645, y + 2, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8e1d0";
  ctx.beginPath();
  ctx.ellipse(645, y, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c1b8a4";
  ctx.fillRect(642, y - 18, 6, 18);
  ctx.fillStyle = "#ded7c5";
  ctx.beginPath();
  ctx.ellipse(645, y - 18, 8, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b8ae99";
  ctx.fillRect(643.5, y - 26, 3, 8);

  ctx.strokeStyle = "rgba(236,248,248,0.8)";
  ctx.lineWidth = Math.max(px, 0.6);
  ctx.beginPath();
  ctx.moveTo(645, y - 26);
  ctx.quadraticCurveTo(639, y - 36, 645, y - 44);
  ctx.stroke();
  if (zoom > 1.5) {
    ctx.strokeStyle = "rgba(228,246,244,0.6)";
    ctx.beginPath();
    ctx.moveTo(645, y - 40);
    ctx.quadraticCurveTo(648, y - 32, 652, y - 20);
    ctx.moveTo(645, y - 40);
    ctx.quadraticCurveTo(642, y - 32, 638, y - 20);
    ctx.stroke();
  }
  if (zoom > 1.8) {
    ctx.fillStyle = "rgba(238,250,250,0.55)";
    for (let i = 0; i < 16; i++) {
      const a = i * 1.9;
      ctx.beginPath();
      ctx.arc(645 + Math.cos(a) * (3 + (i % 5) * 2), y - 36 - (i % 6) * 2, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (zoom > 2.8) {
    ctx.strokeStyle = "rgba(222,242,238,0.4)";
    ctx.lineWidth = Math.max(px, 0.4);
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(645, y - 24, i * 3.4, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  }
}

export function drawWater(ctx, zoom, px) {
  curb(ctx);
  poolWater(ctx);
  reflection(ctx, zoom);
  fountain(ctx, zoom, px);
}
