/* The camera: one zoom factor and the model point under the window centre. */

export const WORLD = { w: 1280, h: 800 };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 20;

export const PARTS = [
  "sky",
  "garden and reflecting pool",
  "cypress avenue",
  "marble plinth",
  "main facade",
  "central dome",
  "chhatris",
  "four minarets",
  "visitors",
];

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const round = (n) => Math.round(n * 1000) / 1000;

/** The camera's model point is centred: (0, 0) is the middle of the picture. */
export function makeView() {
  return { zoom: 1, x: 0, y: 0 };
}

/** Screen pixels per model unit. "Contain": zoom 1 shows the whole picture. */
export function scaleFor(view, cw, ch) {
  return Math.min(cw / WORLD.w, ch / WORLD.h) * view.zoom;
}

export function screenToWorld(view, cw, ch, sx, sy) {
  const s = scaleFor(view, cw, ch);
  return { x: view.x + (sx - cw / 2) / s, y: view.y + (sy - ch / 2) / s };
}

export function describe(view) {
  return {
    ok: true,
    zoom: round(view.zoom),
    x: round(view.x),
    y: round(view.y),
    parts: PARTS.slice(),
  };
}

/** Zoom by a factor, holding the model point under (sx, sy) still. */
export function zoomAt(view, factor, cw, ch, sx, sy) {
  if (!Number.isFinite(factor) || factor <= 0) return;
  const point = screenToWorld(view, cw, ch, sx, sy);
  view.zoom = clamp(view.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  const s = scaleFor(view, cw, ch);
  view.x = point.x - (sx - cw / 2) / s;
  view.y = point.y - (sy - ch / 2) / s;
}

export function zoomBy(view, factor, cw, ch) {
  zoomAt(view, factor, cw, ch, cw / 2, ch / 2);
}

export function panBy(view, dx, dy) {
  view.x += dx;
  view.y += dy;
}

export function reset(view) {
  view.zoom = 1;
  view.x = 0;
  view.y = 0;
}
