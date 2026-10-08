// The head-up display: health bars, score, round, controls and the round-over banner.
const $ = id => document.getElementById(id);

export function hud(game) {
  const { player, computer } = game.tanks;
  $('bar-player').style.width = player.health + '%';
  $('bar-computer').style.width = computer.health + '%';
  $('score').textContent = `Score ${game.score.player} : ${game.score.computer}`;
  $('round').textContent = `Round ${game.round}`;
  const banner = $('banner');
  banner.hidden = game.state !== 'round_over';
  banner.textContent = game.winner === 'player' ? 'You win the round' : 'The computer wins the round';
}
