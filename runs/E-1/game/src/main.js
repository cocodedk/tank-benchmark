// Starts the game: real time drives the fixed steps while not paused; the HUD and picture follow the state.
import { game, step, DT } from "./game.js";
import { controls } from "./keys.js";
import { draw } from "./view.js";
import { registerTools } from "./tools.js";

const $ = (id) => document.getElementById(id);

function hud() {
  for (const name of ["player", "computer"]) $(`${name}-bar`).style.width = `${game.tanks[name].health}%`;
  $("score").textContent = `${game.score.player} : ${game.score.computer}`;
  $("round").textContent = `Round ${game.round}`;
  $("banner").textContent = game.banner;
  $("banner").hidden = game.state !== "round_over";
}

let last = performance.now(), owed = 0, shown = "";
function frame(now) {
  owed = game.paused ? 0 : Math.min(owed + (now - last) / 1000, 0.25);
  last = now;
  for (; owed >= DT; owed -= DT) step(controls());
  // Draw only when something visible changed: a paused game costs nothing.
  const seen = JSON.stringify([game.tick, game.tanks, game.state, innerWidth, innerHeight]);
  if (seen !== shown) {
    shown = seen;
    hud();
    draw();
  }
  requestAnimationFrame(frame);
}

registerTools();
requestAnimationFrame(frame);
