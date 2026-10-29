/* The great onion dome, its drum and bronze finial. */

import { archPath, PAL, seeded } from "./util.js";
import { blockJoints } from "./ornament.js";

export function domePath(ctx, cx, baseY, r, h) {
  ctx.beginPath();
  ctx.moveTo(cx - r, baseY);
  ctx.bezierCurveTo(cx - r * 1.06, baseY - h * 0.1, cx - r * 1.03, baseY - h * 0.28, cx - r * 0.87, baseY - h * 0.48);
  ctx.bezierCurveTo(cx - r * 0.68, baseY - h * 0.66, cx - r * 0.42, baseY - h * 0.8, cx - r * 0.22, baseY - h * 0.9);
  ctx.bezierCurveTo(cx - r * 0.1, baseY - h * 0.96, cx - r * 0.03, baseY - h * 0.99, cx, baseY - h);
  ctx.bezierCurveTo(cx + r * 0.03, baseY - h * 0.99, cx + r * 0.1, baseY - h * 0.96, cx + r * 0.22, baseY - h * 0.9);
  ctx.bezierCurveTo(cx + r * 0.42, baseY - h * 0.8, cx + r * 0.68, baseY - h * 0.66, cx + r * 0.87, baseY - h * 0.48);
  ctx.bezierCurveTo(cx + r * 1.03, baseY - h * 0.28, cx + r * 1.06, baseY - h * 0.1, cx + r, baseY);
  ctx.closePath();
}

export function finial(ctx, cx, topY, scale, zoom, px) {
  ctx.save();
  ctx.translate(cx, topY);
  ctx.scale(scale, scale);
  ctx.fillStyle = PAL.bronze;
  ctx.strokeStyle = "#3f3220";
  ctx.lineWidth = Math.max(px / scale, 0.35);

  ctx.beginPath();
  ctx.moveTo(-8, -2);
  ctx.quadraticCurveTo(-4, -7, 0, -7);
  ctx.quadraticCurveTo(4, -7, 8, -2);
  ctx.quadraticCurveTo(0, 2, -8, -2);
  ctx.fill();

  ctx.fillRect(-1.6, -20, 3.2, 14);
  ctx.beginPath();
  ctx.arc(0, -22, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-3.5, -28, 7, 2.4);
  ctx.beginPath();
  ctx.moveTo(-2.6, -29);
  ctx.lineTo(-1.3, -46);
  ctx.lineTo(1.3, -46);
  ctx.lineTo(2.6, -29);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -48, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, -58, 5.6, Math.PI * 0.32, Math.PI * 1.68);
  ctx.arc(-1.8, -58, 5.0, Math.PI * 1.58, Math.PI * 0.42, true);
  ctx.fill();
  ctx.fillRect(-0.9, -66, 1.8, 4);
  if (zoom > 3) {
    ctx.fillStyle = "rgba(255,226,160,0.5)";
    ctx.beginPath();
    ctx.arc(-1.4, -23, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drum(ctx, zoom, px) {
  const g = ctx.createLinearGradient(505, 320, 785, 348);
  g.addColorStop(0, "#f3edde");
  g.addColorStop(1, "#d9d0bc");
  ctx.fillStyle = g;
  ctx.fillRect(505, 322, 280, 24);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(505, 322, 280, 2);
  ctx.fillStyle = "rgba(105,91,72,0.35)";
  ctx.fillRect(505, 344, 280, 3);

  if (zoom > 1.6) {
    for (let x = 512; x < 778; x += 12) {
      archPath(ctx, x, 330, 7, 12, 0.6);
      ctx.fillStyle = "rgba(95,82,65,0.42)";
      ctx.fill();
      if (zoom > 4) {
        ctx.fillStyle = "rgba(220,210,190,0.7)";
        ctx.fillRect(x + 3, 334, 1, 6);
      }
    }
  }
  blockJoints(ctx, 505, 322, 280, 22, zoom, px, 28, 10);
}

function greatDome(ctx, zoom, px) {
  const cx = 645;
  const base = 322;
  const r = 146;
  const h = 200;

  domePath(ctx, cx, base, r, h);
  const g = ctx.createLinearGradient(cx - r, base - h, cx + r, base);
  g.addColorStop(0, "#fdf9ef");
  g.addColorStop(0.36, "#f2ecdd");
  g.addColorStop(0.72, "#e5ddca");
  g.addColorStop(1, "#c9bfab");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(120,106,86,0.32)";
  ctx.lineWidth = Math.max(px, 0.4);
  ctx.stroke();

  ctx.save();
  domePath(ctx, cx, base, r, h);
  ctx.clip();

  const shade = ctx.createLinearGradient(cx + r * 0.15, 0, cx + r, 0);
  shade.addColorStop(0, "rgba(120,110,94,0)");
  shade.addColorStop(1, "rgba(105,94,78,0.28)");
  ctx.fillStyle = shade;
  ctx.fillRect(cx - r, base - h, r * 2, h);

  if (zoom > 1.5) {
    const course = zoom > 6 ? 4 : zoom > 3 ? 7 : 11;
    const rand = seeded(31);
    ctx.strokeStyle = "rgba(120,108,88,0.2)";
    ctx.lineWidth = Math.max(px * 0.8, 0.3);
    let row = 0;
    for (let y = base - h + course; y < base; y += course, row++) {
      ctx.beginPath();
      ctx.moveTo(cx - r, y);
      ctx.quadraticCurveTo(cx, y + course * 0.7, cx + r, y);
      ctx.stroke();
      ctx.beginPath();
      const off = (row % 2) * (course * 1.6);
      for (let x = cx - r + off; x < cx + r; x += course * 3.2) {
        ctx.moveTo(x, y - course);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    if (zoom > 2.5) {
      const tone = zoom > 5 ? 0.05 : 0.035;
      for (let y = base - h, row2 = 0; y < base; y += course, row2++) {
        for (let x = cx - r; x < cx + r; x += course * 3.2) {
          if (rand() > 0.72) {
            ctx.fillStyle = `rgba(150,138,116,${tone + rand() * 0.03})`;
            ctx.fillRect(x + (row2 % 2) * course * 0.8, y, course * 2.2, course);
          }
        }
      }
    }
    if (zoom > 6) {
      ctx.strokeStyle = "rgba(130,118,96,0.12)";
      ctx.lineWidth = Math.max(px * 0.7, 0.25);
      for (let i = 0; i < 9; i++) {
        const x = cx - r + rand() * r * 2;
        const y = base - h + rand() * h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + 8, y + 4, x + 12, y + 9, x + 22, y + 12);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  ctx.save();
  domePath(ctx, cx, base, r, h);
  ctx.clip();
  const fill = ctx.createLinearGradient(0, base - 30, 0, base);
  fill.addColorStop(0, "rgba(255,250,238,0)");
  fill.addColorStop(1, "rgba(255,250,238,0.5)");
  ctx.fillStyle = fill;
  ctx.fillRect(cx - r, base - 30, r * 2, 30);
  ctx.restore();
}

export function drawGreatDome(ctx, zoom, px) {
  drum(ctx, zoom, px);
  greatDome(ctx, zoom, px);
  finial(ctx, 645, 122, 1.15, zoom, px);
}
