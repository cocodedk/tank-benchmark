// Keys, the fixed-step loop, and wiring.
import { DT, createSim, step } from './sim.js';
import { createView } from './view.js';
import { updateHud } from './hud.js';
import { registerTools } from './tools.js';

const sim = createSim(), ctl = { paused: false }, keys = new Set();
const render = createView(document.getElementById('game'));
const stepOnce = () => step(sim, keys);

const GAME_KEYS = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ']);
window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if (GAME_KEYS.has(k)) e.preventDefault(); keys.add(k); });
window.addEventListener('keyup', (e) => { const k = e.key.toLowerCase(); if (GAME_KEYS.has(k)) e.preventDefault(); keys.delete(k); });
window.addEventListener('blur', () => keys.clear());

registerTools({ sim, ctl, stepOnce });

let last = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (ctl.paused) acc = 0;
  else for (acc += dt; acc >= DT; acc -= DT) stepOnce();
  if (!ctl.paused || ctl.dirty) { ctl.dirty = false; render(sim, dt); updateHud(sim); } // paused: draw only after a change
  requestAnimationFrame(frame);
}
window.addEventListener('resize', () => { ctl.dirty = true; });
requestAnimationFrame(frame);
