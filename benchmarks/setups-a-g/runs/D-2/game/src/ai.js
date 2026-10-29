import {WALLS} from './config.js';
import {segBlocked} from './geom.js';
import {findSpot} from './nav.js';

const SHOT_GAP_STEPS = 60;

/** The computer's keys for this step: aim at you, close in or back off, shoot when the line is clear. */
export function aiInput(g) {
  const me = g.tanks.computer;
  const you = g.tanks.player;
  const input = {fwd: false, back: false, left: false, right: false, fire: false};
  const clear = !segBlocked(me.x, me.z, you.x, you.z, WALLS, 0.5);
  const nav = g.nav ??= {at: -Infinity, spot: null};
  let goal = you;
  if (!clear) {
    if (g.tick - nav.at >= 10) Object.assign(nav, {at: g.tick, spot: findSpot(me, you)});
    goal = nav.spot ?? you;
  }
  const want = Math.atan2(goal.z - me.z, goal.x - me.x) * 180 / Math.PI;
  const off = ((want - me.heading + 540) % 360) - 180;
  input.right = off > 2;
  input.left = off < -2;
  if (!clear) {
    input.fwd = Math.abs(off) < 40;
  } else {
    const dist = Math.hypot(you.x - me.x, you.z - me.z);
    input.fwd = dist > 12 && Math.abs(off) < 40;
    input.back = dist < 7;
    input.fire = Math.abs(off) < 3 && g.tick - me.lastShot >= SHOT_GAP_STEPS;
  }
  return input;
}
