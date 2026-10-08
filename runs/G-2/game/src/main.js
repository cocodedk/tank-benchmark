// Wires keys, the fixed-step clock, the picture and the tools together.
import { game, step, DT } from './sim.js';
import { draw } from './view.js';
import { hud } from './hud.js';
import { registerTools } from './tools.js';

const held = new Set();
const GAME_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
addEventListener('keydown', e => { if (GAME_KEYS.includes(e.code)) { held.add(e.code); e.preventDefault(); } });
addEventListener('keyup', e => held.delete(e.code));
addEventListener('blur', () => held.clear());

const on = (...codes) => codes.some(c => held.has(c)) ? 1 : 0;
const keys = () => ({
  fwd: on('KeyW', 'ArrowUp') - on('KeyS', 'ArrowDown'),
  turn: on('KeyD', 'ArrowRight') - on('KeyA', 'ArrowLeft'),
  fire: held.has('Space'),
});

registerTools(keys);

let last = performance.now(), owed = 0;
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  if (!game.paused) for (owed += dt; owed >= DT; owed -= DT) step(keys());
  else owed = 0;
  draw(game, dt);
  hud(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
