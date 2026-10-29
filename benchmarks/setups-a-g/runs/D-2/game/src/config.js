export const DT = 1 / 60;
export const HALF = {x: 20, z: 15};
export const WALLS = [[-8, -8], [-8, 8], [8, -8], [8, 8]].map(([x, z]) => ({x, z, width: 2, depth: 6}));
export const NAMES = ['player', 'computer'];
export const OTHER = {player: 'computer', computer: 'player'};
export const START = {player: {x: -15, z: 0, heading: 0}, computer: {x: 15, z: 0, heading: 180}};

export const TANK_R = 1.2;
export const SHELL_R = 0.25;
export const SPEED = {forward: 6, reverse: 4, turn: 120, shell: 15};
export const MUZZLE = 1.6;
export const COOLDOWN_STEPS = 30;
export const MAX_SHELLS = 3;
export const DAMAGE = 25;
export const BANNER_STEPS = 120;
export const EXPLOSION_SECONDS = 0.4;
