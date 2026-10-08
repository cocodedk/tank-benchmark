import {aiInput} from './ai.js';
import {DT, EXPLOSION_SECONDS} from './config.js';
import {startRound} from './game.js';
import {fire, moveShells} from './shells.js';
import {drive} from './tanks.js';

/** One 1/60 s step. `input` holds the player's held keys (fwd, back, left, right) and a queued `fire`. */
export function stepGame(g, input) {
  g.tick++;
  const playerInput = {...input};
  input.fire = false;
  for (const e of g.explosions) e.age += DT;
  g.explosions = g.explosions.filter(e => e.age < EXPLOSION_SECONDS);
  if (g.state === 'round_over') {
    if (--g.bannerLeft <= 0) {
      g.round++;
      startRound(g);
    }
    return;
  }
  const inputs = {player: playerInput};
  if (g.ai) inputs.computer = aiInput(g);
  for (const [name, i] of Object.entries(inputs)) {
    drive(g, name, i);
    if (i.fire) fire(g, name);
  }
  moveShells(g);
}
