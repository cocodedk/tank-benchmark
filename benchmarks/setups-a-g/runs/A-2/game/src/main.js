import { DT } from './config.js';
import { createGame } from './game.js';
import { step } from './sim.js';
import { createView } from './view.js';
import { updateHud } from './hud.js';
import { registerTools } from './tools.js';

const g = createGame();
const draw = createView(document.getElementById('view'));
const advance = (seconds) => {
  for (let i = Math.max(1, Math.round(seconds / DT)); i > 0; i--) step(g);
};
registerTools(g, advance);

addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === ' ' && !e.repeat) g.firePending = true;
  g.keys.add(key);
  if (key === ' ' || key.startsWith('arrow')) e.preventDefault();
});
addEventListener('keyup', (e) => g.keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => g.keys.clear());

let last = performance.now();
let owed = 0;
requestAnimationFrame(function frame(now) {
  owed += Math.min(now - last, 100) / 1000;
  last = now;
  for (; owed >= DT; owed -= DT) if (!g.paused) step(g);
  if (g.paused) owed = 0;
  updateHud(g);
  draw(g);
  requestAnimationFrame(frame);
});
