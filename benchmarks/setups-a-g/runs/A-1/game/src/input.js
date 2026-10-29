// Held keys, read as player controls at every simulation step.
const KEYS = { drive: ['KeyW', 'ArrowUp'], back: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], fire: ['Space'] };
const CODES = new Set(Object.values(KEYS).flat());
const held = new Set();

addEventListener('keydown', e => { if (CODES.has(e.code)) { e.preventDefault(); held.add(e.code); } });
addEventListener('keyup', e => held.delete(e.code));
addEventListener('blur', () => held.clear());

const down = name => KEYS[name].some(c => held.has(c));

export function controls() {
  return { drive: down('drive') - down('back'), turn: down('right') - down('left'), fire: down('fire') };
}
