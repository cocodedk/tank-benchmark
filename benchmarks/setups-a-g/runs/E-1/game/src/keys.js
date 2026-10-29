// The keys held right now, read as the player's controls at every step.
const held = new Set();
const GAME_KEYS = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"];

window.addEventListener("keydown", (e) => {
  if (GAME_KEYS.includes(e.code)) e.preventDefault();
  held.add(e.code);
});
window.addEventListener("keyup", (e) => held.delete(e.code));
window.addEventListener("blur", () => held.clear());

const any = (...codes) => (codes.some((c) => held.has(c)) ? 1 : 0);

// move +1 forward / -1 back; turn +1 right (heading up) / -1 left; fire while Space is held.
export function controls() {
  return {
    move: any("KeyW", "ArrowUp") - any("KeyS", "ArrowDown"),
    turn: any("KeyD", "ArrowRight") - any("KeyA", "ArrowLeft"),
    fire: held.has("Space"),
  };
}
