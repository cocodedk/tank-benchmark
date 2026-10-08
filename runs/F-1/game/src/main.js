import { s, stepOnce } from './sim.js';
import { DT } from './world.js';
import { render } from './render.js';
import { registerTools } from './tools.js';

const keys = new Set();
const blockDefault = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ']);
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (blockDefault.has(k)) e.preventDefault();
  keys.add(k);
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

registerTools(keys);

let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(now - last, 100) / 1000;
  last = now;
  if (s.paused) acc = 0;
  else for (; acc >= DT; acc -= DT) stepOnce(keys);
  render(s);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
