import { START_HEALTH } from './config.js';

const BANNERS = { player: 'You win the round', computer: 'The computer wins the round' };

const el = (parent, tag, className, text = '') => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  parent.appendChild(node);
  return node;
};

export function createHud(g) {
  const root = el(document.body, 'div', 'hud');
  const bar = (label) => {
    const row = el(root, 'div', 'row');
    el(row, 'span', 'label', label);
    return el(el(row, 'span', 'bar'), 'span', 'fill');
  };
  const fills = { player: bar('You'), computer: bar('Computer') };
  const info = el(root, 'div', 'info');
  el(root, 'div', 'controls', 'W/S or ↑/↓ drive · A/D or ←/→ turn · Space fire');
  const banner = el(document.body, 'div', 'banner');

  return function update() {
    for (const name of ['player', 'computer']) fills[name].style.width = `${(100 * g.tanks[name].health) / START_HEALTH}%`;
    info.textContent = `Score ${g.score.player} : ${g.score.computer} · Round ${g.round}`;
    banner.textContent = g.state === 'round_over' ? BANNERS[g.winner] : '';
  };
}
