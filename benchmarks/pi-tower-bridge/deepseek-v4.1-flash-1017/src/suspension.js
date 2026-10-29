import { CHAIN_TOP_Y, DECK_Y, SPAN_END, TOWER_OUTER, WATER_Y } from "./model.js";
import { C } from "./palette.js";
import { archPath } from "./stone.js";

const chainPoint = (sign, t) => {
  const a = { x: sign * TOWER_OUTER, y: CHAIN_TOP_Y };
  const c = { x: sign * (TOWER_OUTER + SPAN_END) / 2, y: -60 };
  const b = { x: sign * SPAN_END, y: -8 };
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
};

export function drawAbutment(ctx, sign, lod) {
  const cx = sign * SPAN_END;
  ctx.fillStyle = C.stoneDark;
  ctx.fillRect(cx - 33, -55, 66, WATER_Y + 55);
  ctx.fillStyle = C.stone;
  ctx.fillRect(cx - 39, -55, 78, 9);
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(cx - 33 + i * 19, -67, 12, 13);
  }
  ctx.fillStyle = "rgba(67, 55, 39, 0.3)";
  ctx.fillRect(cx - 22, -34, 44, 6);
  archPath(ctx, cx, 15, WATER_Y, -20);
  ctx.fillStyle = "rgba(42, 46, 44, 0.45)";
  ctx.fill();
  if (lod >= 3) {
    ctx.strokeStyle = C.stoneLight;
    ctx.lineWidth = 0.8;
    archPath(ctx, cx, 18, WATER_Y, -16);
    ctx.stroke();
  }
  ctx.fillStyle = C.iron;
  ctx.fillRect(cx - 9, -20, 18, 24);
}

export function drawSuspension(ctx, sign, lod) {
  const samples = lod >= 6 ? 60 : 30;
  ctx.strokeStyle = C.iron;
  ctx.lineWidth = lod >= 4 ? 2.8 : 3.8;
  ctx.beginPath();
  for (let i = 0; i <= samples; i += 1) {
    const p = chainPoint(sign, i / samples);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  const count = lod < 2 ? 7 : lod < 6 ? 13 : 25;
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = lod >= 5 ? 0.8 : 1.2;
  ctx.beginPath();
  for (let i = 0; i < count; i += 1) {
    const p = chainPoint(sign, 0.08 + (i / (count - 1)) * 0.84);
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, DECK_Y);
  }
  ctx.stroke();

  if (lod >= 7) {
    ctx.fillStyle = C.steelLight;
    for (let i = 0; i < samples; i += 4) {
      const p = chainPoint(sign, i / samples);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
