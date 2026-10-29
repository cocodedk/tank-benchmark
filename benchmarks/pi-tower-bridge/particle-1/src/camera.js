/* Zoom and pan, and the model <-> screen mapping. */

import { VIEW } from "./world.js";

export class Camera {
  constructor() {
    this.zoom = 1;
    this.cx = 0;
    this.cy = VIEW.centreY;
  }

  fitScale(w, h) {
    return Math.min(w / VIEW.width, h / VIEW.height);
  }

  scale(w, h) {
    return this.fitScale(w, h) * this.zoom;
  }

  toScreen(x, y, w, h) {
    const s = this.scale(w, h);
    return [w / 2 + (x - this.cx) * s, h / 2 + (y - this.cy) * s];
  }

  toModel(px, py, w, h) {
    const s = this.scale(w, h);
    return [this.cx + (px - w / 2) / s, this.cy + (py - h / 2) / s];
  }

  clampZoom(z) {
    return Math.min(VIEW.maxZoom, Math.max(VIEW.minZoom, z));
  }

  /* Zoom so the model point under (px, py) stays under it. */
  zoomTowards(z, px, py, w, h) {
    const next = this.clampZoom(z);
    if (next === this.zoom) return;
    const anchor = this.toModel(px, py, w, h);
    this.zoom = next;
    const s = this.scale(w, h);
    this.cx = anchor[0] - (px - w / 2) / s;
    this.cy = anchor[1] - (py - h / 2) / s;
  }

  zoomAtCentre(factor, w, h) {
    this.zoom = this.clampZoom(this.zoom * factor);
  }

  pan(dx, dy) {
    this.cx += dx;
    this.cy += dy;
  }

  reset() {
    this.zoom = 1;
    this.cx = 0;
    this.cy = VIEW.centreY;
  }
}
