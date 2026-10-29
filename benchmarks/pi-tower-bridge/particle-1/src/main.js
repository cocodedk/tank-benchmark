/* Wire the camera to the canvas, the pointer and the controls. */

import { Camera } from "./camera.js";
import { drawScene } from "./scene.js";
import { registerTools } from "./tools.js";

const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");
const camera = new Camera();

let width = 1;
let height = 1;
let dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  draw();
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawScene(ctx, camera, width, height);
}

const app = {
  camera,
  draw,
  viewport: () => ({ w: width, h: height }),
};

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;
  const factor = Math.exp(-event.deltaY * 0.0015);
  camera.zoomTowards(camera.zoom * factor, px, py, width, height);
  draw();
}, { passive: false });

let drag = null;

canvas.addEventListener("pointerdown", (event) => {
  drag = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add("dragging");
});

canvas.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const s = camera.scale(width, height);
  camera.pan(-(event.clientX - drag.x) / s, -(event.clientY - drag.y) / s);
  drag = { x: event.clientX, y: event.clientY };
  draw();
});

function endDrag(event) {
  if (!drag) return;
  drag = null;
  canvas.classList.remove("dragging");
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
}

canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

document.getElementById("zoom-in").addEventListener("click", () => {
  camera.zoomAtCentre(1.6, width, height);
  draw();
});

document.getElementById("zoom-out").addEventListener("click", () => {
  camera.zoomAtCentre(1 / 1.6, width, height);
  draw();
});

document.getElementById("reset").addEventListener("click", () => {
  camera.reset();
  draw();
});

window.addEventListener("resize", resize);

registerTools(app);
resize();
