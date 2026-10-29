// Held keys, as a Set of KeyboardEvent.code values.
const WATCHED = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
export const keys = new Set();

window.addEventListener('keydown', (e) => { if (WATCHED.has(e.code)) { keys.add(e.code); e.preventDefault(); } });
window.addEventListener('keyup', (e) => { if (WATCHED.has(e.code)) { keys.delete(e.code); e.preventDefault(); } });
window.addEventListener('blur', () => keys.clear());
