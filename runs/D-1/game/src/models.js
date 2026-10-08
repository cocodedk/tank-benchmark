import * as THREE from 'three';

const box = (w, h, d, color, x, y, z) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  mesh.position.set(x, y, z);
  return mesh;
};

/** A low-poly tank facing local +x: hull, two tracks, turret and barrel. */
export function buildTank(color) {
  const tank = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.6, 8), new THREE.MeshLambertMaterial({ color: 0x333333 }));
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(1.2, 1.1, 0);
  tank.add(
    box(2.2, 0.6, 1.6, color, 0, 0.6, 0),
    box(2.4, 0.5, 0.45, 0x222222, 0, 0.25, 0.9),
    box(2.4, 0.5, 0.45, 0x222222, 0, 0.25, -0.9),
    box(1.2, 0.5, 1.1, color, -0.1, 1.15, 0),
    barrel,
  );
  return tank;
}

export function buildArena(scene, arena, walls) {
  const floor = box(arena.width, 0.2, arena.depth, 0x6b705c, 0, -0.1, 0);
  scene.add(floor);
  const wall = (w, d, x, z) => scene.add(box(w, 2, d, 0x8d99ae, x, 1, z));
  for (const w of walls) wall(w.width, w.depth, w.x, w.z);
  const t = 1;
  wall(arena.width + 2 * t, t, 0, -(arena.depth + t) / 2);
  wall(arena.width + 2 * t, t, 0, (arena.depth + t) / 2);
  wall(t, arena.depth, -(arena.width + t) / 2, 0);
  wall(t, arena.depth, (arena.width + t) / 2, 0);
}
