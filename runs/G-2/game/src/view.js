// The three.js picture of the game: arena, tanks, shells and explosions, redrawn from the state.
import * as THREE from 'three';
import { HALF_W, HALF_D, SHELL_R, WALLS } from './arena.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d2330);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(-10, 30, 15);
scene.add(sun);

const mat = color => new THREE.MeshStandardMaterial({ color, flatShading: true });
function box(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  return m;
}

const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALF_W, 2 * HALF_D), mat(0x6b7d5a));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const T = 1, H = 1.5, WALL = 0x9a8f80;
scene.add(box(2 * HALF_W + 2 * T, H, T, WALL, 0, H / 2, -HALF_D - T / 2));
scene.add(box(2 * HALF_W + 2 * T, H, T, WALL, 0, H / 2, HALF_D + T / 2));
scene.add(box(T, H, 2 * HALF_D, WALL, -HALF_W - T / 2, H / 2, 0));
scene.add(box(T, H, 2 * HALF_D, WALL, HALF_W + T / 2, H / 2, 0));
for (const w of WALLS) scene.add(box(w.width, H, w.depth, WALL, w.x, H / 2, w.z));

// A tank built along +x: hull, two tracks, turret and barrel.
function tank(color) {
  const g = new THREE.Group();
  g.add(box(2.2, 0.6, 1.5, color, 0, 0.6, 0));
  g.add(box(2.4, 0.5, 0.45, 0x2b2b2b, 0, 0.25, 0.85));
  g.add(box(2.4, 0.5, 0.45, 0x2b2b2b, 0, 0.25, -0.85));
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.45, 8), mat(color));
  turret.position.y = 1.12;
  g.add(turret);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 8), mat(0x333333));
  barrel.rotation.z = -Math.PI / 2;
  barrel.position.set(0.9, 1.12, 0);
  g.add(barrel);
  scene.add(g);
  return g;
}
const tanks = { player: tank(0x2f6fe0), computer: tank(0xd8382f) };

const shellGeo = new THREE.SphereGeometry(SHELL_R, 10, 8), shellMat = mat(0xffe08a);
const shells = [];
const blastGeo = new THREE.SphereGeometry(1, 12, 10);
let blasts = [];

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  const far = Math.max(1, 1.45 / camera.aspect);
  camera.position.set(0, 34 * far, 24 * far);
  camera.lookAt(0, 0, 1.5);
  camera.far = 100 * far;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

export function draw(game, dt) {
  for (const [name, t] of Object.entries(game.tanks)) {
    tanks[name].position.set(t.x, 0, t.z);
    tanks[name].rotation.y = -t.heading * Math.PI / 180;
  }
  while (shells.length < game.shells.length) { shells.push(new THREE.Mesh(shellGeo, shellMat)); scene.add(shells.at(-1)); }
  shells.forEach((m, i) => {
    const s = game.shells[i];
    m.visible = !!s;
    if (s) m.position.set(s.x, 1.1, s.z);
  });
  for (const e of game.explosions.splice(0)) {
    const m = new THREE.Mesh(blastGeo, new THREE.MeshBasicMaterial({ color: 0xffa020, transparent: true }));
    m.position.set(e.x, 1, e.z);
    m.age = 0;
    scene.add(m);
    blasts.push(m);
  }
  blasts = blasts.filter(m => {
    m.age += dt;
    m.scale.setScalar(0.3 + 3 * m.age);
    m.material.opacity = 1 - m.age / 0.5;
    if (m.age < 0.5) return true;
    scene.remove(m);
    m.material.dispose();
    return false;
  });
  renderer.render(scene, camera);
}
