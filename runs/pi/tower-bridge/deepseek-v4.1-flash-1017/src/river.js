import { TOWER_X, WATER_Y } from "./model.js";
import { hash } from "./stone.js";

function towerReflection(ctx, cx) {
  const g = ctx.createLinearGradient(0, WATER_Y, 0, WATER_Y + 170);
  g.addColorStop(0, "rgba(218, 199, 157, 0.28)");
  g.addColorStop(0.35, "rgba(166, 150, 117, 0.14)");
  g.addColorStop(1, "rgba(25, 55, 64, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - 72, WATER_Y, 144, 170);
  ctx.fillStyle = "rgba(20, 44, 51, 0.12)";
  for (let i = 0; i < 7; i += 1) {
    const y = WATER_Y + 14 + i * 17;
    const w = 30 + hash(i, cx) * 65;
    ctx.fillRect(cx - w / 2, y, w, 2 + hash(i, 2) * 3);
  }
}

function waves(ctx, cam, lod) {
  const view = cam.viewBounds();
  const top = Math.max(WATER_Y + 3, view.top);
  const bottom = Math.min(WATER_Y + 4000, view.bottom);
  const step = lod >= 14 ? 1.5 : lod >= 8 ? 3 : lod >= 3 ? 6 : 13;
  const spacing = lod >= 14 ? 9 : lod >= 8 ? 18 : lod >= 3 ? 30 : 52;

  ctx.strokeStyle = "rgba(214, 235, 236, 0.09)";
  ctx.lineWidth = lod >= 4 ? 0.7 : 1.1;
  ctx.beginPath();
  for (let row = Math.ceil(top / step); row * step < bottom; row += 1) {
    const y = row * step;
    const offset = hash(row, 9) * spacing;
    const start = Math.floor((view.left - offset) / spacing) * spacing + offset;
    for (let x = start; x < view.right; x += spacing) {
      const h = hash(row, x);
      const yy = y + (hash(x, row) - 0.5) * step * 0.8;
      const jitter = (hash(x + 3, row) - 0.5) * spacing * 0.3;
      ctx.moveTo(x + jitter, yy);
      ctx.lineTo(x + jitter + spacing * (0.2 + h * 0.55), yy);
    }
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(240, 250, 248, 0.2)";
  ctx.beginPath();
  for (let row = Math.ceil(top / (step * 2)); row * step * 2 < bottom; row += 1) {
    const y = row * step * 2;
    const start = Math.floor(view.left / spacing) * spacing;
    for (let x = start; x < view.right; x += spacing) {
      if (hash(row + 11, x) < 0.62) continue;
      const yy = y + hash(x, row) * step;
      ctx.moveTo(x, yy);
      ctx.lineTo(x + spacing * 0.22, yy);
    }
  }
  ctx.stroke();
}

export function drawRiver(ctx, cam, lod) {
  const water = ctx.createLinearGradient(0, WATER_Y, 0, WATER_Y + 900);
  water.addColorStop(0, "#84acb3");
  water.addColorStop(0.12, "#5c8792");
  water.addColorStop(0.6, "#27505c");
  water.addColorStop(1, "#122d36");
  ctx.fillStyle = water;
  ctx.fillRect(-5000, WATER_Y, 10000, 6000);

  ctx.fillStyle = "rgba(238, 246, 241, 0.4)";
  ctx.fillRect(-5000, WATER_Y, 10000, 1.4);

  towerReflection(ctx, -TOWER_X);
  towerReflection(ctx, TOWER_X);

  ctx.fillStyle = "rgba(34, 67, 73, 0.16)";
  ctx.fillRect(-250, WATER_Y + 8, 500, 36);

  waves(ctx, cam, lod);
}

export function drawFoam(ctx, cx, lod) {
  if (lod < 1.5) return;
  const count = lod >= 6 ? 9 : 5;
  ctx.strokeStyle = "rgba(235, 246, 245, 0.55)";
  ctx.lineWidth = lod >= 5 ? 0.6 : 0.9;
  ctx.beginPath();
  for (let i = 0; i < count; i += 1) {
    const x = cx - 55 + i * (110 / (count - 1));
    const r = 6 + hash(i, cx) * 13;
    ctx.moveTo(x - r, WATER_Y + 1);
    ctx.quadraticCurveTo(x, WATER_Y - 2 + hash(i, 3) * 4, x + r, WATER_Y + 1);
  }
  ctx.stroke();
}
