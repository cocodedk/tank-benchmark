import { C } from "./palette.js";

// A repeatable pseudo-random value, so stone joints never shimmer between frames.
export function hash(a, b = 0) {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// A pointed Gothic arch, base at the bottom, apex at the top.
export function archPath(ctx, cx, half, baseY, apexY) {
  const springY = apexY + (baseY - apexY) * 0.42;
  ctx.beginPath();
  ctx.moveTo(cx - half, baseY);
  ctx.lineTo(cx - half, springY);
  ctx.quadraticCurveTo(cx - half, apexY, cx, apexY);
  ctx.quadraticCurveTo(cx + half, apexY, cx + half, springY);
  ctx.lineTo(cx + half, baseY);
  ctx.closePath();
}

// A tall lancet window: straight jambs, a pointed head.
export function lancetPath(ctx, cx, width, top, bottom) {
  const half = width / 2;
  const springY = top + (bottom - top) * 0.2;
  ctx.beginPath();
  ctx.moveTo(cx - half, bottom);
  ctx.lineTo(cx - half, springY);
  ctx.quadraticCurveTo(cx - half, top, cx, top);
  ctx.quadraticCurveTo(cx + half, top, cx + half, springY);
  ctx.lineTo(cx + half, bottom);
  ctx.closePath();
}

// Ashlar joints. The blocks get finer as the camera comes closer.
export function stoneCourses(ctx, x, y, w, h, lod) {
  if (lod < 2) return;
  const step = lod >= 10 ? 5 : lod >= 5 ? 8 : lod >= 3 ? 13 : 21;
  const joint = Math.max(0.3, 0.75 - lod * 0.025);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = C.mortar;
  ctx.lineWidth = joint;

  for (let row = 1; row * step < h; row += 1) {
    const yy = y + row * step;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();

    if (lod < 3) continue;
    const offset = hash(row, Math.round(x)) * step * 1.7;
    for (let xx = x + offset; xx < x + w; xx += step * 1.75) {
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx, yy + step * 0.55);
      ctx.stroke();
    }
  }

  // Some blocks catch the light differently; the wall stops looking printed.
  if (lod >= 8) {
    const blockW = step * 1.75;
    ctx.fillStyle = "rgba(92, 72, 44, 0.055)";
    for (let row = 0; row * step < h; row += 1) {
      const yy = y + row * step;
      const offset = hash(row, Math.round(x)) * step * 1.7;
      for (let xx = x + offset; xx < x + w; xx += blockW) {
        if (hash(row + 31, xx) < 0.56) continue;
        const left = Math.max(x, xx);
        const right = Math.min(x + w, xx + blockW - 0.5);
        if (right > left) ctx.fillRect(left, yy + 0.25, right - left, step - 0.5);
      }
    }
  }
  ctx.restore();
}

// Old stone is never one flat colour. At close range, add faint damp patches.
export function weathering(ctx, x, y, w, h, lod) {
  if (lod < 6) return;
  const count = Math.min(140, Math.round((w * h) / 400));
  for (let i = 0; i < count; i += 1) {
    const px = x + hash(i, x) * w;
    const py = y + hash(i, y + 7) * h;
    const radius = 0.5 + hash(i, 3) * (lod > 12 ? 2.2 : 1.3);
    ctx.fillStyle = `rgba(95, 76, 48, ${0.025 + hash(i, 9) * 0.05})`;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A run of small blind arches, used as a decorative band on the tower.
export function blindArcade(ctx, x, y, w, count, lod) {
  const slotW = w / count;
  ctx.fillStyle = "rgba(74, 61, 42, 0.32)";
  for (let i = 0; i < count; i += 1) {
    const cx = x + slotW * (i + 0.5);
    lancetPath(ctx, cx, slotW * 0.44, y, y + 22);
    ctx.fill();
    if (lod >= 4) {
      ctx.strokeStyle = C.stoneLight;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }
}
