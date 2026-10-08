import * as THREE from 'three';
import { ARENA, EXPLOSION_TIME, SHELL_RADIUS, WALLS } from './config.js';
import { buildArena, buildTank } from './models.js';

const FOV = 40;
const LOOK = new THREE.Vector3(0, 0.8, 0.6); // from the arena centre toward the camera

export function createView(g) {
  const renderer = new THREE.WebGLRenderer();
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1d2330);
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-10, 30, 15);
  scene.add(new THREE.AmbientLight(0xffffff, 0.8), sun);
  buildArena(scene, ARENA, WALLS);
  const camera = new THREE.PerspectiveCamera(FOV);
  const tanks = { player: buildTank(0x2f6fdb), computer: buildTank(0xd63a3a) };
  scene.add(tanks.player, tanks.computer);
  const shellMesh = new THREE.Mesh(new THREE.SphereGeometry(SHELL_RADIUS, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
  const boomMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff9f1c, transparent: true, opacity: 0.8 }));
  const shells = [], booms = [];

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    // Far enough back that the nearest corner of the arena still fits, whatever the window's shape.
    const tanV = Math.tan((FOV / 2) * (Math.PI / 180));
    camera.position.copy(LOOK).multiplyScalar(10 + Math.max(14.5 / tanV, 22.5 / (tanV * camera.aspect)));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  /** Keep `pool` the same length as `items`, one clone of `proto` each; extras are hidden. */
  function sync(pool, items, proto, place) {
    while (pool.length < items.length) {
      const mesh = proto.clone();
      scene.add(mesh);
      pool.push(mesh);
    }
    pool.forEach((mesh, i) => {
      mesh.visible = i < items.length;
      if (mesh.visible) place(mesh, items[i]);
    });
  }

  return function render() {
    for (const name of ['player', 'computer']) {
      const t = g.tanks[name];
      tanks[name].position.set(t.x, 0, t.z);
      tanks[name].rotation.y = -(t.heading * Math.PI) / 180;
      tanks[name].visible = t.health > 0;
    }
    sync(shells, g.shells, shellMesh, (m, s) => m.position.set(s.x, 1.1, s.z));
    sync(booms, g.explosions, boomMesh, (m, e) => {
      m.position.set(e.x, 1.1, e.z);
      m.scale.setScalar(0.4 + (1.2 * e.age) / EXPLOSION_TIME);
    });
    renderer.render(scene, camera);
  };
}
