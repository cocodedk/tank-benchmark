// Wires the game to the page: real-time steps while not paused, then draw.
import { createGame, step } from './game.js';
import { createHud } from './hud.js';
import { controls } from './input.js';
import { registerTools } from './tools.js';
import { DT } from './tank.js';
import { createView } from './view.js';

const game = createGame();
const render = createView();
const updateHud = createHud();
registerTools(game, controls);

let last = performance.now(), owed = 0;
function frame(now) {
  owed += Math.min((now - last) / 1000, 0.25);
  last = now;
  if (game.paused) owed = 0;
  for (; owed >= DT; owed -= DT) step(game, controls());
  if (!game.paused || game.dirty) { // a paused game redraws only after a tool changed it
    render(game);
    updateHud(game);
    game.dirty = false;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
