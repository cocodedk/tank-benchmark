export const DT = 1 / 60;
export const ARENA = { width: 40, depth: 30 };
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({ x, z, width: 2, depth: 6 }));
export const TANK_RADIUS = 1.2;
export const SHELL_RADIUS = 0.25;
export const SHELL_SPEED = 15;
export const MUZZLE = 1.6;
export const FORWARD = 6;
export const REVERSE = 4;
export const TURN = 120;
export const MAX_SHELLS = 3;
export const DAMAGE = 25;
// Durations are counted in steps so they stay exact: 0.5 s, 2 s and 0.4 s.
export const COOLDOWN_STEPS = 30;
export const BANNER_STEPS = 120;
export const FX_STEPS = 24;
export const STARTS = { player: { x: -15, z: 0, heading: 0 }, computer: { x: 15, z: 0, heading: 180 } };
export const OTHER = { player: 'computer', computer: 'player' };
