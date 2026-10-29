import { DECK_BOTTOM, DECK_END, DECK_Y, TOWER_INNER, TOWER_OUTER } from "./model.js";
import { C } from "./palette.js";
import { hash } from "./stone.js";

function drawTruss(ctx, x0, x1, lod) {
  const bottom = DECK_BOTTOM + (lod >= 3 ? 20 : 15);
  ctx.fillStyle = C.iron;
  ctx.fillRect(x0, DECK_BOTTOM, x1 - x0, bottom - DECK_BOTTOM);
  if (lod < 2) return;
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let x = x0; x < x1; x += 18) {
    const dir = Math.round(x / 18) % 2 === 0;
    ctx.moveTo(x, dir ? DECK_BOTTOM : bottom);
    ctx.lineTo(x + 18, dir ? bottom : DECK_BOTTOM);
  }
  for (let x = x0; x <= x1; x += 36) {
    ctx.moveTo(x, DECK_BOTTOM);
    ctx.lineTo(x, bottom);
  }
  ctx.stroke();
  if (lod >= 7) {
    ctx.fillStyle = C.steelLight;
    for (let x = x0 + 6; x < x1; x += 9) {
      ctx.beginPath();
      ctx.arc(x, bottom + 3.5, 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawLamp(ctx, x) {
  ctx.fillStyle = C.iron;
  ctx.fillRect(x - 1.2, -31, 2.4, 31);
  ctx.fillRect(x - 4, -34, 8, 3);
  ctx.fillStyle = "rgba(255, 226, 146, 0.75)";
  ctx.beginPath();
  ctx.moveTo(x - 3.5, -34);
  ctx.lineTo(x + 3.5, -34);
  ctx.lineTo(x + 2.2, -43);
  ctx.lineTo(x - 2.2, -43);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.iron;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, -43);
  ctx.lineTo(x, -46);
  ctx.stroke();
}

function drawRail(ctx, x0, x1, lod) {
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = lod >= 4 ? 0.9 : 1.4;
  ctx.beginPath();
  ctx.moveTo(x0, -22);
  ctx.lineTo(x1, -22);
  ctx.stroke();
  if (lod < 2) return;
  if (lod >= 3) {
    ctx.beginPath();
    ctx.moveTo(x0, -11);
    ctx.lineTo(x1, -11);
    ctx.stroke();
  }
  const step = lod >= 7 ? 9 : 17;
  ctx.beginPath();
  for (let x = x0; x < x1; x += step) {
    ctx.moveTo(x, -22);
    ctx.lineTo(x, DECK_Y);
  }
  ctx.stroke();
}

export function drawDeck(ctx, lod) {
  ctx.fillStyle = C.iron;
  ctx.fillRect(-DECK_END, DECK_Y, DECK_END * 2, DECK_BOTTOM - DECK_Y);
  ctx.fillStyle = C.road;
  ctx.fillRect(-DECK_END, DECK_Y, DECK_END * 2, 11);
  ctx.fillStyle = C.roadLight;
  ctx.fillRect(-DECK_END, DECK_Y, DECK_END * 2, 1.4);
  ctx.fillStyle = "rgba(20, 27, 29, 0.28)";
  ctx.fillRect(-DECK_END, 11, DECK_END * 2, 2);

  if (lod >= 5) {
    ctx.fillStyle = "rgba(217, 220, 210, 0.12)";
    const grains = lod >= 10 ? 4000 : 900;
    for (let i = 0; i < grains; i += 1) {
      const x = -DECK_END + hash(i, 1) * DECK_END * 2;
      const y = 2 + hash(i, 2) * 8;
      const size = 0.3 + hash(i, 3) * 0.8;
      ctx.fillRect(x, y, size, size);
    }
    ctx.fillStyle = "rgba(22, 29, 31, 0.08)";
    ctx.fillRect(-DECK_END, 3, DECK_END * 2, 2.2);
    ctx.fillRect(-DECK_END, 7.4, DECK_END * 2, 2.2);
  }

  if (lod >= 7) {
    ctx.strokeStyle = "rgba(24, 31, 32, 0.35)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = -720; x <= 720; x += 60) {
      ctx.moveTo(x, DECK_Y);
      ctx.lineTo(x, 11);
    }
    ctx.stroke();
  }

  drawTruss(ctx, TOWER_OUTER, DECK_END, lod);
  drawTruss(ctx, -DECK_END, -TOWER_OUTER, lod);
  drawTruss(ctx, -TOWER_INNER, TOWER_INNER, lod);

  // Bascule leaves: a fine gap and two pivot bosses in the middle of the river.
  ctx.strokeStyle = "rgba(17, 24, 26, 0.8)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, DECK_Y);
  ctx.lineTo(0, DECK_BOTTOM + (lod >= 3 ? 20 : 15));
  ctx.stroke();
  if (lod >= 2.5) {
    ctx.fillStyle = C.bronze;
    for (const x of [-TOWER_INNER + 5, TOWER_INNER - 5]) {
      ctx.beginPath();
      ctx.arc(x, DECK_BOTTOM + 4, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (lod >= 1.8) {
    ctx.strokeStyle = "rgba(238, 240, 231, 0.55)";
    ctx.lineWidth = 0.8;
    ctx.setLineDash([11, 15]);
    ctx.beginPath();
    ctx.moveTo(-DECK_END + 10, 6);
    ctx.lineTo(DECK_END - 10, 6);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawRail(ctx, -DECK_END + 2, DECK_END - 2, lod);
  if (lod >= 3) {
    for (const x of [-760, -590, -420, -300, 300, 420, 590, 760]) drawLamp(ctx, x);
  }
}
