// The model lives in a y-down world, centred on the bridge:
// x runs along the river, y runs from sky (negative) to river (positive).

export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 1000;

export const WATER_Y = 110;
export const DECK_Y = 0;
export const DECK_BOTTOM = 26;
export const DECK_END = 780;

export const TOWER_X = 220;
export const TOWER_HALF = 75;
export const TOWER_OUTER = TOWER_X + TOWER_HALF + 14;
export const TOWER_TOP = -300;
export const TOWER_BASE = 70;
export const TOWER_INNER = TOWER_X - TOWER_HALF;

export const WALKWAY_Y = -195;
export const WALKWAY_TOP = WALKWAY_Y - 9;
export const WALKWAY_BOTTOM = WALKWAY_Y + 13;

export const SPAN_END = 772;
export const CHAIN_TOP_Y = -265;

export const PARTS = [
  "sky",
  "river",
  "north tower",
  "south tower",
  "high-level walkways",
  "lower road deck",
  "bascule spans",
  "north side span",
  "south side span",
  "suspension chains",
  "stone piers",
];
