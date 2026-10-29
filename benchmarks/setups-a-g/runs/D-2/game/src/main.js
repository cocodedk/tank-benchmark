import {DT} from './config.js';
import {newGame} from './game.js';
import {updateHud} from './hud.js';
import {listenKeys} from './input.js';
import {createView} from './render.js';
import {stepGame} from './sim.js';
import {registerTools} from './tools.js';

const g = newGame();
const input = listenKeys();
const draw = createView(document.body);
registerTools(g, input);

let last = performance.now();
let owed = 0;
function frame(now) {
  requestAnimationFrame(frame);
  owed = g.paused ? 0 : Math.min(owed + (now - last) / 1000, 0.25);
  last = now;
  while (owed >= DT) {
    stepGame(g, input);
    owed -= DT;
  }
  updateHud(g);
  draw(g);
}
requestAnimationFrame(frame);
