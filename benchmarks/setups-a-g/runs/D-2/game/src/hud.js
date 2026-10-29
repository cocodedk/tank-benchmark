const $ = id => document.getElementById(id);
const BANNERS = {player: 'You win the round', computer: 'The computer wins the round'};

export function updateHud(g) {
  $('hp-player').style.width = g.tanks.player.health + '%';
  $('hp-computer').style.width = g.tanks.computer.health + '%';
  $('score').textContent = `Score: You ${g.score.player} – ${g.score.computer} Computer`;
  $('round').textContent = `Round ${g.round}`;
  $('banner').hidden = g.state !== 'round_over';
  $('banner').textContent = BANNERS[g.winner] ?? '';
}
