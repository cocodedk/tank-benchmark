import { ARENA, WALLS } from './constants.js';
import { normalizeHeading } from './physics.js';

const round6 = (value) => Math.round(value * 1e6) / 1e6;

function tankInfo(game, name) {
  const tank = game.tanks[name];
  return {
    x: round6(tank.x),
    z: round6(tank.z),
    heading: round6(normalizeHeading(tank.heading)) % 360,
    health: tank.health,
    shots: game.shots[name],
  };
}

/** The state object every WebMCP tool reads from. */
export function describeGame(game) {
  return {
    ok: true,
    arena: { width: ARENA.width, depth: ARENA.depth },
    walls: WALLS.map((wall) => ({
      x: wall.x,
      z: wall.z,
      width: wall.width,
      depth: wall.depth,
    })),
    tanks: {
      player: tankInfo(game, 'player'),
      computer: tankInfo(game, 'computer'),
    },
    shells: game.shells.map((shell) => ({
      x: round6(shell.x),
      z: round6(shell.z),
      owner: shell.owner,
      bounces: shell.bounces,
    })),
    score: { player: game.score.player, computer: game.score.computer },
    round: game.round,
    state: game.state,
    paused: game.paused,
    ai: game.aiEnabled,
  };
}
