/* The detail that appears as you zoom: joints, jali, calligraphy and inlay. */

import { PAL } from "./util.js";

const hair = (px) => Math.max(px * 0.7, 0.32);

export function blockJoints(ctx, x, y, w, h, zoom, px, sx = 26, sy = 17) {
  if (zoom < 1.5) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = "rgba(112,100,80,0.16)";
  ctx.lineWidth = hair(px);
  let row = 0;
  for (let yy = y + sy; yy < y + h; yy += sy, row++) {
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
    const off = (row % 2) * (sx / 2);
    ctx.beginPath();
    for (let xx = x + off; xx < x + w; xx += sx) {
      ctx.moveTo(xx, yy - sy);
      ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Fine pierced screen, drawn finer still when the camera is close. */
export function jali(ctx, x, y, w, h, zoom, px, tone = "rgba(245,237,220,0.75)") {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const lattice = (step, alpha, width) => {
    ctx.strokeStyle = tone;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = -h - step; i < w + step; i += step) {
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + h, y + h);
      ctx.moveTo(x + i, y + h);
      ctx.lineTo(x + i + h, y);
    }
    ctx.stroke();
  };
  lattice(7, 0.75, Math.max(px, 0.35));
  if (zoom > 3) lattice(3.5, 0.42, Math.max(px * 0.7, 0.25));
  if (zoom > 7) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = tone;
    for (let yy = y + 6; yy < y + h; yy += 7) {
      for (let xx = x + ((yy - y) % 14 === 0 ? 3 : 6); xx < x + w; xx += 7) {
        ctx.beginPath();
        ctx.arc(xx, yy, Math.max(px, 0.3), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

export function calligraphy(ctx, x, y, w, h, zoom, px) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = "rgba(62,52,40,0.62)";
  ctx.lineWidth = Math.max(px * 0.9, 0.45);
  const step = zoom > 3 ? 6 : 10;
  for (let xx = x + 4; xx < x + w - 3; xx += step) {
    const top = y + h * (0.22 + (Math.abs(xx * 7) % 5) * 0.02);
    const bot = y + h * 0.78;
    ctx.beginPath();
    ctx.moveTo(xx, top);
    ctx.bezierCurveTo(xx + step * 0.55, top - h * 0.16, xx + step * 0.9, bot - h * 0.1, xx + step * 0.35, bot);
    ctx.stroke();
    if (zoom > 3.5) {
      ctx.beginPath();
      ctx.arc(xx + step * 0.35, bot, Math.max(px * 0.8, 0.35), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.84);
  ctx.lineTo(x + w, y + h * 0.84);
  ctx.stroke();
  ctx.restore();
}

function flower(ctx, x, y, r, petal, centre) {
  ctx.fillStyle = petal;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.62, r * 0.4, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = centre;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

/** Alternating flowers and diamonds along a border. */
export function inlayBorder(ctx, x, y, w, h, zoom, px, vertical = false, step = 9) {
  if (zoom < 0.9) return;
  const length = vertical ? h : w;
  const r = Math.max(Math.min(w, h) * 0.13, 0.9);
  for (let i = step * 0.6; i < length; i += step) {
    const cx = vertical ? x + w / 2 : x + i;
    const cy = vertical ? y + i : y + h / 2;
    if (Math.round(i / step) % 2 === 0) {
      flower(ctx, cx, cy, r, zoom > 4 ? "#8f4636" : "rgba(143,70,54,0.78)", "#c8a04a");
    } else {
      ctx.fillStyle = zoom > 4 ? "#4e6b3c" : "rgba(78,107,60,0.75)";
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
      if (zoom > 5) {
        ctx.fillStyle = "#c8a04a";
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(px * 0.7, 0.3), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/** A pietra-dura spray for the spandrels: stem, leaves, two blossoms. */
export function floralSpray(ctx, cx, cy, scale, zoom, px) {
  if (zoom < 1.7) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "#5a7044";
  ctx.lineWidth = Math.max(px * 1.2 / scale, 0.5);
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.bezierCurveTo(-4, 8, 6, 0, 2, -16);
  ctx.moveTo(-2, 6);
  ctx.bezierCurveTo(-10, 2, -14, -2, -16, -8);
  ctx.moveTo(2, 0);
  ctx.bezierCurveTo(10, -2, 15, -6, 17, -12);
  ctx.stroke();
  const leaf = (x, y, a) => {
    ctx.fillStyle = "#4d6a3c";
    ctx.beginPath();
    ctx.ellipse(x, y, 5, 2.2, a, 0, Math.PI * 2);
    ctx.fill();
  };
  leaf(-9, -3, -0.7);
  leaf(9, -5, 0.7);
  leaf(-6, 8, -1.1);
  leaf(7, 9, 1.1);
  flower(ctx, -4, -16, 4.2, "#9a4b39", "#c9a24b");
  flower(ctx, 4, 13, 3.4, "#9a4b39", "#c9a24b");
  if (zoom > 4) {
    flower(ctx, 13, -9, 2.4, "#9a4b39", "#c9a24b");
    flower(ctx, -13, 9, 2.2, "#9a4b39", "#c9a24b");
  }
  ctx.restore();
}
