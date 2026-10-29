/* Four minarets, their balconies, cupolas and finials. */

import { PAL } from "./util.js";

function shaft(ctx, cx, baseY, topY, w, zoom, px) {
  const topW = w * 0.74;
  const g = ctx.createLinearGradient(cx - w, 0, cx + w, 0);
  g.addColorStop(0, "#d8cfbb");
  g.addColorStop(0.28, "#f6f1e5");
  g.addColorStop(0.62, "#ece6d7");
  g.addColorStop(1, "#c7bda8");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, baseY);
  ctx.lineTo(cx - topW / 2, topY);
  ctx.lineTo(cx + topW / 2, topY);
  ctx.lineTo(cx + w / 2, baseY);
  ctx.closePath();
  ctx.fill();

  if (zoom > 1.8) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, baseY);
    ctx.lineTo(cx - topW / 2, topY);
    ctx.lineTo(cx + topW / 2, topY);
    ctx.lineTo(cx + w / 2, baseY);
    ctx.closePath();
    ctx.clip();
    const sy = zoom > 6 ? 4.5 : zoom > 3 ? 7 : 10;
    const sx = zoom > 6 ? 6 : zoom > 3 ? 9 : 14;
    ctx.strokeStyle = "rgba(118,105,86,0.22)";
    ctx.lineWidth = Math.max(px * 0.7, 0.28);
    let row = 0;
    for (let y = topY + sy; y < baseY; y += sy, row++) {
      ctx.beginPath();
      ctx.moveTo(cx - w, y);
      ctx.lineTo(cx + w, y);
      ctx.stroke();
      ctx.beginPath();
      const off = (row % 2) * (sx / 2);
      for (let x = cx - w / 2 + off; x < cx + w / 2; x += sx) {
        ctx.moveTo(x, y - sy);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Thin inlaid collars around the shaft.
    for (const f of [0.18, 0.42, 0.68]) {
      const yy = topY + (baseY - topY) * f;
      ctx.strokeStyle = "rgba(143,70,54,0.32)";
      ctx.lineWidth = Math.max(px * 1.4, 0.4);
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.44, yy);
      ctx.lineTo(cx + w * 0.44, yy);
      ctx.stroke();
      if (zoom > 5) {
        ctx.fillStyle = "rgba(201,160,74,0.55)";
        for (let x = cx - w * 0.4; x < cx + w * 0.4; x += 3.4) {
          ctx.fillRect(x, yy - 1.2, 1, 1);
        }
      }
    }
    ctx.restore();
    // Soft shade down the right limb.
    const shade = ctx.createLinearGradient(cx, 0, cx + w / 2, 0);
    shade.addColorStop(0, "rgba(110,96,76,0)");
    shade.addColorStop(1, "rgba(110,96,76,0.2)");
    ctx.fillStyle = shade;
    ctx.fillRect(cx, topY, w / 2, baseY - topY);
  }
}

function balcony(ctx, cx, y, w, zoom, px) {
  // Slab.
  ctx.fillStyle = "#f0eadb";
  ctx.beginPath();
  ctx.ellipse(cx, y + 1, w, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(92,79,62,0.35)";
  ctx.fillRect(cx - w, y + 2.6, w * 2, 1.6);

  // Railing.
  ctx.fillStyle = "#e9e2d2";
  ctx.fillRect(cx - w + 1, y - 7, w * 2 - 2, 1.6);
  ctx.fillRect(cx - w + 1, y - 7, 1.6, 8);
  ctx.fillRect(cx + w - 2.6, y - 7, 1.6, 8);
  if (zoom > 2.2) {
    ctx.fillStyle = "rgba(236,229,214,0.9)";
    for (let x = cx - w + 3; x < cx + w - 2; x += 2.6) ctx.fillRect(x, y - 6, 1, 6.5);
  }

  // Brackets below the slab.
  ctx.fillStyle = "rgba(238,231,217,0.85)";
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * (w * 0.34), y + 4);
    ctx.lineTo(cx + i * (w * 0.34) - 2.5, y + 7);
    ctx.lineTo(cx + i * (w * 0.34) + 2.5, y + 7);
    ctx.closePath();
    ctx.fill();
  }
}

function cupola(ctx, cx, topY, w, zoom, px) {
  // Drum with small arched openings.
  ctx.fillStyle = "#efe8d8";
  ctx.fillRect(cx - w * 0.95, topY - 12, w * 1.9, 12);
  ctx.fillStyle = "rgba(90,78,60,0.3)";
  ctx.fillRect(cx - w * 0.95, topY - 12, w * 1.9, 1.4);
  for (let i = -2; i <= 2; i++) {
    const ax = cx + i * w * 0.33;
    ctx.fillStyle = "rgba(88,76,60,0.4)";
    ctx.beginPath();
    ctx.moveTo(ax - w * 0.08, topY - 3);
    ctx.lineTo(ax - w * 0.08, topY - 8);
    ctx.quadraticCurveTo(ax, topY - 12, ax + w * 0.08, topY - 8);
    ctx.lineTo(ax + w * 0.08, topY - 3);
    ctx.closePath();
    ctx.fill();
  }
  if (zoom > 3) {
    ctx.fillStyle = "rgba(236,229,214,0.85)";
    for (let x = cx - w * 0.9; x < cx + w * 0.9; x += 1.6) ctx.fillRect(x, topY - 13, 0.8, 2);
  }

  // Onion cap.
  const r = w * 1.05;
  const h = w * 1.75;
  const base = topY - 11;
  ctx.beginPath();
  ctx.moveTo(cx - r, base);
  ctx.bezierCurveTo(cx - r * 1.12, base - h * 0.3, cx - r * 0.84, base - h * 0.62, cx - r * 0.42, base - h * 0.8);
  ctx.bezierCurveTo(cx - r * 0.2, base - h * 0.9, cx - r * 0.08, base - h * 0.96, cx, base - h);
  ctx.bezierCurveTo(cx + r * 0.08, base - h * 0.96, cx + r * 0.2, base - h * 0.9, cx + r * 0.42, base - h * 0.8);
  ctx.bezierCurveTo(cx + r * 0.84, base - h * 0.62, cx + r * 1.12, base - h * 0.3, cx + r, base);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - r, base - h, cx + r, base);
  g.addColorStop(0, "#fbf7ec");
  g.addColorStop(0.55, "#eee8d8");
  g.addColorStop(1, "#c5bba6");
  ctx.fillStyle = g;
  ctx.fill();

  // Finial.
  ctx.fillStyle = PAL.bronze;
  ctx.fillRect(cx - 0.9, base - h - 11, 1.8, 11);
  ctx.beginPath();
  ctx.arc(cx, base - h - 12, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, base - h - 17, 1.7, 0, Math.PI * 2);
  ctx.fill();
}

function minaret(ctx, cx, baseY, topY, w, zoom, px) {
  // Base block.
  ctx.fillStyle = "rgba(233,226,212,0.95)";
  ctx.fillRect(cx - w * 1.3, baseY - 12, w * 2.6, 12);
  ctx.fillStyle = "rgba(110,96,76,0.35)";
  ctx.fillRect(cx - w * 1.3, baseY - 12, w * 2.6, 2);

  shaft(ctx, cx, baseY - 12, topY + 14, w, zoom, px);

  const h = baseY - 12 - (topY + 14);
  for (const f of [0.3, 0.6, 0.84]) {
    balcony(ctx, cx, topY + 14 + h * f, w * 1.18, zoom, px);
  }

  cupola(ctx, cx, topY, w, zoom, px);
}

export function drawMinarets(ctx, zoom, px) {
  minaret(ctx, 163, 660, 238, 26, zoom, px);
  minaret(ctx, 272, 654, 302, 21, zoom, px);
  minaret(ctx, 982, 654, 236, 21, zoom, px);
  minaret(ctx, 1100, 660, 226, 26, zoom, px);
}
