import * as THREE from 'three';

/** A low-poly tank whose barrel points along +x before the group is rotated. */
export function createTank(color) {
  const group = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.25 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.55 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.62, 1.32), body);
  hull.position.set(0, 0.56, 0);
  group.add(hull);

  for (const side of [-1, 1]) {
    const track = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.42), dark);
    track.position.set(0, 0.3, side * 0.8);
    group.add(track);
  }

  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.68, 0.48, 8), body);
  turret.position.set(-0.05, 1.06, 0);
  group.add(turret);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.55, 8), steel);
  barrel.rotation.z = -Math.PI / 2;
  barrel.position.set(1.08, 1.13, 0);
  group.add(barrel);

  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 8), dark);
  muzzle.rotation.z = -Math.PI / 2;
  muzzle.position.set(1.84, 1.13, 0);
  group.add(muzzle);

  return group;
}
