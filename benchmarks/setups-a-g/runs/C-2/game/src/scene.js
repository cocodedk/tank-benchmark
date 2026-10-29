import * as THREE from "three";
import { WALLS, HALF_X, HALF_Z } from "./arena.js";

const box = (w, h, d, color, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  return m;
};

function makeTank(color) {
  const t = new THREE.Group();
  t.add(box(2.2, 0.6, 1.4, color, 0, 0.6, 0));
  t.add(box(2.6, 0.5, 0.45, 0x222222, 0, 0.35, 0.95));
  t.add(box(2.6, 0.5, 0.45, 0x222222, 0, 0.35, -0.95));
  t.add(box(1.1, 0.5, 1.0, color, -0.1, 1.1, 0));
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8), new THREE.MeshLambertMaterial({ color: 0x333333 }));
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(1.2, 1.1, 0);
  t.add(barrel);
  return t;
}

export function createScene() {
  const renderer = new THREE.WebGLRenderer();
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x20252b);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 38, 26);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(10, 30, 10);
  scene.add(sun);

  scene.add(box(2 * HALF_X, 0.2, 2 * HALF_Z, 0x4a5a40, 0, -0.1, 0));
  for (const w of WALLS) scene.add(box(w.width, 1.6, w.depth, 0x8a8a8a, w.x, 0.8, w.z));
  scene.add(box(2 * HALF_X + 2, 1.6, 1, 0x6a6a6a, 0, 0.8, -HALF_Z - 0.5));
  scene.add(box(2 * HALF_X + 2, 1.6, 1, 0x6a6a6a, 0, 0.8, HALF_Z + 0.5));
  scene.add(box(1, 1.6, 2 * HALF_Z, 0x6a6a6a, -HALF_X - 0.5, 0.8, 0));
  scene.add(box(1, 1.6, 2 * HALF_Z, 0x6a6a6a, HALF_X + 0.5, 0.8, 0));

  const tanks = { player: makeTank(0x2f6fdd), computer: makeTank(0xdd3030) };
  scene.add(tanks.player, tanks.computer);
  const shellGeo = new THREE.SphereGeometry(0.25, 8, 6);
  const shellMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
  const shellMeshes = [];
  const booms = [];

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    // Keep the arena's full width in view on narrow windows by widening the vertical field of view.
    camera.fov = (2 * Math.atan(Math.max(Math.tan(Math.PI / 7.2), 0.75 / camera.aspect)) * 180) / Math.PI;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  return function render(g, dt) {
    for (const n of ["player", "computer"]) {
      const t = g.tanks[n];
      tanks[n].position.set(t.x, 0, t.z);
      tanks[n].rotation.y = (-t.heading * Math.PI) / 180;
    }
    while (shellMeshes.length < g.shells.length) {
      const m = new THREE.Mesh(shellGeo, shellMat);
      scene.add(m);
      shellMeshes.push(m);
    }
    shellMeshes.forEach((m, i) => {
      const s = g.shells[i];
      m.visible = !!s;
      if (s) m.position.set(s.x, 0.9, s.z);
    });
    for (const e of g.events.splice(0)) {
      const m = new THREE.Mesh(shellGeo, new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true }));
      m.position.set(e.x, 0.9, e.z);
      scene.add(m);
      booms.push({ m, age: 0 });
    }
    for (let i = booms.length - 1; i >= 0; i--) {
      const b = booms[i];
      b.age += dt;
      const k = b.age / 0.4;
      if (k >= 1) { scene.remove(b.m); b.m.material.dispose(); booms.splice(i, 1); continue; }
      b.m.scale.setScalar(2 + k * 8);
      b.m.material.opacity = 1 - k;
    }
    renderer.render(scene, camera);
  };
}
