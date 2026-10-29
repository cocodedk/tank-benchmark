import { PARTS, WORLD_HEIGHT, WORLD_WIDTH } from "./model.js";

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 20;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const round = (n) => Math.round(n * 1e6) / 1e6;

export function createCamera() {
  const cam = {
    x: 0,
    y: 0,
    zoom: 1,
    width: 1,
    height: 1,
    baseScale: 1,
  };

  cam.resize = (width, height) => {
    cam.width = Math.max(1, width);
    cam.height = Math.max(1, height);
    cam.baseScale = Math.min(cam.width / WORLD_WIDTH, cam.height / WORLD_HEIGHT);
  };

  cam.scale = () => cam.baseScale * cam.zoom;

  cam.screenToWorld = (sx, sy) => ({
    x: cam.x + (sx - cam.width / 2) / cam.scale(),
    y: cam.y + (sy - cam.height / 2) / cam.scale(),
  });

  // Zoom about a screen point, keeping the model point under it still.
  cam.zoomAt = (factor, sx = cam.width / 2, sy = cam.height / 2) => {
    if (!Number.isFinite(factor) || factor <= 0) return;
    const before = cam.screenToWorld(sx, sy);
    cam.zoom = clamp(cam.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    cam.x = before.x - (sx - cam.width / 2) / cam.scale();
    cam.y = before.y - (sy - cam.height / 2) / cam.scale();
  };

  // Move the view by dx, dy model units (the centre of the window moves too).
  cam.pan = (dx, dy) => {
    const x = cam.x + dx;
    const y = cam.y + dy;
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6) {
      return false;
    }
    cam.x = x;
    cam.y = y;
    return true;
  };

  cam.reset = () => {
    cam.x = 0;
    cam.y = 0;
    cam.zoom = 1;
  };

  cam.describe = () => ({
    ok: true,
    zoom: round(cam.zoom),
    x: round(cam.x),
    y: round(cam.y),
    parts: PARTS.slice(),
  });

  cam.viewBounds = () => {
    const halfW = cam.width / (2 * cam.scale());
    const halfH = cam.height / (2 * cam.scale());
    return {
      left: cam.x - halfW,
      right: cam.x + halfW,
      top: cam.y - halfH,
      bottom: cam.y + halfH,
    };
  };

  cam.apply = (ctx) => {
    ctx.translate(cam.width / 2, cam.height / 2);
    ctx.scale(cam.scale(), cam.scale());
    ctx.translate(-cam.x, -cam.y);
  };

  return cam;
}
