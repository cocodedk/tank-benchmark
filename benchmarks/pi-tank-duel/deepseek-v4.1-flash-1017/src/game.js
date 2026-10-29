import { DEG, ROUND_BANNER_TICKS, SHELL, SPAWNS, STEP, TANK } from './constants.js';
import { aiControls } from './ai.js';
import { normalizeHeading, resolveTank, separateTanks } from './physics.js';
import { placementError } from './placement.js';
import { makeShell, advanceShell, shellHitsTank } from './shells.js';
import { describeGame } from './snapshot.js';

const NAMES = ['player', 'computer'];
const other = (name) => (name === 'player' ? 'computer' : 'player');

let nextShellId = 1;

export class Game {
  constructor() {
    this.paused = false;
    this.aiEnabled = true;
    this.hits = [];
    this.reset();
  }

  reset() {
    this.score = { player: 0, computer: 0 };
    this.round = 1;
    this.shots = { player: 0, computer: 0 };
    this.startRound();
  }

  startRound() {
    this.tanks = {};
    for (const name of NAMES) {
      const spawn = SPAWNS[name];
      this.tanks[name] = {
        x: spawn.x,
        z: spawn.z,
        heading: spawn.heading,
        health: TANK.maxHealth,
        cooldown: 0,
      };
    }
    this.shells = [];
    this.state = 'playing';
    this.banner = '';
    this.bannerTicks = 0;
    this.resetAIState();
  }

  resetAIState() {
    this.aiState = { path: [], timer: 0, lastX: NaN, lastZ: NaN };
  }

  setAI(enabled) {
    this.aiEnabled = enabled;
    this.resetAIState();
  }

  tick(keys, playerFired = false) {
    if (this.state === 'round_over') {
      this.bannerTicks -= 1;
      if (this.bannerTicks <= 0) {
        this.round += 1;
        this.startRound();
      }
      return;
    }

    for (const name of NAMES) {
      const tank = this.tanks[name];
      if (tank.cooldown > 0) tank.cooldown -= 1;
    }

    if (playerFired) this.fire('player');
    const computer = this.aiEnabled ? aiControls(this) : { turn: 0, drive: 0 };
    this.moveTank('player', this.controlsFor(keys));
    this.moveTank('computer', computer);
    this.updateShells();
  }

  controlsFor(keys) {
    const held = (code) => Boolean(keys && keys.has(code));
    let turn = 0;
    let drive = 0;
    if (held('KeyA') || held('ArrowLeft')) turn -= 1;
    if (held('KeyD') || held('ArrowRight')) turn += 1;
    if (held('KeyW') || held('ArrowUp')) drive += 1;
    if (held('KeyS') || held('ArrowDown')) drive -= 1;
    return { turn, drive };
  }

  moveTank(name, controls) {
    const tank = this.tanks[name];
    if (controls.turn) {
      tank.heading = normalizeHeading(tank.heading + controls.turn * TANK.turn * STEP);
    }
    if (!controls.drive) return;

    const speed = controls.drive > 0 ? TANK.forward : -TANK.reverse;
    const radians = tank.heading * DEG;
    tank.x += Math.cos(radians) * speed * STEP;
    tank.z += Math.sin(radians) * speed * STEP;
    resolveTank(tank, TANK.radius);
    separateTanks(tank, this.tanks[other(name)], TANK.radius);
    resolveTank(tank, TANK.radius);
  }

  fire(name) {
    const tank = this.tanks[name];
    if (!tank || this.state !== 'playing') return false;
    if (tank.cooldown > 0) return false;
    let inFlight = 0;
    for (const shell of this.shells) if (shell.owner === name) inFlight += 1;
    if (inFlight >= SHELL.maxInFlight) return false;

    const shell = makeShell(tank, name);
    shell.id = nextShellId;
    nextShellId += 1;
    this.shells.push(shell);
    tank.cooldown = SHELL.cooldownTicks;
    this.shots[name] += 1;
    return true;
  }

  updateShells() {
    const alive = [];
    for (const shell of this.shells) {
      if (this.state !== 'playing') {
        alive.push(shell);
        continue;
      }
      if (!advanceShell(shell)) continue;

      let hit = null;
      for (const name of NAMES) {
        if (shellHitsTank(shell, this.tanks[name])) {
          hit = name;
          break;
        }
      }
      if (!hit) {
        alive.push(shell);
        continue;
      }

      const tank = this.tanks[hit];
      tank.health = Math.max(0, tank.health - SHELL.damage);
      this.hits.push({ x: shell.x, z: shell.z });
      if (tank.health <= 0) this.endRound(hit);
    }
    this.shells = alive;
  }

  endRound(loser) {
    const winner = other(loser);
    this.score[winner] += 1;
    this.state = 'round_over';
    this.banner = winner === 'player' ? 'You win the round' : 'The computer wins the round';
    this.bannerTicks = ROUND_BANNER_TICKS;
    this.tanks[loser].health = 0;
  }

  place(name, x, z, heading) {
    if (typeof heading !== 'number' || !Number.isFinite(heading)) {
      return 'x, z and heading must be numbers';
    }
    const error = placementError(this, name, x, z);
    if (error) return error;
    const tank = this.tanks[name];
    tank.x = x;
    tank.z = z;
    tank.heading = normalizeHeading(heading);
    this.resetAIState();
    return null;
  }

  drainHits() {
    const hits = this.hits;
    this.hits = [];
    return hits;
  }

  describe() {
    return describeGame(this);
  }
}
