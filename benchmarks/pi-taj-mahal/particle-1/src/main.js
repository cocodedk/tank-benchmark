// Wire the drawing to the window: size, wheel zoom, drag to pan, the buttons,
// and the WebMCP tools. All of them share one view object.
import { paintScene, PARTS } from "./scene.js";
import { createView, viewBox, zoomAt, zoomBy, panBy, reset, clampCenter, scaleOf } from "./view.js";
import { registerTools } from "./tools.js";

const svg = document.getElementById("scene");
paintScene(svg);

const view = createView(window.innerWidth, window.innerHeight);

function draw() {
  svg.setAttribute("viewBox", viewBox(view));
}

function resize() {
  view.w = Math.max(1, window.innerWidth);
  view.h = Math.max(1, window.innerHeight);
  clampCenter(view);
  draw();
}

window.addEventListener("resize", resize);
resize();

svg.addEventListener("wheel", (event) => {
  event.preventDefault();
  const step = Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.0016));
  zoomAt(view, view.zoom * step, event.clientX, event.clientY);
  draw();
}, { passive: false });

let drag = null;
svg.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  drag = { x: event.clientX, y: event.clientY };
  svg.classList.add("dragging");
  svg.setPointerCapture(event.pointerId);
});
svg.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const scale = scaleOf(view);            // pixels to model units
  panBy(view, (event.clientX - drag.x) / scale, (event.clientY - drag.y) / scale);
  drag = { x: event.clientX, y: event.clientY };
  draw();
});
const endDrag = () => { drag = null; svg.classList.remove("dragging"); };
svg.addEventListener("pointerup", endDrag);
svg.addEventListener("pointercancel", endDrag);

document.getElementById("zoom-in").addEventListener("click", () => { zoomBy(view, 2); draw(); });
document.getElementById("zoom-out").addEventListener("click", () => { zoomBy(view, 0.5); draw(); });
document.getElementById("reset").addEventListener("click", () => { reset(view); draw(); });

registerTools({
  state: () => ({ zoom: view.zoom, x: view.cx, y: view.cy, parts: PARTS }),
  zoomBy: (factor) => { zoomBy(view, factor); draw(); },
  pan: (dx, dy) => { panBy(view, dx, dy); draw(); },
  reset: () => { reset(view); draw(); },
});

