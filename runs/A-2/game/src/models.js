import * as THREE from 'three';

/** A low-poly tank facing local +x: hull, two tracks, turret and barrel. */
export function tankModel(color) {
  const group = new THREE.Group();
  const paint = new THREE.MeshLambertMaterial({ color });
  const dark = new THREE.MeshLambertMaterial({ color: 0x23262b });
  const add = (geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  add(new THREE.BoxGeometry(2.2, 0.5, 1.4), paint, 0, 0.55, 0);
  add(new THREE.BoxGeometry(2.4, 0.6, 0.5), dark, 0, 0.3, 0.75);
  add(new THREE.BoxGeometry(2.4, 0.6, 0.5), dark, 0, 0.3, -0.75);
  add(new THREE.BoxGeometry(1.1, 0.45, 1.0), paint, -0.1, 1.0, 0);
  add(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), dark, 0.9, 1.0, 0).rotation.z = Math.PI / 2;
  return group;
}
