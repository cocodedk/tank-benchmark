import { DT } from './collide.js';
import { create, step } from './sim.js';
import { keys } from './input.js';
import { createView } from './view.js';
import { createHud } from './hud.js';
import { registerTools } from './tools.js';

const sim = create();
const render = createView();
const updateHud = createHud();
registerTools(sim);

let last = performance.now(), acc = 0, drawn = '';
function frame(now) {
  acc += Math.min((now - last) / 1000, 0.25);
  last = now;
  if (sim.paused) acc = 0;
  while (acc >= DT) { step(sim, keys); acc -= DT; }
  // Redraw only when something moved: a paused game costs nothing per frame.
  const seen = JSON.stringify([sim.time, sim.tanks, innerWidth, innerHeight]);
  if (seen !== drawn) { render(sim); drawn = seen; }
  updateHud(sim);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
