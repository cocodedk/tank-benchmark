/* The model's coordinate space and fixed geometry, in world units. */

export const VIEW = {
  width: 2100,
  height: 1050,
  top: -700,
  bottom: 350,
  centreY: -175,
  minZoom: 1,
  maxZoom: 20,
  parts: [
    "sky",
    "river",
    "north tower",
    "south tower",
    "high-level walkways",
    "road deck",
    "bascule spans",
    "side spans",
    "suspension chains",
    "piers",
  ],
};

export const G = {
  waterY: 0,
  deckY: -120,
  shoreX: 1000,
  towerX: 180,
  towerHalf: 58,
  shaftTop: -500,
  turretTop: -620,
  walkwayTop: -466,
  walkwayBottom: -418,
};
