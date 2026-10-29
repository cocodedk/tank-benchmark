// three.js scene: arena, tanks, shells, explosions. Reads the sim, never changes it.
import * as THREE from 'three';
import { WALLS } from './collide.js';

const box = (w, h, d, color, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  return m;
};

function makeTank(color) {
  const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color });
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.4, 10), mat);
  turret.position.set(0, 1.0, 0);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8), mat);
  barrel.rotation.z = Math.PI / 2; barrel.position.set(0.9, 1.0, 0);
  g.add(box(2.4, 0.6, 1.5, color, 0, 0.5, 0), box(2.6, 0.5, 0.4, 0x222222, 0, 0.3, 0.95),
    box(2.6, 0.5, 0.4, 0x222222, 0, 0.3, -0.95), turret, barrel);
  return g;
}

export function createView() {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  document.body.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b1f24);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(-10, 30, 15);
  scene.add(sun);

  scene.add(box(40, 0.2, 30, 0x4a5a3a, 0, -0.1, 0));
  for (const [w, d, x, z] of [[42, 1, 0, -15.5], [42, 1, 0, 15.5], [1, 30, -20.5, 0], [1, 30, 20.5, 0]]) {
    scene.add(box(w, 1.5, d, 0x777777, x, 0.75, z));
  }
  for (const w of WALLS) scene.add(box(w.width, 1.5, w.depth, 0x8a8a8a, w.x, 0.75, w.z));

  const tanks = { player: makeTank(0x2f6fe0), computer: makeTank(0xd33a3a) };
  scene.add(tanks.player, tanks.computer);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(0, 34, 26);
  camera.lookAt(0, 0, 0);

  const shellGeo = new THREE.SphereGeometry(0.25, 8, 6), shellMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
  const boomGeo = new THREE.SphereGeometry(1, 12, 8);
  const shells = [], booms = [];
  const sync = (pool, n, make) => {
    while (pool.length < n) { const m = make(); pool.push(m); scene.add(m); }
    pool.forEach((m, i) => { m.visible = i < n; });
  };

  function resize() {
    const w = window.innerWidth, h = window.innerHeight, aspect = w / h;
    renderer.setSize(w, h);
    camera.aspect = aspect;
    camera.fov = Math.max(42, (2 * Math.atan(Math.tan(30 * Math.PI / 180) / aspect)) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  return (s) => {
    for (const k of ['player', 'computer']) {
      const t = s.tanks[k];
      tanks[k].position.set(t.x, 0, t.z);
      tanks[k].rotation.y = -t.heading * Math.PI / 180;
    }
    sync(shells, s.shells.length, () => new THREE.Mesh(shellGeo, shellMat));
    s.shells.forEach((sh, i) => shells[i].position.set(sh.x, 1.0, sh.z));
    sync(booms, s.explosions.length, () => new THREE.Mesh(boomGeo,
      new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true })));
    s.explosions.forEach((e, i) => {
      booms[i].position.set(e.x, 1.0, e.z);
      booms[i].scale.setScalar(0.4 + e.age * 4);
      booms[i].material.opacity = 1 - e.age / 0.5;
    });
    renderer.render(scene, camera);
  };
}
