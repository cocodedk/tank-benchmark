// The camera. The drawing lives in model units (MODEL wide by MODEL tall) and the
// view is a rectangle of that model shown in a `viewBox`; zoom 1 fits it all.
export const MODEL = { w: 1200, h: 780, cx: 600, cy: 390 };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 20;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function createView(w = 1280, h = 800) {
  return { zoom: MIN_ZOOM, cx: MODEL.cx, cy: MODEL.cy, w, h };
}

/** Model units per pixel for a given zoom (the fitting scale times the zoom). */
export function scaleOf(view, zoom = view.zoom) {
  return zoom * Math.min(view.w / MODEL.w, view.h / MODEL.h);
}

/** The visible model rectangle, as an SVG viewBox string. */
export function viewBox(view) {
  const bw = MODEL.w / view.zoom, bh = MODEL.h / view.zoom;
  return `${view.cx - bw / 2} ${view.cy - bh / 2} ${bw} ${bh}`;
}

/** Keep the window on the drawing: once the drawing is smaller than the window on
 *  an axis, that axis is pinned to the middle. */
export function clampCenter(view) {
  const s = scaleOf(view);
  const halfW = view.w / (2 * s), halfH = view.h / (2 * s);
  view.cx = halfW * 2 >= MODEL.w ? MODEL.cx : clamp(view.cx, halfW, MODEL.w - halfW);
  view.cy = halfH * 2 >= MODEL.h ? MODEL.cy : clamp(view.cy, halfH, MODEL.h - halfH);
  return view;
}

/** The model point under a pixel of the window (the drawing is letterboxed, centred). */
export function toModel(view, px, py) {
  const s = scaleOf(view);
  const bw = MODEL.w / view.zoom, bh = MODEL.h / view.zoom;
  return {
    x: view.cx - bw / 2 + (px - (view.w - bw * s) / 2) / s,
    y: view.cy - bh / 2 + (py - (view.h - bh * s) / 2) / s,
  };
}

/** Zoom about a pixel, so the model point under it stays under it. */
export function zoomAt(view, zoom, px = view.w / 2, py = view.h / 2) {
  const anchor = toModel(view, px, py);
  view.zoom = clamp(Number(zoom), MIN_ZOOM, MAX_ZOOM);
  const s = scaleOf(view);
  view.cx = anchor.x + (view.w / 2 - px) / s;
  view.cy = anchor.y + (view.h / 2 - py) / s;
  return clampCenter(view);
}

export function zoomBy(view, factor, px, py) {
  return zoomAt(view, view.zoom * factor, px, py);
}

/** Shift the drawing on screen by (dx, dy) model units, as a drag does. */
export function panBy(view, dx, dy) {
  view.cx -= Number(dx) || 0;
  view.cy -= Number(dy) || 0;
  return clampCenter(view);
}

export function reset(view) {
  view.zoom = MIN_ZOOM;
  view.cx = MODEL.cx;
  view.cy = MODEL.cy;
  return view;
}
