/* Sky, clouds, the Thames and its embankments. */

import { G } from "./world.js";
import { screenRect, fillWorldRect, masonry } from "./shapes.js";

export function drawBackground(ctx, cam, w, h) {
  drawSky(ctx, w, h);
  drawClouds(ctx, cam, w, h);
  drawWater(ctx, cam, w, h);
  drawBanks(ctx, cam, w, h);
}

function drawSky(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#aacde2");
  sky.addColorStop(0.45, "#d3e4ea");
  sky.addColorStop(0.78, "#e9ece4");
  sky.addColorStop(1, "#f2efe3");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
}

function drawClouds(ctx, cam, w, h) {
  const s = cam.scale(w, h);
  if (s > 4) return;
  const clouds = [
    [-620, -540, 140, 26, 0.5],
    [-380, -610, 90, 18, 0.36],
    [240, -585, 155, 30, 0.46],
    [620, -520, 100, 20, 0.38],
    [40, -640, 70, 15, 0.3],
  ];
  for (const [x, y, rx, ry, alpha] of clouds) {
    const [sx, sy] = cam.toScreen(x, y, w, h);
    const r = Math.max(1, rx * s);
    const g = ctx.createRadialGradient(sx, sy, r * 0.15, sx, sy, r);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(0.55, `rgba(255,255,255,${alpha * 0.6})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(1, ry / rx);
    ctx.translate(-sx, -sy);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawWater(ctx, cam, w, h) {
  // The river starts behind the bridge: a hazy band under the deck recedes
  // to the waterline in front, then darkens with depth.
  const top = cam.toScreen(0, G.deckY + 10, w, h)[1];
  if (top > h) return;
  const left = cam.toScreen(-G.shoreX, 0, w, h)[0];
  const right = cam.toScreen(G.shoreX, 0, w, h)[0];
  const x0 = Math.max(0, Math.min(left, right));
  const x1 = Math.min(w, Math.max(left, right));
  if (x1 <= x0) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, Math.max(0, top), x1 - x0, h - Math.max(0, top));
  ctx.clip();

  const waterline = cam.toScreen(0, G.waterY, w, h)[1];
  const mid = Math.max(0.03, Math.min(0.85, (waterline - top) / Math.max(1, h - top)));
  const water = ctx.createLinearGradient(0, top, 0, h);
  water.addColorStop(0, "#d6e2df");
  water.addColorStop(mid * 0.7, "#a8bdbd");
  water.addColorStop(mid, "#8aa3a4");
  water.addColorStop(mid + (1 - mid) * 0.3, "#6e8b8e");
  water.addColorStop(1, "#3f5d64");
  ctx.fillStyle = water;
  ctx.fillRect(x0, top, x1 - x0, h - top);

  drawReflections(ctx, cam, w, h, top);
  drawRipples(ctx, cam, w, h, top, x0, x1);

  if (waterline > top && waterline < h) {
    ctx.strokeStyle = "rgba(245,250,248,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, waterline);
    ctx.lineTo(x1, waterline);
    ctx.stroke();
  }
  ctx.restore();
}

function drawReflections(ctx, cam, w, h, top) {
  for (const cx of [-G.towerX, G.towerX]) {
    const [sx] = cam.toScreen(cx, 0, w, h);
    const s = cam.scale(w, h);
    const width = G.towerHalf * 1.5 * s;
    const height = 230 * s;
    const grad = ctx.createLinearGradient(0, top, 0, top + height);
    grad.addColorStop(0, "rgba(213,200,170,0.22)");
    grad.addColorStop(0.5, "rgba(205,196,172,0.09)");
    grad.addColorStop(1, "rgba(205,196,172,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(sx - width / 2, top, width, height);
  }
}

function drawRipples(ctx, cam, w, h, top, x0, x1) {
  const yStart = cam.toModel(0, Math.max(0, top), w, h)[1];
  const yEnd = cam.toModel(0, h, w, h)[1];
  const from = Math.max(-60, Math.floor(yStart / 22) * 22);
  const to = Math.min(yEnd, yStart + 900);
  const s = cam.scale(w, h);
  ctx.lineWidth = Math.max(0.6, Math.min(2, 1.1 * s));
  for (let y = from, i = 0; y < to; y += 22, i++) {
    const alpha = 0.1 + 0.06 * ((i % 3) + 1);
    ctx.strokeStyle = `rgba(226,240,240,${alpha})`;
    ctx.beginPath();
    let started = false;
    for (let x = -G.shoreX; x <= G.shoreX; x += 26) {
      const waveY = y + Math.sin(x * 0.035 + y * 0.11) * 1.8;
      const [sx, sy] = cam.toScreen(x, waveY, w, h);
      if (sy < top + 2) continue;
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
  }
}

function drawBanks(ctx, cam, w, h) {
  for (const side of [-1, 1]) {
    const edge = side * G.shoreX;
    const wall = { x: side < 0 ? edge : edge - 24, y: G.deckY, w: 24, h: -G.deckY };
    const [sx, sy, sw, sh] = screenRect(cam, w, h, wall.x, wall.y, wall.w, wall.h);
    const stone = ctx.createLinearGradient(sx, 0, sx + sw, 0);
    stone.addColorStop(0, "#b6a98d");
    stone.addColorStop(1, "#8f8268");
    ctx.fillStyle = stone;
    ctx.fillRect(sx, sy, sw, sh);
    masonry(ctx, cam, w, h, wall, { row: 14, col: 24 });

    // Wet line and a low parapet on top of the quay.
    const waterline = cam.toScreen(0, G.waterY, w, h)[1];
    ctx.fillStyle = "rgba(46,58,60,0.4)";
    ctx.fillRect(sx, waterline - 3, sw, 6);
    fillWorldRect(ctx, cam, w, h, side < 0 ? edge - 40 : edge, G.deckY - 14, 40, 10, "#a8a087");
  }
}
