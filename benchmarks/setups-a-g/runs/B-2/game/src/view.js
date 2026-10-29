import * as THREE from 'three';
import { ARENA, WALLS } from './arena.js';

const box = (w, h, d, color, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  return m;
};

function makeTank(color) {
  const g = new THREE.Group();
  g.add(box(2.2, 0.7, 1.5, color, 0, 0.6, 0));
  g.add(box(2.4, 0.5, 0.5, 0x222222, 0, 0.25, 0.9));
  g.add(box(2.4, 0.5, 0.5, 0x222222, 0, 0.25, -0.9));
  g.add(box(1.1, 0.5, 1.1, color, -0.1, 1.2, 0));
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4), new THREE.MeshLambertMaterial({ color: 0x333333 }));
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(1.1, 1.2, 0);
  g.add(barrel);
  return g;
}

export function createView(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b2430);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(-10, 30, 10);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 34, 26);
  camera.lookAt(0, 0, 1);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ARENA.width, ARENA.depth), new THREE.MeshLambertMaterial({ color: 0x4a5a3a }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const hw = ARENA.width / 2, hd = ARENA.depth / 2;
  scene.add(box(ARENA.width + 2, 1.5, 1, 0x888888, 0, 0.75, -hd - 0.5), box(ARENA.width + 2, 1.5, 1, 0x888888, 0, 0.75, hd + 0.5),
    box(1, 1.5, ARENA.depth, 0x888888, -hw - 0.5, 0.75, 0), box(1, 1.5, ARENA.depth, 0x888888, hw + 0.5, 0.75, 0));
  for (const w of WALLS) scene.add(box(w.width, 1.5, w.depth, 0xa09080, w.x, 0.75, w.z));

  const tanks = { player: makeTank(0x3a6fe0), computer: makeTank(0xd03a3a) };
  scene.add(tanks.player, tanks.computer);

  const shellGeo = new THREE.SphereGeometry(0.25, 12, 8);
  const pool = (mk) => {
    const items = [];
    return (n) => {
      while (items.length < n) { const m = mk(); scene.add(m); items.push(m); }
      items.forEach((m, i) => { m.visible = i < n; });
      return items;
    };
  };
  const shells = pool(() => new THREE.Mesh(shellGeo, new THREE.MeshBasicMaterial({ color: 0xffee66 })));
  const blasts = pool(() => new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xff8822, transparent: true })));

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // widen the vertical fov on narrow windows so the whole floor stays in view
    camera.fov = 2 * Math.atan(Math.tan((25 * Math.PI) / 180) * Math.max(1, 1.6 / camera.aspect)) * (180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  return (g) => {
    for (const k of ['player', 'computer']) {
      const t = g.tanks[k];
      tanks[k].position.set(t.x, 0, t.z);
      tanks[k].rotation.y = (-t.heading * Math.PI) / 180;
    }
    shells(g.shells.length).forEach((m, i) => g.shells[i] && m.position.set(g.shells[i].x, 0.9, g.shells[i].z));
    blasts(g.explosions.length).forEach((m, i) => {
      const e = g.explosions[i];
      if (!e) return;
      m.position.set(e.x, 0.9, e.z);
      m.scale.setScalar(1 + (20 - e.ticks) / 10);
      m.material.opacity = e.ticks / 20;
    });
    renderer.render(scene, camera);
  };
}
