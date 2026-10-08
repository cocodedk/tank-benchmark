const el = (parent, cls, text = "") => {
  const e = document.createElement("div");
  e.className = cls;
  e.textContent = text;
  parent.appendChild(e);
  return e;
};

function bar(parent, label, color) {
  const b = el(parent, "bar");
  const name = el(b, "name", label);
  const back = el(b, "back");
  const fill = el(back, "fill");
  fill.style.background = color;
  return { name, fill, label };
}

export function createHud() {
  const root = document.createElement("div");
  root.id = "hud";
  document.body.appendChild(root);
  const bars = el(root, "bars");
  const you = bar(bars, "You", "#3f86ff");
  const mid = el(bars, "mid");
  const cpu = bar(bars, "Computer", "#ff4040");
  const banner = el(root, "banner");
  el(root, "help", "W/S or Up/Down drive, A/D or Left/Right turn, Space fires");
  return function update(g) {
    you.fill.style.width = `${Math.max(0, g.tanks.player.health)}%`;
    cpu.fill.style.width = `${Math.max(0, g.tanks.computer.health)}%`;
    you.name.textContent = `${you.label} ${Math.max(0, g.tanks.player.health)}`;
    cpu.name.textContent = `${cpu.label} ${Math.max(0, g.tanks.computer.health)}`;
    mid.textContent = `Round ${g.round}  |  ${g.score.player} - ${g.score.computer}`;
    banner.textContent = g.banner;
  };
}
