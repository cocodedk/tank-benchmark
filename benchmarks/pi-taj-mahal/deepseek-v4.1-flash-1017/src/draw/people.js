/* Visitors: a dense line on the terrace, a scatter through the garden. */

import { seeded } from "./util.js";

const SHIRTS = [
  "#b8443a", "#3d5f8c", "#cf8a2d", "#ece7dc", "#496d3c",
  "#8a5a9a", "#232a32", "#c8bea6", "#d56b7e", "#5f9cc2",
  "#e0b23f", "#7a4634", "#9bb0b8", "#d9d3c6",
];
const SKIN = ["#c58f68", "#e0b48b", "#a86c46", "#8b5637", "#dca77c"];
const PANTS = ["#2b3038", "#3d4650", "#6a5a48", "#d8d2c5", "#334455"];

function figure(ctx, x, baseY, h, shirt, skin, pants, zoom, parasol) {
  const w = Math.max(h * 0.32, 1.1);
  ctx.save();
  if (zoom > 1.4) {
    ctx.fillStyle = "rgba(25,30,20,0.22)";
    ctx.beginPath();
    ctx.ellipse(x, baseY, w * 0.7, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = pants;
  ctx.fillRect(x - w * 0.34, baseY - h * 0.44, w * 0.28, h * 0.44);
  ctx.fillRect(x + w * 0.06, baseY - h * 0.44, w * 0.28, h * 0.44);

  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, baseY - h * 0.82, w, h * 0.44, Math.max(w * 0.2, 0.4));
  ctx.fill();

  if (zoom > 1.6) {
    ctx.fillStyle = shirt;
    ctx.fillRect(x - w * 0.62, baseY - h * 0.78, w * 0.18, h * 0.3);
    ctx.fillRect(x + w * 0.44, baseY - h * 0.78, w * 0.18, h * 0.3);
  }

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, baseY - h * 0.88, Math.max(h * 0.13, 0.7), 0, Math.PI * 2);
  ctx.fill();

  if (zoom > 2.4) {
    ctx.fillStyle = "#2b2118";
    ctx.beginPath();
    ctx.arc(x, baseY - h * 0.9, Math.max(h * 0.13, 0.7), Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();
  }
  if (parasol) {
    ctx.strokeStyle = "rgba(60,50,40,0.6)";
    ctx.lineWidth = Math.max(0.35, zoom > 2 ? 0.5 : 0.3);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, baseY - h * 0.5);
    ctx.lineTo(x + w * 0.5, baseY - h * 1.35);
    ctx.stroke();
    ctx.fillStyle = parasol;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, baseY - h * 1.32, w * 0.95, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawTerraceCrowd(ctx, zoom, px) {
  const rand = seeded(77);
  for (let i = 0; i < 155; i++) {
    const x = 294 + rand() * 698;
    const baseY = 646 + rand() * 8;
    const h = 8 + rand() * 5.5;
    const shirt = SHIRTS[Math.floor(rand() * SHIRTS.length)];
    const skin = SKIN[Math.floor(rand() * SKIN.length)];
    const pants = PANTS[Math.floor(rand() * PANTS.length)];
    figure(ctx, x, baseY, h, shirt, skin, pants, zoom, zoom > 2.5 && rand() > 0.93 ? SHIRTS[Math.floor(rand() * 4)] : null);
  }
}

export function drawGardenCrowd(ctx, zoom, px) {
  const rand = seeded(88);
  for (let i = 0; i < 38; i++) {
    const side = rand();
    const x = side < 0.5 ? 438 + rand() * 104 : 744 + rand() * 108;
    const baseY = 712 + rand() * 84;
    const depth = (baseY - 700) / 100;
    const h = 11 + depth * 15 + rand() * 4;
    const shirt = SHIRTS[Math.floor(rand() * SHIRTS.length)];
    const skin = SKIN[Math.floor(rand() * SKIN.length)];
    const pants = PANTS[Math.floor(rand() * PANTS.length)];
    figure(ctx, x, baseY, h, shirt, skin, pants, zoom, zoom > 2 && rand() > 0.8 ? SHIRTS[Math.floor(rand() * 3)] : null);
  }
}
