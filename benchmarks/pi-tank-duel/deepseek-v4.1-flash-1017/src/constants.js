export const STEP = 1 / 60;
export const DEG = Math.PI / 180;

export const ARENA = { width: 40, depth: 30, halfWidth: 20, halfDepth: 15 };

export const WALLS = [
  { x: -8, z: -8, width: 2, depth: 6 },
  { x: -8, z: 8, width: 2, depth: 6 },
  { x: 8, z: -8, width: 2, depth: 6 },
  { x: 8, z: 8, width: 2, depth: 6 },
];

export const TANK = {
  radius: 1.2,
  forward: 6,
  reverse: 4,
  turn: 120,
  maxHealth: 100,
};

export const SHELL = {
  radius: 0.25,
  speed: 15,
  spawn: 1.6,
  cooldownTicks: 30,
  maxInFlight: 3,
  damage: 25,
};

export const ROUND_BANNER_TICKS = 120;

export const SPAWNS = {
  player: { x: -15, z: 0, heading: 0 },
  computer: { x: 15, z: 0, heading: 180 },
};
