import * as THREE from 'three';
import { ARENA, WALLS } from './constants.js';

export function buildArena(scene) {
  scene.background = new THREE.Color(0x0a101b);

  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  const sun = new THREE.DirectionalLight(0xfff3e0, 2.4);
  sun.position.set(14, 32, 20);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x93c5fd, 0.9);
  fill.position.set(-18, 22, -14);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA.width, ARENA.depth),
    new THREE.MeshStandardMaterial({ color: 0x273449, roughness: 0.95, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const lane = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA.width, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x3d506b }),
  );
  lane.rotation.x = -Math.PI / 2;
  lane.position.y = 0.011;
  scene.add(lane);

  const outer = new THREE.MeshStandardMaterial({ color: 0x46556c, roughness: 0.8 });
  const height = 1.5;
  const thickness = 0.6;
  const outerWalls = [
    [ARENA.width + thickness * 2, height, thickness, 0, ARENA.halfDepth + thickness / 2],
    [ARENA.width + thickness * 2, height, thickness, 0, -ARENA.halfDepth - thickness / 2],
    [thickness, height, ARENA.depth, ARENA.halfWidth + thickness / 2, 0],
    [thickness, height, ARENA.depth, -ARENA.halfWidth - thickness / 2, 0],
  ];
  for (const [width, wallHeight, depth, x, z] of outerWalls) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, wallHeight, depth), outer);
    mesh.position.set(x, wallHeight / 2, z);
    scene.add(mesh);
  }

  const inner = new THREE.MeshStandardMaterial({ color: 0x6b7f9e, roughness: 0.75 });
  for (const wall of WALLS) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.width, 1.9, wall.depth), inner);
    mesh.position.set(wall.x, 0.95, wall.z);
    scene.add(mesh);
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(wall.width + 0.12, 0.12, wall.depth + 0.12),
      new THREE.MeshStandardMaterial({ color: 0x93a4bd, roughness: 0.6 }),
    );
    cap.position.set(wall.x, 1.96, wall.z);
    scene.add(cap);
  }
}
