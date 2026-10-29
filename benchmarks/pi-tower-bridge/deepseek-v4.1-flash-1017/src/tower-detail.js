import { DECK_Y } from "./model.js";
import { C } from "./palette.js";
import { archPath, lancetPath } from "./stone.js";

export function ledger(ctx, cx, y, width, height, lod) {
  ctx.fillStyle = C.stoneLight;
  ctx.fillRect(cx - width / 2, y, width, height);
  ctx.fillStyle = "rgba(91, 73, 47, 0.25)";
  ctx.fillRect(cx - width / 2, y + height - 1.2, width, 1.2);
  if (lod < 3) return;
  ctx.fillStyle = C.stoneDark;
  for (let x = cx - width / 2 + 3; x < cx + width / 2 - 3; x += 9) {
    ctx.fillRect(x, y + height, 3, 2);
  }
}

export function drawWindow(ctx, cx, width, top, bottom, lod) {
  lancetPath(ctx, cx, width + 10, top - 4, bottom);
  ctx.fillStyle = C.stoneLight;
  ctx.fill();

  lancetPath(ctx, cx, width, top, bottom);
  const glass = ctx.createLinearGradient(0, top, 0, bottom);
  glass.addColorStop(0, "#5e7d83");
  glass.addColorStop(0.5, C.glass);
  glass.addColorStop(1, "#17262c");
  ctx.fillStyle = glass;
  ctx.fill();

  if (lod >= 2) {
    ctx.save();
    lancetPath(ctx, cx, width, top, bottom);
    ctx.clip();
    const pane = lod >= 15 ? 3 : lod >= 8 ? 6 : 0;
    ctx.strokeStyle = "rgba(214, 222, 203, 0.38)";
    ctx.lineWidth = lod >= 12 ? 0.25 : lod >= 7 ? 0.4 : 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx, bottom);
    if (pane) {
      for (let x = cx - width / 2 + pane; x < cx + width / 2; x += pane) {
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
      }
      for (let y = top + pane; y < bottom; y += pane) {
        ctx.moveTo(cx - width / 2, y);
        ctx.lineTo(cx + width / 2, y);
      }
    } else if (lod >= 4) {
      for (let y = top + 16; y < bottom; y += 16) {
        ctx.moveTo(cx - width / 2, y);
        ctx.lineTo(cx + width / 2, y);
      }
    }
    ctx.stroke();

    const sheen = ctx.createLinearGradient(cx - width / 2, top, cx + width / 2, bottom);
    sheen.addColorStop(0, "rgba(200, 230, 230, 0)");
    sheen.addColorStop(0.42, "rgba(200, 230, 230, 0.07)");
    sheen.addColorStop(0.55, "rgba(200, 230, 230, 0.02)");
    sheen.addColorStop(1, "rgba(200, 230, 230, 0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(cx - width / 2, top, width, bottom - top);
    ctx.restore();
  }

  ctx.fillStyle = C.stoneLight;
  ctx.fillRect(cx - width / 2 - 5, bottom, width + 10, 4);
  if (lod >= 5) {
    ctx.fillStyle = "rgba(70, 55, 35, 0.25)";
    ctx.fillRect(cx - width / 2 - 5, bottom + 4, width + 10, 1.5);
  }
}

export function drawArch(ctx, cx, lod) {
  archPath(ctx, cx, 46, DECK_Y, -74);
  const depth = ctx.createLinearGradient(0, -74, 0, DECK_Y);
  depth.addColorStop(0, "#4f5a58");
  depth.addColorStop(0.5, "#303a39");
  depth.addColorStop(1, "#171e1e");
  ctx.fillStyle = depth;
  ctx.fill();

  if (lod >= 2) {
    ctx.strokeStyle = C.stoneLight;
    ctx.lineWidth = lod >= 5 ? 3.2 : 4.2;
    archPath(ctx, cx, 51, DECK_Y, -81);
    ctx.stroke();
    ctx.strokeStyle = "rgba(92, 72, 45, 0.4)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      archPath(ctx, cx, 46 + i * 2.4, DECK_Y, -74 + i * 1.8);
      ctx.stroke();
    }
    ctx.fillStyle = C.stoneLight;
    ctx.beginPath();
    ctx.moveTo(cx - 5, -82);
    ctx.lineTo(cx + 5, -82);
    ctx.lineTo(cx + 7, -69);
    ctx.lineTo(cx - 7, -69);
    ctx.closePath();
    ctx.fill();
  }

  if (lod >= 5) {
    // A small lantern hangs in the shadow of the roadway arch.
    ctx.fillStyle = "rgba(15, 20, 20, 0.4)";
    ctx.fillRect(cx - 43, -76, 86, 5);
    ctx.strokeStyle = C.iron;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, -72);
    ctx.lineTo(cx, -60);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 220, 150, 0.8)";
    ctx.beginPath();
    ctx.moveTo(cx - 3, -60);
    ctx.lineTo(cx + 3, -60);
    ctx.lineTo(cx + 2, -54);
    ctx.lineTo(cx - 2, -54);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(42, 38, 28, 0.8)";
    ctx.stroke();
  }
}
