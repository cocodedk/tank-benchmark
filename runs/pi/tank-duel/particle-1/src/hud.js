export class Hud {
  constructor() {
    this.youBar = document.getElementById('you-health');
    this.computerBar = document.getElementById('computer-health');
    this.score = document.getElementById('score');
    this.round = document.getElementById('round');
    this.banner = document.getElementById('banner');
  }

  update(game) {
    this.youBar.style.width = `${game.tanks.player.health}%`;
    this.computerBar.style.width = `${game.tanks.computer.health}%`;
    this.score.textContent = `${game.score.player} : ${game.score.computer}`;
    this.round.textContent = `Round ${game.round}`;
    if (game.state === 'round_over') {
      this.banner.textContent = game.winner === 'player'
        ? 'You win the round'
        : 'The computer wins the round';
      this.banner.classList.add('show');
    } else {
      this.banner.classList.remove('show');
    }
  }
}
