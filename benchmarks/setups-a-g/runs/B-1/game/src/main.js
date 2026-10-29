import { createSim, step, snapshot, DT } from './sim.js';
import { keys } from './input.js';
import { createView } from './view.js';
import { registerTools } from './tools.js';

const sim = createSim();
const render = createView(document.getElementById('game'));
registerTools(sim, keys);

const $ = (id) => document.getElementById(id);
const hud = { you: $('you-bar'), cpu: $('computer-bar'), score: $('score'), round: $('round'), banner: $('banner') };

function updateHud() {
  const s = snapshot(sim);
  hud.you.style.width = `${s.tanks.player.health}%`;
  hud.cpu.style.width = `${s.tanks.computer.health}%`;
  hud.score.textContent = `${s.score.player} : ${s.score.computer}`;
  hud.round.textContent = `Round ${s.round}`;
  const over = s.state === 'round_over';
  hud.banner.hidden = !over;
  hud.banner.textContent = over ? (sim.winner === 'player' ? 'You win the round' : 'The computer wins the round') : '';
}

window.addEventListener('resize', () => { sim.dirty = true; });

let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  acc = Math.min(acc + (now - last) / 1000, 0.25);
  last = now;
  if (sim.paused) acc = 0;
  else while (acc >= DT) { step(sim, keys); acc -= DT; }
  if (sim.paused && !sim.dirty) return; // nothing changed: skip the costly render
  sim.dirty = false;
  updateHud();
  render(sim);
}
requestAnimationFrame(frame);
