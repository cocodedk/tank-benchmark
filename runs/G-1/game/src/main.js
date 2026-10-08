// Wires keys, the fixed-step loop, the tools and the view together.
import { DT, newGame, step } from './sim.js';
import { registerTools } from './tools.js';
import { createView } from './view.js';

const game = newGame();
const held = new Set();
const KEYS = { forward: ['KeyW', 'ArrowUp'], back: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'], fire: ['Space'] };
const controls = () => Object.fromEntries(Object.entries(KEYS).map(([k, codes]) => [k, codes.some(c => held.has(c))]));

addEventListener('keydown', e => {
  held.add(e.code);
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
addEventListener('keyup', e => held.delete(e.code));
addEventListener('blur', () => held.clear());

registerTools(game, controls);
const render = createView(document.getElementById('game'));
let last = performance.now(), acc = 0;
requestAnimationFrame(function frame(now) {
  acc = game.paused ? 0 : Math.min(acc + (now - last) / 1000, 0.25);
  last = now;
  while (acc >= DT) {
    step(game, controls());
    acc -= DT;
  }
  render(game);
  requestAnimationFrame(frame);
});
