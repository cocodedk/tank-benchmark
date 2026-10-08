// The three.js view of the game state.
import * as THREE from 'three';
import { HALF_W, HALF_D, WALLS, SHELL_R } from './world.js';
import { game } from './game.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b2430);
export const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0, 34, 30);
camera.lookAt(0, 0, 1.5);

scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(10, 30, 15);
scene.add(sun);

const mat = color => new THREE.MeshStandardMaterial({ color, flatShading: true });
const box = (w, h, d, material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALF_W, 2 * HALF_D), mat(0x5d6b4a));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const wallMat = mat(0x8a8f99);
for (const [x, z, w, d] of [[0, -HALF_D - 0.5, 2 * HALF_W + 2, 1], [0, HALF_D + 0.5, 2 * HALF_W + 2, 1],
                            [-HALF_W - 0.5, 0, 1, 2 * HALF_D], [HALF_W + 0.5, 0, 1, 2 * HALF_D],
                            ...WALLS.map(w => [w.x, w.z, w.width, w.depth])]) {
  const wall = box(w, 1.5, d, wallMat);
  wall.position.set(x, 0.75, z);
  scene.add(wall);
}

// A tank whose local +x is its heading.
function tank(color) {
  const g = new THREE.Group(), body = mat(color), dark = mat(0x222222);
  const hull = box(2, 0.6, 1.4, body);
  hull.position.y = 0.55;
  g.add(hull);
  for (const side of [-0.8, 0.8]) {
    const track = box(2.3, 0.5, 0.45, dark);
    track.position.set(0, 0.25, side);
    g.add(track);
  }
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.45, 8), body);
  turret.position.y = 1.07;
  g.add(turret);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6), dark);
  barrel.rotation.z = -Math.PI / 2;
  barrel.position.set(0.9, 1.1, 0);
  g.add(barrel);
  scene.add(g);
  return g;
}
const tanks = { player: tank(0x3a7bff), computer: tank(0xe03a3a) };

const shellGeo = new THREE.SphereGeometry(SHELL_R, 10, 8), shellMat = mat(0xffe08a);
const blastGeo = new THREE.SphereGeometry(1, 12, 8);
const shells = [], blasts = [];

// Keep exactly n meshes in pool, made by make().
function pool(list, n, make) {
  while (list.length < n) { const m = make(); scene.add(m); list.push(m); }
  while (list.length > n) scene.remove(list.pop());
}

// The 45 degree view fits the arena at an aspect of 1.6; a narrower window widens the view to keep its width.
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = Math.max(45, 2 * Math.atan(Math.tan(Math.PI / 8) * 1.6 / camera.aspect) * 180 / Math.PI);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

export function render() {
  for (const [name, mesh] of Object.entries(tanks)) {
    const t = game.tanks[name];
    mesh.position.set(t.x, 0, t.z);
    mesh.rotation.y = -t.heading * Math.PI / 180;
  }
  pool(shells, game.shells.length, () => new THREE.Mesh(shellGeo, shellMat));
  game.shells.forEach((s, i) => shells[i].position.set(s.x, 0.9, s.z));
  pool(blasts, game.blasts.length, () => new THREE.Mesh(blastGeo,
    new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true })));
  game.blasts.forEach((b, i) => {
    const age = (game.tick - b.tick) / 30;
    blasts[i].position.set(b.x, 0.9, b.z);
    blasts[i].scale.setScalar(0.4 + 1.6 * age);
    blasts[i].material.opacity = 1 - age;
  });
  renderer.render(scene, camera);
}
