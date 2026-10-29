/* Suspension chains, hangers, the road deck and its street furniture. */

import { G } from "./world.js";
import { screenRect, fillWorldRect, worldLine } from "./shapes.js";

const inner = G.towerX - G.towerHalf;
const anchorX = G.shoreX - 26;
const anchorY = G.deckY - 24;

export function drawChains(ctx, cam, w, h) {
  for (const side of [-1, 1]) {
    drawChain(ctx, cam, w, h, side, true);
    drawChain(ctx, cam, w, h, side, false);
  }
}

function chainY(t) {
  return -506 + (anchorY + 506) * Math.pow(t, 1.72);
}

function drawChain(ctx, cam, w, h, side, behind) {
  const startX = side * (G.towerX + G.towerHalf - 8);
  const endX = side * anchorX;
  const drop = behind ? 9 : 0;
  const s = cam.scale(w, h);
  const points = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    points.push([startX + (endX - startX) * t, chainY(t) - drop]);
  }

  const trace = () => {
    ctx.beginPath();
    points.forEach(([x, y], i) => {
      const [px, py] = cam.toScreen(x, y, w, h);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
  };

  ctx.strokeStyle = behind ? "rgba(62,68,64,0.72)" : "#4c5450";
  ctx.lineWidth = Math.max(1.8, Math.min(10, 3 * s));
  trace();
  ctx.stroke();

  if (!behind) {
    ctx.strokeStyle = "rgba(206,215,208,0.42)";
    ctx.lineWidth = Math.max(0.7, Math.min(3, 0.7 * s));
    trace();
    ctx.stroke();
    if (s > 3.5) {
      // Link plates, visible only when the chain is large on screen.
      ctx.save();
      ctx.setLineDash([Math.max(2, 1.6 * s), Math.max(1.5, 1.1 * s)]);
      ctx.strokeStyle = "rgba(28,34,31,0.5)";
      ctx.lineWidth = Math.max(1, Math.min(5, 1.4 * s));
      trace();
      ctx.stroke();
      ctx.restore();
    }
  }

  // Vertical hangers to the deck.
  ctx.strokeStyle = behind ? "rgba(60,66,62,0.55)" : "rgba(56,62,58,0.85)";
  ctx.lineWidth = Math.max(1, Math.min(3, 1.1 * s));
  for (let x = side * (G.towerX + G.towerHalf + 24); side * x < anchorX - 18; x += side * 62) {
    const t = (x - startX) / (endX - startX);
    const top = chainY(Math.max(0, Math.min(1, t))) - drop;
    if (top >= G.deckY - 2) continue;
    worldLine(ctx, cam, w, h, x, top, x, G.deckY - 2);
    ctx.stroke();
    if (s > 6) {
      ctx.fillStyle = "rgba(40,46,42,0.7)";
      const [px, py] = cam.toScreen(x, top, w, h);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1, 1.4 * s), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawAnchor(ctx, cam, w, h, side);
}

function drawAnchor(ctx, cam, w, h, side) {
  const x = side * (anchorX - 12);
  const [sx, sy, sw, sh] = screenRect(cam, w, h, x - 20, anchorY + 4, 62, 58);
  ctx.fillStyle = "#a99b7d";
  ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = "rgba(62,48,30,0.22)";
  ctx.fillRect(sx + sw * 0.72, sy, sw * 0.28, sh);
  ctx.strokeStyle = "rgba(70,56,36,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(sx, sy, sw, sh);
}

export function drawDeck(ctx, cam, w, h) {
  const z = cam.zoom;
  const surface = G.deckY;

  // Running surface and its girder.
  fillWorldRect(ctx, cam, w, h, -G.shoreX, surface, 2 * G.shoreX, 15, "#626a68");
  fillWorldRect(ctx, cam, w, h, -G.shoreX, surface - 4, 2 * G.shoreX, 5, "#8a8f86");

  // Bascule leaves between the towers read slightly lighter, with a joint at the centre.
  fillWorldRect(ctx, cam, w, h, -inner, surface - 5, 2 * inner, 16, "#767c73");
  fillWorldRect(ctx, cam, w, h, -2, surface - 5, 4, 16, "#3d4341");

  // Expansion joints at the tower edges.
  for (const x of [-inner, inner]) {
    fillWorldRect(ctx, cam, w, h, x - 1.5, surface - 4, 3, 19, "#3f4643");
  }

  drawGirder(ctx, cam, w, h, -G.shoreX, -inner + 4, z);
  drawGirder(ctx, cam, w, h, inner - 4, G.shoreX, z);

  drawRailings(ctx, cam, w, h, z);
  if (z > 1.8) drawLamps(ctx, cam, w, h, z);
  if (z > 2.4) drawTraffic(ctx, cam, w, h, z);
}

function drawGirder(ctx, cam, w, h, x0, x1, z) {
  const top = G.deckY + 11;
  const bottom = G.deckY + 34;
  fillWorldRect(ctx, cam, w, h, x0, top, x1 - x0, bottom - top, "rgba(72,82,76,0.85)");
  if (z < 1.5) return;
  ctx.strokeStyle = "rgba(42,52,48,0.5)";
  ctx.lineWidth = 1;
  for (let x = x0; x < x1 - 20; x += 28) {
    worldLine(ctx, cam, w, h, x, top, Math.min(x + 28, x1), bottom);
    ctx.stroke();
    worldLine(ctx, cam, w, h, x, bottom, Math.min(x + 28, x1), top);
    ctx.stroke();
  }
}

function drawRailings(ctx, cam, w, h, z) {
  const s = cam.scale(w, h);
  ctx.strokeStyle = "rgba(48,58,54,0.8)";
  ctx.lineWidth = Math.max(0.8, Math.min(3, 0.7 * s));
  worldLine(ctx, cam, w, h, -G.shoreX, G.deckY - 15, G.shoreX, G.deckY - 15);
  ctx.stroke();
  worldLine(ctx, cam, w, h, -G.shoreX, G.deckY - 8, G.shoreX, G.deckY - 8);
  ctx.stroke();
  if (z > 1.35) {
    ctx.lineWidth = Math.max(0.6, Math.min(2, 0.5 * s));
    for (let x = -G.shoreX + 4; x < G.shoreX; x += 20) {
      worldLine(ctx, cam, w, h, x, G.deckY - 15, x, G.deckY - 1);
      ctx.stroke();
    }
  }
}

function drawLamps(ctx, cam, w, h, z) {
  const s = cam.scale(w, h);
  for (let x = -G.shoreX + 50; x < G.shoreX; x += 96) {
    worldLine(ctx, cam, w, h, x, G.deckY - 6, x, G.deckY - 34);
    ctx.strokeStyle = "#3f4845";
    ctx.lineWidth = Math.max(0.8, Math.min(2.5, 0.6 * s));
    ctx.stroke();
    const [px, py] = cam.toScreen(x, G.deckY - 36, w, h);
    ctx.fillStyle = "rgba(250,236,190,0.95)";
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1.2, Math.min(4, 1.3 * s)), 0, Math.PI * 2);
    ctx.fill();
    if (z > 5) {
      ctx.fillStyle = "rgba(250,230,170,0.14)";
      ctx.beginPath();
      ctx.arc(px, py, Math.max(3, Math.min(12, 5 * s)), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTraffic(ctx, cam, w, h, z) {
  const cars = [
    [-64, "#b4483f"], [18, "#2f5d86"], [330, "#c8a33c"], [-470, "#4e6b4a"], [620, "#7b7f86"],
  ];
  for (const [x, colour] of cars) {
    const [sx, sy, sw, sh] = screenRect(cam, w, h, x - 11, G.deckY - 12, 22, 9);
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.roundRect(sx, sy, sw, sh, Math.min(3, sh / 2));
    ctx.fill();
    ctx.fillStyle = "rgba(210,230,235,0.75)";
    ctx.fillRect(sx + sw * 0.22, sy + sh * 0.16, sw * 0.56, sh * 0.4);
    if (z > 5) {
      ctx.fillStyle = "#232624";
      for (const off of [0.2, 0.78]) {
        ctx.beginPath();
        ctx.arc(sx + sw * off, sy + sh, Math.max(1, sh * 0.28), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
