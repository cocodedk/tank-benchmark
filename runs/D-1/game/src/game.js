import { aiStep } from './ai.js';
import { ARENA, BANNER_STEPS, EXPLOSION_TIME, DT, WALLS } from './config.js';
import { updateShells } from './shells.js';
import { fire, moveTank, newTank, other } from './tank.js';

export function createGame() {
  const g = {
    paused: false, ai: true,
    keys: { forward: false, back: false, left: false, right: false, fire: false }, wasFiring: false,
  };
  resetGame(g);
  return g;
}

function startRound(g) {
  const shots = (name) => g.tanks?.[name].shots; // shots count the whole game, not the round
  g.tanks = { player: newTank('player', shots('player')), computer: newTank('computer', shots('computer')) };
  Object.assign(g, { shells: [], explosions: [], state: 'playing', aiState: null, round: (g.round ?? 0) + 1 });
}

/** A new game: round 1, score 0 to 0. Pause and AI stay as they are. */
export function resetGame(g) {
  g.round = 0;
  g.score = { player: 0, computer: 0 };
  g.winner = null;
  g.owed = 0;
  g.tanks = null;
  startRound(g);
}

/** Advance the game by one fixed 1/60 s step, reading the held keys now. */
export function step(g) {
  g.explosions = g.explosions.filter((e) => (e.age += DT) < EXPLOSION_TIME);
  if (g.state === 'round_over') {
    if (--g.bannerSteps <= 0) startRound(g);
    return;
  }
  const { keys } = g;
  for (const t of Object.values(g.tanks)) t.cooldown = Math.max(0, t.cooldown - 1);
  moveTank(g, 'player', keys.forward - keys.back, keys.right - keys.left);
  if (keys.fire && !g.wasFiring) fire(g, 'player');
  g.wasFiring = keys.fire;
  if (g.ai) aiStep(g);
  updateShells(g);
  const dead = Object.keys(g.tanks).find((name) => g.tanks[name].health <= 0);
  if (dead) {
    g.winner = other(dead);
    g.score[g.winner]++;
    g.state = 'round_over';
    g.bannerSteps = BANNER_STEPS;
  }
}

/** The state the tools answer with. */
export function snapshot(g) {
  const tank = ({ x, z, heading, health, shots }) => ({ x, z, heading, health, shots });
  return {
    ok: true,
    arena: { width: ARENA.width, depth: ARENA.depth },
    walls: WALLS.map((w) => ({ ...w })),
    tanks: { player: tank(g.tanks.player), computer: tank(g.tanks.computer) },
    shells: g.shells.map((s) => ({ x: s.x, z: s.z, owner: s.owner, bounces: s.bounces })),
    score: { ...g.score },
    round: g.round, state: g.state, paused: g.paused, ai: g.ai,
  };
}
