export const DT = 1 / 60;
export const ARENA = { width: 40, depth: 30 };
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));

export const TANK_RADIUS = 1.2;
export const FORWARD_SPEED = 6;
export const REVERSE_SPEED = 4;
export const TURN_SPEED = 120;
export const START_HEALTH = 100;
export const STARTS = {
  player: { x: -15, z: 0, heading: 0 },
  computer: { x: 15, z: 0, heading: 180 },
};

export const SHELL_RADIUS = 0.25;
export const SHELL_SPEED = 15;
export const MUZZLE = 1.6;
export const MAX_SHELLS = 3;
export const COOLDOWN_STEPS = 30;
export const SHELL_DAMAGE = 25;
export const EXPLOSION_TIME = 0.4;
export const BANNER_STEPS = 120;
