import { STEP } from './constants.js';
import { Game } from './game.js';
import { Hud } from './hud.js';
import { Input } from './input.js';
import { createView } from './render.js';
import { registerTools } from './tools.js';
import { sign } from './signature.js';

const game = new Game();
const input = new Input(window);
const hud = new Hud(document);
const view = createView(document.getElementById('game'), game);
sign(document);

registerTools(game, input, () => hud.update(game));

let previous = performance.now();
let accumulator = 0;

function frame(now) {
  const elapsed = Math.min((now - previous) / 1000, 0.25);
  previous = now;

  if (!game.paused) {
    accumulator += elapsed;
    let ticks = 0;
    while (accumulator >= STEP && ticks < 30) {
      game.tick(input.held, input.consumeFire());
      accumulator -= STEP;
      ticks += 1;
    }
    if (ticks >= 30) accumulator = 0;
  } else {
    accumulator = 0;
  }

  view.update(elapsed);
  hud.update(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
