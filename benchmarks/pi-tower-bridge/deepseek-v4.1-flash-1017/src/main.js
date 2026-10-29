import { createCamera } from "./camera.js";
import { drawScene } from "./draw.js";
import { registerTools } from "./tools.js";

const canvas = document.getElementById("scene");
const context = canvas.getContext("2d");
const readout = document.getElementById("readout");
const signature = document.getElementById("signature");
signature.dataset.model = "deepseek/deepseek-v4.1-flash-1017";
signature.title = "DeepSeek V4.1 Flash via the pi agent on OpenRouter";
const camera = createCamera();
let pixelRatio = 1;

function render() {
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, camera.width, camera.height);
  context.save();
  camera.apply(context);
  drawScene(context, camera);
  context.restore();

  const zoom = camera.zoom;
  readout.textContent = `${zoom < 10 ? zoom.toFixed(1) : zoom.toFixed(0)}×`;
}

function resize() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.max(1, Math.round(width * pixelRatio));
  canvas.height = Math.max(1, Math.round(height * pixelRatio));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  camera.resize(width, height);
  render();
}

function zoomByButton(factor) {
  camera.zoomAt(factor);
  render();
}

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1);
    camera.zoomAt(Math.exp(-delta * 0.0015), event.clientX, event.clientY);
    render();
  },
  { passive: false },
);

let drag = null;
canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add("dragging");
});

canvas.addEventListener("pointermove", (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  const scale = camera.scale();
  camera.pan(-(event.clientX - drag.x) / scale, -(event.clientY - drag.y) / scale);
  drag.x = event.clientX;
  drag.y = event.clientY;
  render();
});

function endDrag(event) {
  if (!drag || drag.id !== event.pointerId) return;
  drag = null;
  canvas.classList.remove("dragging");
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

document.getElementById("zoom-in").addEventListener("click", () => zoomByButton(1.5));
document.getElementById("zoom-out").addEventListener("click", () => zoomByButton(1 / 1.5));
document.getElementById("reset").addEventListener("click", () => {
  camera.reset();
  render();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "+" || event.key === "=") zoomByButton(1.5);
  else if (event.key === "-" || event.key === "_") zoomByButton(1 / 1.5);
  else if (event.key === "0") {
    camera.reset();
    render();
  }
});

window.addEventListener("resize", resize);
resize();
registerTools(camera, render);
