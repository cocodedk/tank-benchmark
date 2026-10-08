// three.js scene and HUD.
import * as THREE from 'three';
import { ARENA, WALLS } from './world.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20252b);
const camera = new THREE.PerspectiveCamera(45, 1, 1, 200);
camera.position.set(0, 34, 26);
camera.lookAt(0, 0, 0);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(-10, 30, 15);
scene.add(sun);

function resize() {
  const w = window.innerWidth, h = window.innerHeight, aspect = w / h;
  renderer.setSize(w, h, false);
  camera.aspect = aspect;
  camera.fov = 2 * Math.atan(Math.tan(Math.PI / 8) * Math.max(1, 1.7 / aspect)) * 180 / Math.PI;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const box = (w, h, d, color, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  return m;
};
scene.add(box(ARENA.width, 0.2, ARENA.depth, 0x56633f, 0, -0.1, 0));
const hw = ARENA.width / 2, hd = ARENA.depth / 2;
scene.add(box(ARENA.width + 2, 2, 1, 0x7a7a7a, 0, 1, -hd - 0.5), box(ARENA.width + 2, 2, 1, 0x7a7a7a, 0, 1, hd + 0.5),
          box(1, 2, ARENA.depth, 0x7a7a7a, -hw - 0.5, 1, 0), box(1, 2, ARENA.depth, 0x7a7a7a, hw + 0.5, 1, 0));
for (const w of WALLS) scene.add(box(w.width, 2, w.depth, 0x8c6d4f, w.x, 1, w.z));

function makeTank(color) {
  const g = new THREE.Group(), dark = 0x222222;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), new THREE.MeshLambertMaterial({ color: dark }));
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0.9, 1.1, 0);
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.4, 10), new THREE.MeshLambertMaterial({ color }));
  turret.position.y = 1.1;
  g.add(box(2.2, 0.6, 1.5, color, 0, 0.6, 0), box(2.6, 0.5, 0.4, dark, 0, 0.3, 0.95), box(2.6, 0.5, 0.4, dark, 0, 0.3, -0.95), turret, barrel);
  scene.add(g);
  return g;
}
const tanks = { player: makeTank(0x2f6fe0), computer: makeTank(0xd6392f) };
const shellGeo = new THREE.SphereGeometry(0.25, 8, 8), shellMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
const shellMeshes = [], blasts = [];

function sync(list, meshes, make) {
  while (meshes.length < list.length) { const m = make(); meshes.push(m); scene.add(m); }
  while (meshes.length > list.length) scene.remove(meshes.pop());
}

const el = id => document.getElementById(id);
export function render(s) {
  for (const n of ['player', 'computer']) {
    const t = s.tanks[n];
    tanks[n].position.set(t.x, 0, t.z);
    tanks[n].rotation.y = -t.heading * Math.PI / 180;
    el('hp-' + n).style.width = t.health + '%';
  }
  sync(s.shells, shellMeshes, () => new THREE.Mesh(shellGeo, shellMat));
  s.shells.forEach((h, i) => shellMeshes[i].position.set(h.x, 1.1, h.z));
  sync(s.explosions, blasts, () => new THREE.Mesh(shellGeo, new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true })));
  s.explosions.forEach((e, i) => {
    const age = (s.tick - e.t) / 24;
    blasts[i].position.set(e.x, 1.1, e.z);
    blasts[i].scale.setScalar(1 + age * 5);
    blasts[i].material.opacity = 1 - age;
  });
  el('score').textContent = `${s.score.player} : ${s.score.computer}`;
  el('round').textContent = s.round;
  el('banner').hidden = s.state !== 'round_over';
  el('banner').textContent = s.banner;
  renderer.render(scene, camera);
}
