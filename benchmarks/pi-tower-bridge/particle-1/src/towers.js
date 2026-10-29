/* The two Gothic towers: piers, shafts, windows, corner turrets and roofs. */

import { G } from "./world.js";
import { archPath, masonry, stonePanel, fillWorldRect, worldLine } from "./shapes.js";

export function drawTowers(ctx, cam, w, h) {
  for (const side of [-1, 1]) drawTower(ctx, cam, w, h, side * G.towerX);
}

function drawTower(ctx, cam, w, h, cx) {
  const z = cam.zoom;

  // Pier, wider than the shaft, standing in the river.
  const pier = { x: cx - G.towerHalf - 15, y: G.deckY, w: 2 * (G.towerHalf + 15), h: -G.deckY + 8 };
  stonePanel(ctx, cam, w, h, pier, { light: "#bfb192", mid: "#ab9c7d", dark: "#8d7f64" });
  masonry(ctx, cam, w, h, pier, { row: 16, col: 32 });
  fillWorldRect(ctx, cam, w, h, cx - G.towerHalf - 18, G.deckY, 2 * (G.towerHalf + 18), 14, "#c9bb9c");

  // Main shaft.
  const shaft = { x: cx - G.towerHalf, y: G.shaftTop, w: 2 * G.towerHalf, h: G.deckY - G.shaftTop };
  stonePanel(ctx, cam, w, h, shaft);
  masonry(ctx, cam, w, h, shaft, { row: 20, col: 42 });

  // The road passes through a pointed arch at deck level.
  archPath(ctx, cam, w, h, cx, G.deckY + 2, 30, 84);
  const [asx, asy] = cam.toScreen(cx, G.deckY - 80, w, h);
  const [aex, aey] = cam.toScreen(cx, G.deckY, w, h);
  const arch = ctx.createLinearGradient(asx, asy, aex, aey);
  arch.addColorStop(0, "#4a5456");
  arch.addColorStop(1, "#272d2f");
  ctx.fillStyle = arch;
  ctx.fill();
  ctx.strokeStyle = "rgba(70,56,36,0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Window tiers, refined as the view comes closer.
  drawWindowTier(ctx, cam, w, h, cx, z);
  drawStringCourses(ctx, cam, w, h, cx);

  // Parapet with crenellations along the top of the wall.
  drawParapet(ctx, cam, w, h, cx);

  // Corner turrets: a pair at the rear corners peeks out behind the front pair.
  drawTurret(ctx, cam, w, h, cx - 34, 22, z, true);
  drawTurret(ctx, cam, w, h, cx + 34, 22, z, true);
  drawTurret(ctx, cam, w, h, cx - 44, 26, z, false);
  drawTurret(ctx, cam, w, h, cx + 44, 26, z, false);

  // A little depth on the flanks.
  for (const flank of [-1, 1]) {
    fillWorldRect(ctx, cam, w, h, flank < 0 ? cx - G.towerHalf : cx + G.towerHalf - 4,
      G.shaftTop, 4, G.deckY - G.shaftTop, "rgba(60,46,28,0.16)");
  }
}

function drawWindowTier(ctx, cam, w, h, cx, z) {
  // Central tall window.
  archPath(ctx, cam, w, h, cx, -258, 22, 104);
  ctx.fillStyle = "#b8a988";
  ctx.fill();
  archPath(ctx, cam, w, h, cx, -262, 17, 92);
  ctx.fillStyle = "#42545a";
  ctx.fill();
  if (z > 1.7) {
    ctx.strokeStyle = "rgba(40,40,38,0.55)";
    ctx.lineWidth = Math.max(1, 0.35 * cam.scale(w, h));
    worldLine(ctx, cam, w, h, cx, -262, cx, -336);
    ctx.stroke();
    worldLine(ctx, cam, w, h, cx - 16, -292, cx + 16, -292);
    ctx.stroke();
    ctx.fillStyle = "rgba(210,225,228,0.18)";
    archPath(ctx, cam, w, h, cx, -266, 15, 86);
    ctx.fill();
  }

  // Upper lancet pair.
  for (const dx of [-11, 11]) {
    archPath(ctx, cam, w, h, cx + dx, -398, 6.5, 40);
    ctx.fillStyle = "#3d4d52";
    ctx.fill();
  }
  if (z > 2.2) {
    archPath(ctx, cam, w, h, cx, -430, 4.5, 18);
    ctx.fillStyle = "#4d5f62";
    ctx.fill();
    ctx.strokeStyle = "rgba(80,66,44,0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Window band low on the shaft, either side of the road arch.
  for (const dx of [-45, 45]) {
    archPath(ctx, cam, w, h, cx + dx, -150, 7, 34);
    ctx.fillStyle = "#3b4a4e";
    ctx.fill();
    if (z > 2.6) {
      ctx.strokeStyle = "rgba(226,235,234,0.28)";
      ctx.lineWidth = 1;
      worldLine(ctx, cam, w, h, cx + dx, -152, cx + dx, -178);
      ctx.stroke();
    }
  }
}

function drawStringCourses(ctx, cam, w, h, cx) {
  const left = cx - G.towerHalf + 2;
  const right = cx + G.towerHalf - 2;
  for (const y of [-214, -330, -446]) {
    ctx.strokeStyle = "rgba(245,238,218,0.5)";
    ctx.lineWidth = Math.max(1, 0.5 * cam.scale(w, h));
    worldLine(ctx, cam, w, h, left, y, right, y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(72,58,38,0.32)";
    ctx.lineWidth = 1;
    worldLine(ctx, cam, w, h, left, y + 3, right, y + 3);
    ctx.stroke();
  }
}

function drawParapet(ctx, cam, w, h, cx) {
  fillWorldRect(ctx, cam, w, h, cx - 30, G.shaftTop - 5, 60, 6, "#d2c4a6");
  for (let x = cx - 29; x < cx + 29; x += 12) {
    fillWorldRect(ctx, cam, w, h, x, G.shaftTop - 16, 6, 12, "#cdbfa0");
    fillWorldRect(ctx, cam, w, h, x + 6, G.shaftTop - 16, 1.5, 12, "rgba(74,60,38,0.25)");
  }
}

function drawTurret(ctx, cam, w, h, cx, width, z, behind) {
  const bodyTop = G.shaftTop - (behind ? 26 : 44);
  const body = { x: cx - width / 2, y: bodyTop, w: width, h: G.deckY - bodyTop };
  stonePanel(ctx, cam, w, h, body, behind
    ? { light: "#bbad90", mid: "#a89a7c", dark: "#8b7e63" }
    : { light: "#ded2b6", mid: "#cbbc9b", dark: "#a99a7a" });
  masonry(ctx, cam, w, h, body, { row: 16, col: 22 });

  // Vertical shadow down one side.
  fillWorldRect(ctx, cam, w, h, cx + width / 2 - 3, bodyTop, 3, G.deckY - bodyTop, "rgba(64,50,32,0.18)");

  if (z > 2.1) {
    for (let y = bodyTop + 34; y < G.deckY - 30; y += 58) {
      archPath(ctx, cam, w, h, cx, y, 2.6, 14);
      ctx.fillStyle = behind ? "#4b5150" : "#3f4a4c";
      ctx.fill();
    }
  }

  // Battlements at the turret head, then the octagonal roof.
  fillWorldRect(ctx, cam, w, h, cx - width / 2 - 3, bodyTop - 6, width + 6, 7, "#c9ba9b");
  if (!behind) {
    for (let x = cx - width / 2 - 2; x < cx + width / 2 + 1; x += 9) {
      fillWorldRect(ctx, cam, w, h, x, bodyTop - 14, 5, 8, "#d4c6a7");
    }
  }

  const apexY = G.turretTop + (behind ? 24 : 0);
  const S = (x, y) => cam.toScreen(x, y, w, h);
  const eaveY = bodyTop - 8;
  const half = width / 2 + 5;
  const [ax, ay] = S(cx - half, eaveY);
  const [bx, by] = S(cx + half, eaveY);
  const [shx, shy] = S(cx + half - 5, eaveY - 9);
  const [px, py] = S(cx, apexY);
  const [lhx, lhy] = S(cx - half + 5, eaveY - 9);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(shx, shy);
  ctx.lineTo(px, py);
  ctx.lineTo(lhx, lhy);
  ctx.closePath();
  const roof = ctx.createLinearGradient(ax, 0, bx, 0);
  roof.addColorStop(0, behind ? "#72857c" : "#84988e");
  roof.addColorStop(0.55, behind ? "#5d7069" : "#6d8279");
  roof.addColorStop(1, "#4f625c");
  ctx.fillStyle = roof;
  ctx.fill();
  ctx.strokeStyle = "rgba(42,56,52,0.6)";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (!behind && z > 1.8) {
    ctx.strokeStyle = "rgba(220,230,225,0.22)";
    worldLine(ctx, cam, w, h, cx - half + 5, eaveY - 9, cx, apexY);
    ctx.stroke();
  }

  // Finial.
  worldLine(ctx, cam, w, h, cx, apexY, cx, apexY - 14);
  ctx.strokeStyle = "#52605b";
  ctx.lineWidth = Math.max(1, 0.5 * cam.scale(w, h));
  ctx.stroke();
}
