const KEYS = {
  w: 'fwd', arrowup: 'fwd', s: 'back', arrowdown: 'back',
  a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', ' ': 'fire',
};

/** Held keys as booleans (fwd, back, left, right); `fire` is set by a Space press and cleared by the next step or by releasing Space. */
export function listenKeys() {
  const input = {fwd: false, back: false, left: false, right: false, fire: false};
  const held = new Set();
  const sync = () => {
    for (const action of ['fwd', 'back', 'left', 'right']) input[action] = [...held].some(k => KEYS[k] === action);
  };
  window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (!KEYS[key]) return;
    e.preventDefault();
    if (KEYS[key] === 'fire') input.fire ||= !e.repeat;
    else held.add(key);
    sync();
  });
  window.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    if (KEYS[key] === 'fire') input.fire = false;
    held.delete(key);
    sync();
  });
  window.addEventListener('blur', () => {
    held.clear();
    sync();
  });
  return input;
}
