import { DT } from "./arena.js";
import { newGame, step } from "./game.js";
import { createScene } from "./scene.js";
import { createHud } from "./hud.js";
import { registerTools } from "./tools.js";

const keys = new Set();
const held = (...codes) => codes.some((c) => keys.has(c));
const readInput = () => ({
  fwd: held("KeyW", "ArrowUp"),
  back: held("KeyS", "ArrowDown"),
  turn: (held("KeyD", "ArrowRight") ? 1 : 0) - (held("KeyA", "ArrowLeft") ? 1 : 0),
  fire: held("Space"),
});

window.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => keys.clear());

const game = newGame();
const render = createScene();
const updateHud = createHud();
registerTools(game, readInput);

let last = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.25);
  last = now;
  if (!game.paused) {
    acc += dt;
    while (acc >= DT) { step(game, readInput()); acc -= DT; }
  }
  render(game, dt);
  updateHud(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
