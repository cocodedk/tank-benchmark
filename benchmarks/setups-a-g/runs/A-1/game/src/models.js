// Low-poly tank built from three.js geometry. Local +x is forward, so one rotation turns everything.
import * as THREE from 'three';

const part = (geometry, color, x, y, z) => {
  const m = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  return m;
};

export function makeTank(color) {
  const tank = new THREE.Group();
  const barrel = part(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), 0x444444, 0.9, 1.0, 0);
  barrel.rotation.z = Math.PI / 2;
  tank.add(
    part(new THREE.BoxGeometry(2.2, 0.5, 1.3), color, 0, 0.55, 0), // hull
    part(new THREE.BoxGeometry(2.4, 0.6, 0.45), 0x222222, 0, 0.3, 0.85), // tracks
    part(new THREE.BoxGeometry(2.4, 0.6, 0.45), 0x222222, 0, 0.3, -0.85),
    part(new THREE.CylinderGeometry(0.55, 0.65, 0.4, 8), new THREE.Color(color).multiplyScalar(0.7), 0, 1.0, 0), // turret
    barrel,
  );
  return tank;
}
