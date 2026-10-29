export class Hud {
  constructor(doc = document) {
    this.youHealth = doc.querySelector('#player-health');
    this.computerHealth = doc.querySelector('#computer-health');
    this.score = doc.querySelector('#score');
    this.round = doc.querySelector('#round');
    this.banner = doc.querySelector('#banner');
    this.status = doc.querySelector('#status');
  }

  update(game) {
    this.youHealth.style.width = `${game.tanks.player.health}%`;
    this.computerHealth.style.width = `${game.tanks.computer.health}%`;
    this.score.textContent = `${game.score.player} : ${game.score.computer}`;
    this.round.textContent = `Round ${game.round}`;

    const over = game.state === 'round_over';
    this.banner.textContent = over ? game.banner : '';
    this.banner.classList.toggle('show', over);

    this.status.textContent = game.paused
      ? `Paused · AI ${game.aiEnabled ? 'on' : 'off'}`
      : `AI ${game.aiEnabled ? 'on' : 'off'}`;
  }
}
