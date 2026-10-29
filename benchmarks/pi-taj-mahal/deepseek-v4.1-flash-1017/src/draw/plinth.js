/* The white marble terrace the tomb stands on, with its crowd rail and stairs. */

import { archPath, PAL } from "./util.js";
import { blockJoints } from "./ornament.js";
import { seeded } from "./util.js";

export function drawPlinth(ctx, zoom, px) {
  // Shadow where the terrace meets the garden.
  ctx.fillStyle = "rgba(24,38,20,0.35)";
  ctx.fillRect(256, 660, 780, 18);

  // Top surface, seen between the building and the terrace edge.
  const top = ctx.createLinearGradient(0, 630, 0, 668);
  top.addColorStop(0, "#e7dfcd");
  top.addColorStop(1, "#f2ecdf");
  ctx.fillStyle = top;
  ctx.fillRect(254, 628, 784, 38);

  // Marble paving on the terrace, in large slabs.
  if (zoom > 1.4) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(254, 628, 784, 38);
    ctx.clip();
    const sy = zoom > 5 ? 7 : 11;
    ctx.strokeStyle = "rgba(120,106,86,0.16)";
    ctx.lineWidth = Math.max(px * 0.7, 0.3);
    let row = 0;
    for (let y = 628 + sy; y < 666; y += sy, row++) {
      ctx.beginPath();
      ctx.moveTo(254, y);
      ctx.lineTo(1038, y);
      ctx.stroke();
      ctx.beginPath();
      const off = (row % 2) * (sy * 1.5);
      for (let x = 254 + off; x < 1038; x += sy * 3) {
        ctx.moveTo(x, y - sy);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    if (zoom > 4) {
      const rand = seeded(17);
      ctx.fillStyle = "rgba(150,136,112,0.05)";
      for (let i = 0; i < 40; i++) {
        ctx.fillRect(260 + rand() * 760, 630 + rand() * 30, 10 + rand() * 18, 5 + rand() * 5);
      }
    }
    ctx.restore();
  }

  // Front face and mouldings.
  const face = ctx.createLinearGradient(0, 664, 0, 692);
  face.addColorStop(0, "#e3dbc9");
  face.addColorStop(0.55, "#d5ccb8");
  face.addColorStop(1, "#c1b7a1");
  ctx.fillStyle = face;
  ctx.fillRect(254, 664, 784, 26);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(254, 660, 784, 2);
  ctx.fillStyle = "rgba(90,78,60,0.3)";
  ctx.fillRect(254, 664, 784, 2);
  ctx.fillRect(254, 687, 784, 3);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(254, 676, 784, 1.5);

  // Shallow step below the terrace.
  ctx.fillStyle = "#b9af99";
  ctx.fillRect(270, 690, 752, 8);
  ctx.fillStyle = "#c9c0aa";
  ctx.fillRect(282, 694, 728, 5);

  blockJoints(ctx, 254, 664, 784, 26, zoom, px, zoom > 4 ? 20 : 34, zoom > 4 ? 8 : 13);
  if (zoom > 4) {
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = Math.max(px * 0.6, 0.25);
    for (let x = 262; x < 1030; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 664);
      ctx.lineTo(x, 690);
      ctx.stroke();
    }
  }
  if (zoom > 2.2) {
    for (let x = 280; x < 1020; x += 68) {
      ctx.strokeStyle = "rgba(96,84,66,0.18)";
      ctx.lineWidth = Math.max(px, 0.35);
      ctx.strokeRect(x, 670, 46, 12);
    }
  }

  // Low balustrade at the front edge of the terrace.
  if (zoom > 1.25) {
    ctx.fillStyle = "rgba(238,232,218,0.9)";
    ctx.fillRect(286, 650, 720, 2);
    ctx.fillStyle = "rgba(120,106,86,0.55)";
    for (let x = 290; x < 1004; x += 13) ctx.fillRect(x, 652, 2, 7);
    ctx.fillStyle = "rgba(246,241,230,0.9)";
    ctx.fillRect(286, 658, 720, 2);
  }

  // The small sandstone water-gate at the head of the pool.
  ctx.fillStyle = "#b35a42";
  ctx.fillRect(592, 672, 106, 34);
  ctx.fillStyle = "#c0694e";
  ctx.fillRect(592, 672, 106, 8);
  ctx.fillStyle = "#8e4230";
  ctx.fillRect(592, 706, 106, 3);
  ctx.fillStyle = "#7b3b2b";
  ctx.fillRect(600, 681, 90, 2);
  archPath(ctx, 618, 684, 54, 24, 0.5);
  ctx.fillStyle = "#3d2f24";
  ctx.fill();
  if (zoom > 1.8) {
    ctx.strokeStyle = "rgba(244,234,214,0.55)";
    ctx.lineWidth = Math.max(px * 1.2, 0.5);
    archPath(ctx, 618, 684, 54, 24, 0.5);
    ctx.stroke();
    ctx.strokeStyle = "rgba(244,234,214,0.35)";
    for (let x = 608; x < 690; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 674);
      ctx.lineTo(x, 680);
      ctx.stroke();
    }
  }

  // A few warm reflections of the crowd on the marble.
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = PAL.shadow;
  for (let x = 310; x < 990; x += 37) ctx.fillRect(x, 654, 5, 4);
  ctx.restore();
}
