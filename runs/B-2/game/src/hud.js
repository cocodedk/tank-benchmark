const row = (id, label, color) =>
  `<span class="row">${label}<span class="bar"><div class="fill" id="${id}" style="background:${color}"></div></span></span>`;

export function createHud() {
  const hud = document.getElementById('hud');
  const banner = document.getElementById('banner');
  hud.innerHTML = row('hp-player', 'You', '#4a8cff') + '<span id="score"></span>' + row('hp-computer', 'Computer', '#e04040')
    + '<div class="controls">W/↑ forward · S/↓ back · A/← D/→ turn · Space fire</div>';
  const $ = (id) => document.getElementById(id);
  return (g) => {
    $('hp-player').style.width = `${g.tanks.player.health}%`;
    $('hp-computer').style.width = `${g.tanks.computer.health}%`;
    $('score').textContent = `Round ${g.round} · Score ${g.score.player} : ${g.score.computer}`;
    const over = g.state === 'round_over';
    banner.style.display = over ? 'block' : 'none';
    if (over) banner.textContent = g.winner === 'player' ? 'You win the round' : 'The computer wins the round';
  };
}
