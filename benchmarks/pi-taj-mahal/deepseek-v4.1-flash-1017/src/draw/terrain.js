/* The tree line behind the monument, and the great tree on the right. */

import { PAL, seeded } from "./util.js";

function canopy(ctx, x, baseY, r, fill, rim, zoom, px, rand) {
  const lobes = 3;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, baseY - r * 0.9, r, r * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < lobes; i++) {
    const lx = x + (rand() - 0.5) * r * 1.1;
    const ly = baseY - r * (0.8 + rand() * 0.5);
    ctx.beginPath();
    ctx.ellipse(lx, ly, r * (0.5 + rand() * 0.35), r * (0.45 + rand() * 0.3), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (zoom > 2.2) {
    ctx.strokeStyle = rim;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(px * 1.4, 0.6);
    ctx.beginPath();
    ctx.arc(x - r * 0.1, baseY - r * 1.05, r * 0.85, Math.PI * 1.08, Math.PI * 1.8);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function bigTree(ctx, zoom, px) {
  const rand = seeded(41);
  const blobs = [
    [1176, 470, 82], [1230, 500, 96], [1290, 462, 88], [1342, 522, 92],
    [1205, 566, 78], [1262, 604, 86], [1322, 596, 80], [1385, 572, 88],
    [1150, 600, 52], [1390, 640, 78], [1300, 660, 62],
  ];
  for (const [x, y, r] of blobs) canopy(ctx, x, y + r, r, PAL.treeDark, PAL.treeLight, zoom, px, rand);
  ctx.fillStyle = "#4a3a26";
  ctx.fillRect(1228, 630, 26, 60);
  if (zoom > 2) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = PAL.treeLight;
    for (let i = 0; i < 150; i++) {
      const x = 1130 + rand() * 260;
      const y = 420 + rand() * 240;
      ctx.beginPath();
      ctx.ellipse(x, y, 2.2 + rand() * 3, 1.4 + rand() * 2, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function bareTree(ctx, zoom, px) {
  ctx.save();
  ctx.strokeStyle = "#6d5a43";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(3, px * 3);
  ctx.beginPath();
  ctx.moveTo(196, 700);
  ctx.bezierCurveTo(198, 660, 192, 630, 199, 588);
  ctx.moveTo(198, 650);
  ctx.bezierCurveTo(184, 632, 178, 618, 170, 604);
  ctx.moveTo(198, 636);
  ctx.bezierCurveTo(212, 620, 218, 608, 228, 596);
  ctx.moveTo(196, 624);
  ctx.bezierCurveTo(190, 608, 186, 600, 184, 590);
  ctx.stroke();
  if (zoom > 2.5) {
    ctx.lineWidth = Math.max(1, px * 1.1);
    ctx.beginPath();
    ctx.moveTo(170, 604);
    ctx.lineTo(160, 594);
    ctx.moveTo(170, 604);
    ctx.lineTo(176, 592);
    ctx.moveTo(228, 596);
    ctx.lineTo(236, 588);
    ctx.moveTo(228, 596);
    ctx.lineTo(222, 584);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTerrain(ctx, zoom, px) {
  const rand = seeded(7);

  ctx.fillStyle = "#587a3d";
  ctx.fillRect(-6000, 620, 15000, 60);

  for (let x = -700; x < 2000; x += 24) {
    const r = 18 + rand() * 26;
    const base = 660 + rand() * 8;
    const fill = rand() > 0.45 ? PAL.tree : PAL.treeDark;
    canopy(ctx, x, base, r, fill, PAL.treeLight, zoom, px, rand);
  }

  // Taller stands at the edges of the photograph.
  for (let x = -650; x < 260; x += 36) {
    canopy(ctx, x, 665, 34 + rand() * 34, rand() > 0.5 ? PAL.tree : PAL.treeDark, PAL.treeLight, zoom, px, rand);
  }
  for (let x = 920; x < 1140; x += 34) {
    canopy(ctx, x, 662, 28 + rand() * 30, rand() > 0.5 ? PAL.tree : PAL.treeDark, PAL.treeLight, zoom, px, rand);
  }

  bigTree(ctx, zoom, px);
  bareTree(ctx, zoom, px);
}
