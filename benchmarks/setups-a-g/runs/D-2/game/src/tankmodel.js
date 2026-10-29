import * as THREE from 'three';

const TRACK = new THREE.MeshLambertMaterial({color: 0x2b2b2b});

const part = (geometry, material, x, y, z) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  return mesh;
};

/** A low-poly tank facing +x: hull, two tracks, turret and barrel. */
export function makeTank(color) {
  const paint = new THREE.MeshLambertMaterial({color});
  const barrel = part(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 8), paint, 1.0, 0.95, 0);
  barrel.rotation.z = Math.PI / 2;
  const tank = new THREE.Group();
  tank.add(
    part(new THREE.BoxGeometry(2.2, 0.6, 1.3), paint, 0, 0.55, 0),
    part(new THREE.BoxGeometry(2.4, 0.5, 0.5), TRACK, 0, 0.25, 0.85),
    part(new THREE.BoxGeometry(2.4, 0.5, 0.5), TRACK, 0, 0.25, -0.85),
    part(new THREE.CylinderGeometry(0.55, 0.65, 0.4, 8), paint, 0, 1.05, 0),
    barrel,
  );
  return tank;
}
