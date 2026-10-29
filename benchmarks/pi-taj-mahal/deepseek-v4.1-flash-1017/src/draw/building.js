/* The tomb's central block and its great iwan, framing the dome. */

import { archPath } from "./util.js";
import { blockJoints, calligraphy, floralSpray, inlayBorder, jali } from "./ornament.js";
import { drawWings } from "./wings.js";

function centralBlock(ctx) {
  const g = ctx.createLinearGradient(500, 345, 790, 632);
  g.addColorStop(0, "#f8f3e7");
  g.addColorStop(0.42, "#f1ebdc");
  g.addColorStop(1, "#ded5c1");
  ctx.fillStyle = g;
  ctx.fillRect(500, 345, 290, 287);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(500, 345, 290, 3);
  ctx.fillStyle = "rgba(100,86,68,0.28)";
  ctx.fillRect(500, 353, 290, 3);
  ctx.fillStyle = "rgba(110,96,76,0.35)";
  ctx.fillRect(494, 348, 6, 284);
  ctx.fillRect(790, 348, 6, 284);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(500, 360, 290, 2);
}

function pishtaq(ctx, zoom, px) {
  const fx = 514;
  const fw = 262;

  // Outer face of the portal, slightly proud of the block.
  const g = ctx.createLinearGradient(fx, 362, fx + fw, 632);
  g.addColorStop(0, "#f6f0e3");
  g.addColorStop(1, "#e2dac8");
  ctx.fillStyle = g;
  ctx.fillRect(fx, 368, fw, 264);

  // Calligraphy band above the portal.
  ctx.fillStyle = "#d6ccb8";
  ctx.fillRect(508, 346, 274, 22);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(508, 346, 274, 1.5);
  ctx.fillStyle = "rgba(110,96,76,0.35)";
  ctx.fillRect(508, 367, 274, 1.5);
  calligraphy(ctx, 514, 346, 262, 21, zoom, px);
  inlayBorder(ctx, 514, 344, 262, 3, zoom, px, false, 10);

  // Outer arch band (marble) and the deep recess inside it.
  archPath(ctx, 529, 379, 232, 253, 0.44);
  ctx.fillStyle = "#efe8d8";
  ctx.fill();
  ctx.strokeStyle = "rgba(120,106,86,0.35)";
  ctx.lineWidth = Math.max(px, 0.4);
  ctx.stroke();

  archPath(ctx, 541, 390, 208, 242, 0.44);
  const recess = ctx.createLinearGradient(0, 390, 0, 632);
  recess.addColorStop(0, "#756755");
  recess.addColorStop(0.45, "#5d5142");
  recess.addColorStop(1, "#3e352b");
  ctx.fillStyle = recess;
  ctx.fill();

  // Inner arch ring and the screen it frames.
  const ix = 556;
  const iw = 178;
  archPath(ctx, ix, 404, iw, 228, 0.44);
  ctx.fillStyle = "#4a4034";
  ctx.fill();
  ctx.strokeStyle = "rgba(246,238,222,0.75)";
  ctx.lineWidth = Math.max(px * 2.4, 0.8);
  archPath(ctx, ix, 404, iw, 228, 0.44);
  ctx.stroke();

  // The great lattice screen, in a marble frame.
  archPath(ctx, 586, 452, 118, 146, 0.46);
  ctx.fillStyle = "#e3dac7";
  ctx.fill();
  archPath(ctx, 593, 460, 104, 138, 0.46);
  ctx.fillStyle = "#4a4034";
  ctx.fill();
  jali(ctx, 595, 462, 100, 136, zoom, px, "rgba(241,232,213,0.75)");
  ctx.strokeStyle = "rgba(210,198,176,0.8)";
  ctx.lineWidth = Math.max(px * 1.2, 0.4);
  for (const x of [586.5, 645, 703.5]) {
    ctx.beginPath();
    ctx.moveTo(x, 470);
    ctx.lineTo(x, 598);
    ctx.stroke();
  }

  // Shoulder niches, one on each side of the screen.
  for (const nx of [560, 712]) {
    archPath(ctx, nx, 494, 28, 106, 0.5);
    ctx.fillStyle = "#695c4a";
    ctx.fill();
    ctx.strokeStyle = "rgba(226,216,196,0.5)";
    ctx.lineWidth = Math.max(px, 0.4);
    ctx.stroke();
    if (zoom > 3) jali(ctx, nx + 4, 505, 20, 90, zoom, px, "rgba(230,220,200,0.5)");
  }

  // The doorway at the foot of the great arch.
  archPath(ctx, 614, 585, 62, 47, 0.44);
  ctx.fillStyle = "#3a2b1f";
  ctx.fill();
  ctx.strokeStyle = "rgba(235,225,205,0.6)";
  ctx.lineWidth = Math.max(px * 2, 0.7);
  ctx.stroke();
  if (zoom > 1.8) {
    ctx.strokeStyle = "rgba(194,158,90,0.5)";
    ctx.lineWidth = Math.max(px, 0.4);
    ctx.beginPath();
    ctx.moveTo(645, 588);
    ctx.lineTo(645, 630);
    ctx.moveTo(620, 604);
    ctx.lineTo(670, 604);
    ctx.moveTo(620, 618);
    ctx.lineTo(670, 618);
    ctx.stroke();
  }

  // Threshold and the pale floor of the portal.
  ctx.fillStyle = "rgba(246,238,222,0.35)";
  ctx.fillRect(541, 628, 208, 4);

  // Pietra-dura spandrels and the inlaid frame strips.
  floralSpray(ctx, 570, 432, 1.05, zoom, px);
  floralSpray(ctx, 720, 432, 1.05, zoom, px);
  inlayBorder(ctx, 514, 380, 12, 252, zoom, px, true, 14);
  inlayBorder(ctx, 764, 380, 12, 252, zoom, px, true, 14);
  inlayBorder(ctx, 526, 368, 238, 11, zoom, px, false, 12);

  blockJoints(ctx, 514, 368, 262, 20, zoom, px, 32, 12);
  if (zoom > 2.6) {
    floralSpray(ctx, 528, 600, 0.8, zoom, px);
    floralSpray(ctx, 762, 600, 0.8, zoom, px);
  }
}

export function drawBuilding(ctx, zoom, px) {
  // Narrow side sections between the central block and the wings.
  const side = ctx.createLinearGradient(0, 404, 0, 632);
  side.addColorStop(0, "#e2dac8");
  side.addColorStop(1, "#cdc3ad");
  ctx.fillStyle = side;
  ctx.fillRect(494, 404, 6, 228);
  ctx.fillRect(790, 404, 6, 228);

  centralBlock(ctx);
  drawWings(ctx, zoom, px);

  pishtaq(ctx, zoom, px);

  ctx.fillStyle = "rgba(255,252,244,0.4)";
  ctx.fillRect(494, 620, 304, 12);
}
