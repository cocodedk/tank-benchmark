// The three.js scene: arena, tanks, shells, explosions.
import * as THREE from 'three';
import { WALLS, HALF_X, HALF_Z, SR } from './geom.js';

const box = (w, h, d, color, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  return m;
};

function makeTank(color) {
  const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color });
  const dark = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  add(new THREE.BoxGeometry(2.2, 0.6, 1.5), mat, 0, 0.6, 0);
  add(new THREE.BoxGeometry(2.6, 0.5, 0.4), dark, 0, 0.35, 0.95);
  add(new THREE.BoxGeometry(2.6, 0.5, 0.4), dark, 0, 0.35, -0.95);
  add(new THREE.CylinderGeometry(0.55, 0.65, 0.4, 8), mat, 0, 1.1, 0);
  add(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8), dark, 1.0, 1.1, 0).rotation.z = Math.PI / 2;
  return g;
}

export function createView(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b2430);
  const camera = new THREE.PerspectiveCamera(50, 1, 1, 200);
  camera.position.set(0, 34, 30); camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(-10, 30, 10); scene.add(sun);
  scene.add(box(2 * HALF_X, 0.2, 2 * HALF_Z, 0x6b7a5a, 0, -0.1, 0));
  const wall = 0x8a8a92;
  scene.add(box(2 * HALF_X + 2, 2, 1, wall, 0, 1, -HALF_Z - 0.5), box(2 * HALF_X + 2, 2, 1, wall, 0, 1, HALF_Z + 0.5),
    box(1, 2, 2 * HALF_Z, wall, -HALF_X - 0.5, 1, 0), box(1, 2, 2 * HALF_Z, wall, HALF_X + 0.5, 1, 0));
  for (const w of WALLS) scene.add(box(w.width, 2, w.depth, 0xa0a0aa, w.x, 1, w.z));

  const tanks = { player: makeTank(0x2f6fe0), computer: makeTank(0xe03030) };
  scene.add(tanks.player, tanks.computer);
  const shellGeo = new THREE.SphereGeometry(SR, 12, 8), shellMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
  const shellMeshes = [], booms = [], boomGeo = new THREE.SphereGeometry(1, 12, 8);

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    camera.fov = (2 * Math.atan(Math.tan((25 * Math.PI) / 180) * Math.max(1, 1.5 / aspect)) * 180) / Math.PI;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  return function render(s, frameDt) {
    for (const n of ['player', 'computer']) {
      const t = s.tanks[n];
      tanks[n].position.set(t.x, 0, t.z);
      tanks[n].rotation.y = (-t.h * Math.PI) / 180;
    }
    while (shellMeshes.length < s.shells.length) { const m = new THREE.Mesh(shellGeo, shellMat); scene.add(m); shellMeshes.push(m); }
    shellMeshes.forEach((m, i) => {
      m.visible = i < s.shells.length;
      if (m.visible) m.position.set(s.shells[i].x, 0.9, s.shells[i].z);
    });
    for (const h of s.hits.splice(0)) {
      const m = new THREE.Mesh(boomGeo, new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true }));
      m.position.set(h.x, 0.9, h.z); scene.add(m); booms.push({ m, age: 0 });
    }
    for (let i = booms.length - 1; i >= 0; i--) {
      const b = booms[i];
      b.age += frameDt;
      const k = b.age / 0.4;
      b.m.scale.setScalar(0.4 + 1.6 * k); b.m.material.opacity = Math.max(0, 1 - k);
      if (k >= 1) { scene.remove(b.m); b.m.material.dispose(); booms.splice(i, 1); }
    }
    renderer.render(scene, camera);
  };
}
