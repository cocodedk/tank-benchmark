// Held keys, normalised to KeyW/KeyS/KeyA/KeyD/Space.
const ALIAS = { ArrowUp: 'KeyW', ArrowDown: 'KeyS', ArrowLeft: 'KeyA', ArrowRight: 'KeyD' };
const USED = new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space']);

export const keys = new Set();
const held = new Set(); // physical keys; `keys` is derived so W and ArrowUp release independently

function handler(down) {
  return (e) => {
    if (!USED.has(ALIAS[e.code] || e.code)) return;
    e.preventDefault();
    if (down) held.add(e.code); else held.delete(e.code);
    sync();
  };
}

function sync() {
  keys.clear();
  for (const code of held) keys.add(ALIAS[code] || code);
}

window.addEventListener('keydown', handler(true));
window.addEventListener('keyup', handler(false));
window.addEventListener('blur', () => { held.clear(); sync(); });
