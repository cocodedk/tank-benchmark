// DOM head-up display and round banner.
const hud = document.getElementById('hud'), banner = document.getElementById('banner');
const bars = {};
hud.innerHTML = `<div class="row"><span class="name">You</span><div class="bar"><div id="hp-player" style="background:#3b82f6"></div></div></div>
<div class="row"><span class="name">Computer</span><div class="bar"><div id="hp-computer" style="background:#ef4444"></div></div></div>
<div id="score"></div><div id="round"></div>
<div>W/↑ forward · S/↓ back · A/← D/→ turn · Space fire</div>`;
for (const n of ['player', 'computer']) bars[n] = document.getElementById('hp-' + n);

export function updateHud(s) {
  for (const n of ['player', 'computer']) bars[n].style.width = s.tanks[n].health + '%';
  document.getElementById('score').textContent = `Score: You ${s.score.player} - Computer ${s.score.computer}`;
  document.getElementById('round').textContent = `Round ${s.round}`;
  banner.style.display = s.state === 'round_over' ? 'block' : 'none';
  banner.textContent = s.winner === 'player' ? 'You win the round' : 'The computer wins the round';
}
