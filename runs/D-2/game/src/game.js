import {BANNER_STEPS, HALF, NAMES, OTHER, START, WALLS} from './config.js';

/** Puts both tanks on their start squares with full health and no shells. */
export function startRound(g) {
  for (const name of NAMES) Object.assign(g.tanks[name], START[name], {health: 100, lastShot: -Infinity});
  g.shells = [];
  g.explosions = [];
  g.state = 'playing';
}

/** Round 1, score 0 to 0; pause and AI stay as they are. */
export function resetGame(g) {
  g.score = {player: 0, computer: 0};
  g.round = 1;
  for (const name of NAMES) g.tanks[name].shots = 0;
  startRound(g);
}

export function newGame() {
  const g = {tanks: {player: {}, computer: {}}, tick: 0, paused: false, ai: true, winner: null, bannerLeft: 0};
  resetGame(g);
  return g;
}

export function endRound(g, loser) {
  g.winner = OTHER[loser];
  g.score[g.winner]++;
  g.state = 'round_over';
  g.bannerLeft = BANNER_STEPS;
}

const r4 = v => Math.round(v * 1e4) / 1e4;

export function snapshot(g) {
  const tanks = {};
  for (const name of NAMES) {
    const t = g.tanks[name];
    tanks[name] = {x: r4(t.x), z: r4(t.z), heading: r4(t.heading) % 360, health: t.health, shots: t.shots};
  }
  return {
    ok: true,
    arena: {width: 2 * HALF.x, depth: 2 * HALF.z},
    walls: WALLS.map(w => ({...w})),
    tanks,
    shells: g.shells.map(s => ({x: r4(s.x), z: r4(s.z), owner: s.owner, bounces: s.bounces})),
    score: {...g.score},
    round: g.round,
    state: g.state,
    paused: g.paused,
    ai: g.ai,
  };
}
