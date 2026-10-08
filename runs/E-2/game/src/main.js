// Wires keys, the real-time loop, the head-up display and the tools.
import { game, keys, step, DT } from './game.js';
import { render } from './render.js';
import { registerTools } from './tools.js';

const GAME_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
addEventListener('keydown', e => { if (GAME_KEYS.includes(e.code)) { keys.add(e.code); e.preventDefault(); } });
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

const $ = id => document.getElementById(id);
function hud() {
  $('hp-player').style.width = `${game.tanks.player.health}%`;
  $('hp-computer').style.width = `${game.tanks.computer.health}%`;
  $('score').textContent = `Score ${game.score.player} : ${game.score.computer}`;
  $('round').textContent = `Round ${game.round}`;
  $('banner').textContent = game.state !== 'round_over' ? ''
    : game.winner === 'player' ? 'You win the round' : 'The computer wins the round';
}

let last = performance.now(), owed = 0;
function frame(now) {
  owed = game.paused ? 0 : Math.min(owed + (now - last) / 1000, 0.25);
  last = now;
  for (; owed >= DT; owed -= DT) step();
  hud();
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
registerTools();
