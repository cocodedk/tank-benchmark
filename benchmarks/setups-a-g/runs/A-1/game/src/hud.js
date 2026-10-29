// The head-up display: health bars, score, round, controls line and the round banner.
const CSS = `
#hud { position: fixed; inset: 0; pointer-events: none; font: 16px system-ui, sans-serif; color: #fff; text-shadow: 0 1px 3px #000; }
#hud .bar { position: absolute; top: 12px; width: 220px; }
#hud .bar i { display: block; height: 14px; background: #0006; border: 1px solid #fff8; }
#hud .bar b { display: block; height: 100%; }
#hud-info { position: absolute; top: 12px; left: 0; right: 0; text-align: center; }
#hud-keys { position: absolute; bottom: 10px; left: 0; right: 0; text-align: center; font-size: 14px; }
#hud-banner { position: absolute; top: 40%; left: 0; right: 0; text-align: center; font-size: 40px; font-weight: bold; display: none; }
body { margin: 0; overflow: hidden; }
canvas { display: block; }`;

export function createHud() {
  document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
  const bar = (side, label, color) => `<div class="bar" style="${side}: 12px"><span>${label}</span><i><b id="hud-${label}" style="background: ${color}"></b></i></div>`;
  document.body.insertAdjacentHTML('beforeend', `<div id="hud">${bar('left', 'You', '#4a8cff')}${bar('right', 'Computer', '#ff5555')}
    <div id="hud-info"></div><div id="hud-banner"></div>
    <div id="hud-keys">W/↑ forward · S/↓ back · A/← D/→ turn · Space fire</div></div>`);
  const $ = id => document.getElementById(id);
  return function update(game) {
    $('hud-You').style.width = `${game.tanks.player.health}%`;
    $('hud-Computer').style.width = `${game.tanks.computer.health}%`;
    $('hud-info').textContent = `Score ${game.score.player} : ${game.score.computer} · Round ${game.round}`;
    $('hud-banner').textContent = game.banner;
    $('hud-banner').style.display = game.state === 'round_over' ? 'block' : 'none';
  };
}
