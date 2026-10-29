/* Boot: size the canvas, wire the camera, register the WebMCP tools. */

import { installInput } from "./input.js";
import { registerTools } from "./mcp.js";
import { drawScene } from "./scene.js";
import { makeView } from "./view.js";

const canvas = document.getElementById("art");
const context = canvas.getContext("2d");
const view = makeView();
let dpr = 1;

function redraw() {
  drawScene(context, view, window.innerWidth, window.innerHeight, dpr);
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
  canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
  redraw();
}

window.addEventListener("resize", resize);
installInput(canvas, view, redraw);
resize();
registerTools(view, redraw);
