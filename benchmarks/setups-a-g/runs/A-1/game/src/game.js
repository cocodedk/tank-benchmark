// The game state and its fixed 1/60 s step.
import { HALF_X, HALF_Z, WALLS, TANK_R, clear } from './arena.js';
import { think } from './ai.js';
import { moveShells } from './shells.js';
import { DT, START, NAMES, drive, fire, norm } from './tank.js';

const BANNER_TICKS = 120, EXPLOSION_TICKS = 20;
const WINS = { player: 'You win the round', computer: 'The computer wins the round' };

function startRound(game) {
  for (const name of NAMES) Object.assign(game.tanks[name], START[name], { health: 100, lastShot: -Infinity });
  game.shells = [];
  game.state = 'playing';
  game.banner = '';
}

export function createGame() {
  const game = {
    tick: 0, round: 1, state: 'playing', overAt: 0, banner: '', paused: false, ai: true, dirty: true,
    tanks: { player: { shots: 0 }, computer: { shots: 0 } },
    score: { player: 0, computer: 0 }, shells: [], explosions: [],
  };
  startRound(game);
  return game;
}

// A new game; pause and AI stay as they are.
export function reset(game) {
  Object.assign(game, createGame(), { paused: game.paused, ai: game.ai });
}

// One step of 1/60 s, with the player's controls { drive, turn, fire } as held now.
export function step(game, controls) {
  game.tick++;
  for (const e of game.explosions) e.age++;
  game.explosions = game.explosions.filter(e => e.age < EXPLOSION_TICKS);
  if (game.state === 'round_over') {
    if (game.tick - game.overAt >= BANNER_TICKS) { game.round++; startRound(game); }
    return;
  }
  const { player, computer } = game.tanks;
  drive(player, computer, controls);
  if (controls.fire) fire(game, 'player');
  if (game.ai) {
    const c = think(game);
    drive(computer, player, c);
    if (c.fire) fire(game, 'computer');
  }
  moveShells(game);
  const loser = NAMES.find(name => game.tanks[name].health <= 0);
  if (loser) {
    const winner = NAMES.find(name => name !== loser);
    game.score[winner]++;
    game.state = 'round_over';
    game.overAt = game.tick;
    game.banner = WINS[winner];
  }
}

// Run the steps for `seconds`, reading the held keys (the `controls` function) at each one.
export function advance(game, controls, seconds) {
  for (let n = Math.max(1, Math.round(seconds / DT)); n > 0; n--) step(game, controls());
}

// Can the named tank stand at (x, z)? It must clear the walls, the arena edge and the other tank.
export function fits(game, name, x, z) {
  const other = game.tanks[NAMES.find(n => n !== name)];
  return clear(x, z) && Math.hypot(x - other.x, z - other.z) >= 2 * TANK_R - 1e-9;
}

export function place(game, name, x, z, heading) {
  Object.assign(game.tanks[name], { x, z, heading: norm(heading) });
}

export function describe(game) {
  const t = n => { const { x, z, heading, health, shots } = game.tanks[n]; return { x, z, heading, health, shots }; };
  return {
    ok: true,
    arena: { width: 2 * HALF_X, depth: 2 * HALF_Z },
    walls: WALLS,
    tanks: { player: t('player'), computer: t('computer') },
    shells: game.shells.map(({ x, z, owner, bounces }) => ({ x, z, owner, bounces })),
    score: { ...game.score },
    round: game.round, state: game.state, paused: game.paused, ai: game.ai,
  };
}
