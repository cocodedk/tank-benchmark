import { DT } from './config.js';
import { createGame, step } from './game.js';
import { createHud } from './hud.js';
import { registerTools } from './tools.js';
import { createView } from './view.js';

const KEYS = {
  w: 'forward', ArrowUp: 'forward', s: 'back', ArrowDown: 'back',
  a: 'left', ArrowLeft: 'left', d: 'right', ArrowRight: 'right', ' ': 'fire',
};

const g = createGame();
const render = createView(g);
const updateHud = createHud(g);
registerTools(g);

// An action is held while any key mapped to it is held.
const held = new Set();
const sync = () => {
  for (const action of Object.keys(g.keys)) g.keys[action] = [...held].some((k) => KEYS[k] === action);
};
const hold = (down) => (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (!KEYS[key]) return;
  held[down ? 'add' : 'delete'](key);
  sync();
  e.preventDefault();
};
addEventListener('keydown', hold(true));
addEventListener('keyup', hold(false));
addEventListener('resize', () => { g.dirty = true; });
addEventListener('blur', () => { held.clear(); sync(); });

let last = performance.now(), acc = 0;
(function frame(now) {
  acc += Math.min(0.25, (now - last) / 1000);
  last = now;
  for (; acc >= DT; acc -= DT) if (!g.paused) step(g);
  if (g.paused) acc = 0;
  if (!g.paused || g.dirty) render(); // while paused, redraw only after a tool changed something
  g.dirty = false;
  updateHud();
  requestAnimationFrame(frame);
})(last);
