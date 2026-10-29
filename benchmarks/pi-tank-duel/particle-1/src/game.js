import {
  ARENA, WALLS, TANK_RADIUS, SHELL_SPEED, SHELL_OFFSET, FIRE_COOLDOWN,
  MAX_SHELLS, ROUND_BANNER_TIME,
} from './constants.js';
import { circleRect, norm } from './geometry.js';
import { moveTank as moveTankFn } from './movement.js';
import { updateShells } from './shells.js';
import { updateAI } from './ai.js';

const round4 = (v) => Math.round(v * 10000) / 10000;
const makeTank = (x, z, heading) => ({
  x, z, heading, health: 100, shots: 0, lastShot: -Infinity,
});

export class Game {
  constructor(input) {
    this.input = input;
    this.paused = false;
    this.ai = true;
    this.nextShellId = 1;
    this.reset();
  }

  reset() {
    this.round = 1;
    this.score = { player: 0, computer: 0 };
    this.effects = [];
    this.time = 0;
    this.beginRound();
  }

  beginRound(shots = { player: 0, computer: 0 }) {
    this.tanks = {
      player: makeTank(-15, 0, 0),
      computer: makeTank(15, 0, 180),
    };
    this.tanks.player.shots = shots.player;
    this.tanks.computer.shots = shots.computer;
    this.shells = [];
    this.state = 'playing';
    this.winner = null;
    this.roundTimer = 0;
  }

  step(dt) {
    this.time += dt;
    this.updateEffects(dt);
    if (this.state === 'round_over') {
      this.roundTimer -= dt;
      if (this.roundTimer <= 1e-9) {
        const shots = {
          player: this.tanks.player.shots,
          computer: this.tanks.computer.shots,
        };
        this.round += 1;
        this.beginRound(shots);
      }
      return;
    }
    const input = this.input();
    if (this.ai) updateAI(this, dt);
    moveTankFn(this, 'player', input, dt);
    updateShells(this, dt);
    if (input.fire) this.fire('player');
    this.checkRound();
  }

  moveTank(name, input, dt) {
    moveTankFn(this, name, input, dt);
  }

  fire(name) {
    const tank = this.tanks[name];
    if (!tank || tank.health <= 0 || this.state !== 'playing') return false;
    if (this.time - tank.lastShot < FIRE_COOLDOWN - 1e-9) return false;
    if (this.shells.filter((s) => s.owner === name).length >= MAX_SHELLS) return false;
    const rad = (tank.heading * Math.PI) / 180;
    const fx = Math.cos(rad);
    const fz = Math.sin(rad);
    this.shells.push({
      id: this.nextShellId,
      x: tank.x + fx * SHELL_OFFSET,
      z: tank.z + fz * SHELL_OFFSET,
      vx: fx * SHELL_SPEED,
      vz: fz * SHELL_SPEED,
      owner: name,
      bounces: 0,
    });
    this.nextShellId += 1;
    tank.lastShot = this.time;
    tank.shots += 1;
    return true;
  }

  updateEffects(dt) {
    for (const effect of this.effects) effect.life -= dt;
    this.effects = this.effects.filter((effect) => effect.life > 0);
  }

  checkRound() {
    if (this.state !== 'playing') return;
    const player = this.tanks.player;
    const computer = this.tanks.computer;
    if (player.health > 0 && computer.health > 0) return;
    if (computer.health <= 0) {
      this.score.player += 1;
      this.winner = 'player';
    } else {
      this.score.computer += 1;
      this.winner = 'computer';
    }
    this.state = 'round_over';
    this.roundTimer = ROUND_BANNER_TIME;
  }

  place(name, x, z, heading) {
    const tank = this.tanks[name];
    const other = this.tanks[name === 'player' ? 'computer' : 'player'];
    const hw = ARENA.width / 2 - TANK_RADIUS;
    const hd = ARENA.depth / 2 - TANK_RADIUS;
    if (Math.abs(x) > hw || Math.abs(z) > hd) return 'outside the arena';
    for (const wall of WALLS) {
      if (circleRect(x, z, TANK_RADIUS, wall)) return 'inside a wall';
    }
    if (Math.hypot(x - other.x, z - other.z) < TANK_RADIUS * 2) {
      return 'overlapping the other tank';
    }
    tank.x = x;
    tank.z = z;
    tank.heading = norm(heading);
    return null;
  }

  describe() {
    const tank = (t) => ({
      x: round4(t.x),
      z: round4(t.z),
      heading: norm(round4(norm(t.heading))),
      health: t.health,
      shots: t.shots,
    });
    return {
      ok: true,
      arena: { width: ARENA.width, depth: ARENA.depth },
      walls: WALLS.map((w) => ({ x: w.x, z: w.z, width: w.width, depth: w.depth })),
      tanks: {
        player: tank(this.tanks.player),
        computer: tank(this.tanks.computer),
      },
      shells: this.shells.map((s) => ({
        x: round4(s.x), z: round4(s.z), owner: s.owner, bounces: s.bounces,
      })),
      score: { ...this.score },
      round: this.round,
      state: this.state,
      paused: this.paused,
      ai: this.ai,
    };
  }
}
