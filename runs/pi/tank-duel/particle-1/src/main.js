import { DT } from './constants.js';
import { Game } from './game.js';
import { Hud } from './hud.js';
import { initInput, keysHeld } from './input.js';
import { SceneView } from './scene.js';
import { initWebMcp } from './tools.js';

const game = new Game(keysHeld);
initInput();
const view = new SceneView(document.getElementById('app'));
const hud = new Hud();

let last = performance.now();
let accumulator = 0;

function frame(now) {
  const delta = Math.min((now - last) / 1000, 0.25);
  last = now;
  if (game.paused) {
    accumulator = 0;
  } else {
    accumulator += delta;
    let ticks = 0;
    while (accumulator >= DT && ticks < 20) {
      game.step(DT);
      accumulator -= DT;
      ticks += 1;
    }
    if (ticks === 20) accumulator = 0;
  }
  view.sync(game);
  hud.update(game);
  view.render();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => view.resize());
requestAnimationFrame(frame);
initWebMcp(game);

document.getElementById('signature').textContent =
  'Built by particle-1 \u00b7 particle-ai/particle-1 \u00b7 pi on OpenRouter';
