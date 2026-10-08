// The three.js picture of the game: arena, tanks, shells and explosions, under a fixed tilted camera.
import * as THREE from "three";
import { WIDTH, DEPTH, HALF_W, HALF_D, WALLS } from "./arena.js";
import { game, SHELL_R } from "./game.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d2330);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(-10, 30, 15);
scene.add(sun);

const mat = (color) => new THREE.MeshLambertMaterial({ color });
function box(w, h, d, color, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

box(WIDTH, 0.2, DEPTH, 0x6b7a5a, 0, -0.1, 0);
for (const s of [-1, 1]) {
  box(1, 1.5, DEPTH + 2, 0x8a8f99, s * (HALF_W + 0.5), 0.75, 0);
  box(WIDTH, 1.5, 1, 0x8a8f99, 0, 0.75, s * (HALF_D + 0.5));
}
for (const w of WALLS) box(w.width, 1.5, w.depth, 0x9aa0aa, w.x, 0.75, w.z);

// A low-poly tank facing +x: hull, two tracks, turret and barrel.
function tank(color) {
  const g = new THREE.Group();
  box(2.1, 0.6, 1.5, color, 0, 0.6, 0, g);
  for (const s of [-1, 1]) box(2.4, 0.5, 0.45, 0x222222, 0, 0.3, s * 0.85, g);
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.45, 8), mat(color));
  turret.position.y = 1.1;
  g.add(turret);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 8), mat(0x333333));
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0.95, 1.1, 0);
  g.add(barrel);
  scene.add(g);
  return g;
}
const tanks = { player: tank(0x2f6fdf), computer: tank(0xd8382f) };

const shellGeo = new THREE.SphereGeometry(SHELL_R, 10, 8), shellMat = mat(0xffe08a);
const blastGeo = new THREE.SphereGeometry(1, 12, 8);
const shells = [], blasts = [];
// Shows the first n meshes of a pool, growing it as needed.
function pool(list, n, make) {
  while (list.length < n) {
    list.push(make());
    scene.add(list.at(-1));
  }
  list.forEach((m, i) => { m.visible = i < n; });
  return list;
}

function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio);
  camera.aspect = w / h;
  const far = Math.max(1, 1.45 / camera.aspect);
  camera.position.set(0, 36 * far, 26 * far);
  camera.lookAt(0, 0, 1);
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", fit);
fit();

export function draw() {
  for (const [name, g] of Object.entries(tanks)) {
    const t = game.tanks[name];
    g.position.set(t.x, 0, t.z);
    g.rotation.y = -t.heading * Math.PI / 180;
  }
  pool(shells, game.shells.length, () => new THREE.Mesh(shellGeo, shellMat));
  game.shells.forEach((s, i) => shells[i].position.set(s.x, 1.1, s.z));
  pool(blasts, game.explosions.length,
    () => new THREE.Mesh(blastGeo, new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true })));
  game.explosions.forEach((e, i) => {
    const age = (game.tick - e.born) / 30;
    blasts[i].position.set(e.x, 1, e.z);
    blasts[i].scale.setScalar(0.4 + 1.4 * age);
    blasts[i].material.opacity = 1 - age;
  });
  renderer.render(scene, camera);
}
