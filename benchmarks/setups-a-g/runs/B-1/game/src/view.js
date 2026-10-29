// The three.js scene: floor, walls, tanks, shells, explosions, fixed camera.
import * as THREE from 'three';
import { WALLS, HALF_X, HALF_Z } from './collide.js';

const mat = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true });
const box = (w, h, d, m, x, y, z) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  return o;
};

function makeTank(color) {
  const g = new THREE.Group(), m = mat(color), dark = mat(0x222222);
  g.add(box(3, 0.7, 1.8, m, 0, 0.65, 0));
  g.add(box(3.2, 0.6, 0.5, dark, 0, 0.4, 1.1), box(3.2, 0.6, 0.5, dark, 0, 0.4, -1.1));
  g.add(box(1.4, 0.5, 1.2, m, -0.1, 1.2, 0));
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 8).rotateZ(Math.PI / 2), dark);
  barrel.position.set(1.1, 1.25, 0);
  g.add(barrel);
  return g;
}

export function createView(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101820);
  const camera = new THREE.PerspectiveCamera(45, 1, 1, 200);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(-10, 30, 10);
  scene.add(sun);

  scene.add(box(2 * HALF_X, 0.2, 2 * HALF_Z, mat(0x3a4a3a), 0, -0.1, 0));
  const wallMat = mat(0x8a8a8a);
  for (const w of WALLS) scene.add(box(w.width, 2, w.depth, wallMat, w.x, 1, w.z));
  scene.add(box(2 * HALF_X + 1, 2, 1, wallMat, 0, 1, -HALF_Z - 0.5), box(2 * HALF_X + 1, 2, 1, wallMat, 0, 1, HALF_Z + 0.5));
  scene.add(box(1, 2, 2 * HALF_Z, wallMat, -HALF_X - 0.5, 1, 0), box(1, 2, 2 * HALF_Z, wallMat, HALF_X + 0.5, 1, 0));

  const tanks = { player: makeTank(0x2a6fdb), computer: makeTank(0xd63a3a) };
  scene.add(tanks.player, tanks.computer);

  const ball = new THREE.SphereGeometry(1, 10, 8);
  const shellMat = mat(0xffe070), boomMat = new THREE.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: 0.8 });
  const pool = (material) => {
    const list = [];
    return (n, fn) => {
      while (list.length < n) { const m = new THREE.Mesh(ball, material); scene.add(m); list.push(m); }
      list.forEach((m, i) => { m.visible = i < n; if (i < n) fn(m, i); });
    };
  };
  const shellPool = pool(shellMat), boomPool = pool(boomMat);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight, a = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = a;
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    const d = Math.max(25 / (tanV * a), 19 / tanV) * 1.08;
    camera.position.set(0, d * 0.8, d * 0.6);
    camera.lookAt(0, 0, 1);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  return function render(s) {
    for (const k of ['player', 'computer']) {
      const t = s.tanks[k];
      tanks[k].position.set(t.x, 0, t.z);
      tanks[k].rotation.y = (-t.heading * Math.PI) / 180;
    }
    shellPool(s.shells.length, (m, i) => { m.position.set(s.shells[i].x, 1.2, s.shells[i].z); m.scale.setScalar(0.25); });
    boomPool(s.explosions.length, (m, i) => {
      const e = s.explosions[i];
      m.position.set(e.x, 1.2, e.z);
      m.scale.setScalar(0.4 + (0.4 - e.t) * 3);
    });
    renderer.render(scene, camera);
  };
}
