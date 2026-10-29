/* Mouse wheel, drag and the three buttons. */

import { panBy, reset, scaleFor, zoomAt, zoomBy } from "./view.js";

export function installInput(canvas, view, redraw) {
  const size = () => {
    const r = canvas.getBoundingClientRect();
    return { w: r.width, h: r.height };
  };

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const r = canvas.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * 0.0016);
      zoomAt(view, factor, r.width, r.height, event.clientX - r.left, event.clientY - r.top);
      redraw();
    },
    { passive: false }
  );

  let drag = null;
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const { w, h } = size();
    const s = scaleFor(view, w, h);
    panBy(view, -(event.clientX - drag.x) / s, -(event.clientY - drag.y) / s);
    drag = { x: event.clientX, y: event.clientY };
    redraw();
  });

  const endDrag = (event) => {
    if (!drag) return;
    drag = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.classList.remove("dragging");
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  const button = (id) => document.getElementById(id);
  button("zoom-in").addEventListener("click", () => {
    const { w, h } = size();
    zoomBy(view, 1.5, w, h);
    redraw();
  });
  button("zoom-out").addEventListener("click", () => {
    const { w, h } = size();
    zoomBy(view, 1 / 1.5, w, h);
    redraw();
  });
  button("reset").addEventListener("click", () => {
    reset(view);
    redraw();
  });
}
