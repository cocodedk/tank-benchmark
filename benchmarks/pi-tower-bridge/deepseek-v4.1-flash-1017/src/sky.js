import { WATER_Y } from "./model.js";
import { hash } from "./stone.js";

function cloud(ctx, cx, cy, w, h, alpha) {
  const lobes = [
    [0, 0, w * 0.55, h],
    [-w * 0.28, h * 0.18, w * 0.4, h * 0.72],
    [w * 0.3, h * 0.12, w * 0.42, h * 0.76],
    [w * 0.05, -h * 0.15, w * 0.34, h * 0.62],
  ];
  ctx.fillStyle = `rgba(248, 250, 249, ${alpha})`;
  for (const [dx, dy, rw, rh] of lobes) {
    ctx.beginPath();
    ctx.ellipse(cx + dx, cy + dy, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSkyline(ctx, lod) {
  // A soft suggestion of the City on the far bank.
  ctx.fillStyle = "rgba(86, 112, 124, 0.42)";
  for (let i = 0; i < 34; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (355 + hash(i, 1) * 490);
    const w = 18 + hash(i, 2) * 46;
    const h = 14 + hash(i, 3) * 46;
    ctx.fillRect(x, WATER_Y - h, w, h);
    if (lod >= 3) {
      ctx.fillStyle = "rgba(228, 215, 172, 0.16)";
      for (let row = 0; row < Math.floor(h / 12); row += 1) {
        for (let col = 0; col < Math.floor(w / 10); col += 1) {
          if (hash(i * 31 + row, col) > 0.55) {
            ctx.fillRect(x + 3 + col * 10, WATER_Y - h + 4 + row * 12, 3, 4);
          }
        }
      }
      ctx.fillStyle = "rgba(86, 112, 124, 0.42)";
    }
  }
  const haze = ctx.createLinearGradient(0, WATER_Y - 70, 0, WATER_Y);
  haze.addColorStop(0, "rgba(190, 211, 218, 0)");
  haze.addColorStop(1, "rgba(190, 211, 218, 0.5)");
  ctx.fillStyle = haze;
  ctx.fillRect(-1200, WATER_Y - 70, 2400, 70);
}

function drawBirds(ctx, lod) {
  if (lod > 6) return;
  ctx.strokeStyle = "rgba(35, 52, 61, 0.55)";
  ctx.lineWidth = 1.1;
  for (const [x, y, size] of [
    [-330, -300, 7],
    [-292, -312, 5],
    [470, -270, 6],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.quadraticCurveTo(x - size * 0.4, y - size * 0.55, x, y);
    ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.55, x + size, y);
    ctx.stroke();
  }
}

export function drawSky(ctx, lod) {
  const gradient = ctx.createLinearGradient(0, -900, 0, WATER_Y);
  gradient.addColorStop(0, "#17395f");
  gradient.addColorStop(0.42, "#4e7fa4");
  gradient.addColorStop(0.78, "#93b7ca");
  gradient.addColorStop(1, "#cfdee1");
  ctx.fillStyle = gradient;
  ctx.fillRect(-5000, -5000, 10000, 5000 + WATER_Y);

  const glow = ctx.createRadialGradient(-500, -360, 10, -500, -360, 260);
  glow.addColorStop(0, "rgba(255, 246, 214, 0.55)");
  glow.addColorStop(1, "rgba(255, 246, 214, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-800, -660, 620, 620);

  cloud(ctx, -510, -300, 150, 30, 0.25);
  cloud(ctx, -260, -390, 120, 24, 0.18);
  cloud(ctx, 380, -330, 170, 34, 0.23);
  cloud(ctx, 660, -405, 110, 22, 0.16);
  cloud(ctx, 80, -455, 140, 26, 0.14);

  drawBirds(ctx, lod);
  drawSkyline(ctx, lod);
}
