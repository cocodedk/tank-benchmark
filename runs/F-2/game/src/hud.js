// DOM overlay: health bars, score, round, controls line, round banner.
const bar = (id, label, cls, color) => `<div class="bar ${cls}"><div>${label}</div>
  <div class="track"><div class="fill" id="${id}" style="background:${color}"></div></div></div>`;

export function createHud() {
  const hud = document.createElement('div');
  hud.id = 'hud';
  hud.innerHTML = `<div id="bars">${bar('hp-player', 'You', '', '#3b82f6')}
    <div id="mid"><div id="round"></div><div id="score"></div></div>
    ${bar('hp-computer', 'Computer', 'r', '#ef4444')}</div>
    <div id="controls">W/↑ forward · S/↓ back · A/← D/→ turn · Space fire</div><div id="banner"></div>`;
  document.body.append(hud);
  const $ = (id) => hud.querySelector('#' + id);
  return (s) => {
    $('hp-player').style.width = s.tanks.player.health + '%';
    $('hp-computer').style.width = s.tanks.computer.health + '%';
    $('score').textContent = `${s.score.player} : ${s.score.computer}`;
    $('round').textContent = `Round ${s.round}`;
    $('banner').style.display = s.state === 'round_over' ? 'block' : 'none';
    $('banner').textContent = s.banner;
  };
}
