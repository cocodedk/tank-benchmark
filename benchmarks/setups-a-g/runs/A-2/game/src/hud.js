const $ = (id) => document.getElementById(id);

export function updateHud(g) {
  for (const name of ['player', 'computer']) $(`hp-${name}`).style.width = `${g.tanks[name].health}%`;
  $('round').textContent = `Round ${g.round}`;
  $('score').textContent = `${g.score.player} : ${g.score.computer}`;
  $('banner').textContent = g.banner;
}
