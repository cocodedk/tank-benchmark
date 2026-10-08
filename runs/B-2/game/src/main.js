import { createGame, snapshot, step, DT } from './game.js';
import { createView } from './view.js';
import { createHud } from './hud.js';
import { registerTools } from './tools.js';

const KEYS = {
  forward: ['KeyW', 'ArrowUp'], back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], fire: ['Space'],
};
const held = new Set();
const input = () => Object.fromEntries(Object.entries(KEYS).map(([k, codes]) => [k, codes.some((c) => held.has(c))]));
const known = new Set(Object.values(KEYS).flat());

window.addEventListener('keydown', (e) => { if (known.has(e.code)) { held.add(e.code); e.preventDefault(); } });
window.addEventListener('keyup', (e) => { if (known.has(e.code)) { held.delete(e.code); e.preventDefault(); } });
window.addEventListener('blur', () => held.clear());

const g = createGame();
const render = createView(document.getElementById('view'));
const updateHud = createHud();
registerTools(g, input);

let last = performance.now(), acc = 0, shown = '';
function frame(now) {
  if (g.paused) acc = 0;
  else {
    acc = Math.min(acc + (now - last) / 1000, 0.25);
    for (; acc >= DT; acc -= DT) step(g, input());
  }
  last = now;
  // while paused, draw only when something changed: rendering is the slow part
  const key = JSON.stringify(snapshot(g)) + g.tick + innerWidth + 'x' + innerHeight;
  if (key !== shown) {
    shown = key;
    render(g);
    updateHud(g);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
