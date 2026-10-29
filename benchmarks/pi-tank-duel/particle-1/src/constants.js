export const ARENA = { width: 40, depth: 30 };

export const WALLS = [
  { x: -8, z: -8, width: 2, depth: 6 },
  { x: -8, z: 8, width: 2, depth: 6 },
  { x: 8, z: -8, width: 2, depth: 6 },
  { x: 8, z: 8, width: 2, depth: 6 },
];

export const TANK_RADIUS = 1.2;
export const TANK_SPEED = 6;
export const REVERSE_SPEED = 4;
export const TURN_RATE = 120;

export const SHELL_SPEED = 15;
export const SHELL_RADIUS = 0.25;
export const SHELL_OFFSET = 1.6;
export const SHELL_DAMAGE = 25;
export const FIRE_COOLDOWN = 0.5;
export const MAX_SHELLS = 3;

export const DT = 1 / 60;
export const ROUND_BANNER_TIME = 2;
