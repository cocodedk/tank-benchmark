const held = new Set();
const HANDLED = new Set(['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);

export function initInput() {
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (HANDLED.has(key)) {
      event.preventDefault();
      held.add(key);
    }
  });
  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (HANDLED.has(key)) {
      event.preventDefault();
      held.delete(key);
    }
  });
  window.addEventListener('blur', () => held.clear());
}

export function keysHeld() {
  return {
    forward: held.has('w') || held.has('arrowup'),
    backward: held.has('s') || held.has('arrowdown'),
    left: held.has('a') || held.has('arrowleft'),
    right: held.has('d') || held.has('arrowright'),
    fire: held.has(' '),
  };
}
