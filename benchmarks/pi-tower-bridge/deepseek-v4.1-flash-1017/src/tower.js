import {
  CHAIN_TOP_Y,
  DECK_Y,
  TOWER_BASE,
  TOWER_HALF,
  TOWER_OUTER,
  TOWER_TOP,
} from "./model.js";
import { C } from "./palette.js";
import { blindArcade, hash, stoneCourses, weathering } from "./stone.js";
import { drawPier } from "./pier.js";
import { drawArch, drawWindow, ledger } from "./tower-detail.js";
import { drawRoof } from "./roof.js";
import { drawTurret } from "./turret.js";

function drawBody(ctx, cx, lod) {
  const left = cx - TOWER_HALF;
  const width = TOWER_HALF * 2;
  const height = TOWER_BASE - TOWER_TOP;
  const face = ctx.createLinearGradient(left, 0, left + width, 0);
  face.addColorStop(0, C.stoneLight);
  face.addColorStop(0.34, C.stone);
  face.addColorStop(0.78, C.stoneMid);
  face.addColorStop(1, C.stoneShadow);
  ctx.fillStyle = face;
  ctx.fillRect(left, TOWER_TOP, width, height);

  weathering(ctx, left, TOWER_TOP, width, height, lod);
  stoneCourses(ctx, left, TOWER_TOP, width, height, lod);

  ledger(ctx, cx, TOWER_TOP, width + 16, 10, lod);
  blindArcade(ctx, cx - 57, -288, 114, 7, lod);
  ledger(ctx, cx, -254, width - 8, 5, lod);

  drawWindow(ctx, cx - 38, 20, -228, -112, lod);
  drawWindow(ctx, cx, 32, -244, -112, lod);
  drawWindow(ctx, cx + 38, 20, -228, -112, lod);
  ledger(ctx, cx, -110, width - 12, 5, lod);

  drawArch(ctx, cx, lod);

  if (lod >= 3) {
    ctx.strokeStyle = "rgba(81, 64, 42, 0.35)";
    ctx.lineWidth = 0.8;
    for (let x = left + 10; x < left + width - 8; x += 21) {
      ctx.beginPath();
      ctx.moveTo(x, DECK_Y + 30);
      ctx.lineTo(x, TOWER_BASE - 10);
      ctx.stroke();
    }
    ledger(ctx, cx, 52, width - 6, 4, lod);
  }

  if (lod >= 7) {
    ctx.fillStyle = "rgba(62, 48, 32, 0.2)";
    for (let i = 0; i < 8; i += 1) {
      const w = 6 + hash(i, 5) * 18;
      ctx.fillRect(cx - 62 + i * 17, -96 + hash(i, 8) * 16, w, 1.2);
    }
  }
}

function drawCrown(ctx, cx, lod) {
  drawRoof(ctx, cx, lod);
  drawTurret(ctx, cx - TOWER_HALF, lod);
  drawTurret(ctx, cx + TOWER_HALF, lod);
}

export function drawTower(ctx, cx, lod) {
  const sign = Math.sign(cx);
  drawPier(ctx, cx, lod);
  drawBody(ctx, cx, lod);
  drawCrown(ctx, cx, lod);

  // The suspension chain is bolted to the outer corner turret.
  const anchorX = cx + sign * (TOWER_OUTER - Math.abs(cx));
  ctx.fillStyle = C.iron;
  ctx.fillRect(anchorX - 6, CHAIN_TOP_Y - 10, 12, 20);
  ctx.fillStyle = C.bronze;
  ctx.beginPath();
  ctx.arc(anchorX, CHAIN_TOP_Y, 2.2, 0, Math.PI * 2);
  ctx.fill();
}
