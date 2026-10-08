// The three.js scene: floor, walls, two tanks, shells and explosions, seen from a fixed camera.
import * as THREE from 'three';
import { HALF_X, HALF_Z, SHELL_R, WALLS } from './arena.js';
import { makeTank } from './models.js';
import { rad } from './tank.js';

const WALL_H = 1.5;
const mat = color => new THREE.MeshLambertMaterial({ color });

export function createView() {
  const renderer = new THREE.WebGLRenderer();
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b2430);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-10, 30, 15);
  scene.add(new THREE.AmbientLight(0xffffff, 1.2), sun);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALF_X, 2 * HALF_Z), mat(0x4d5b46));
  floor.rotation.x = -Math.PI / 2;
  const block = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, d), mat(0x8a8a8a));
    m.position.set(x, WALL_H / 2, z);
    return m;
  };
  scene.add(floor,
    block(2 * HALF_X + 2, 1, 0, -HALF_Z - 0.5), block(2 * HALF_X + 2, 1, 0, HALF_Z + 0.5),
    block(1, 2 * HALF_Z, -HALF_X - 0.5, 0), block(1, 2 * HALF_Z, HALF_X + 0.5, 0),
    ...WALLS.map(w => block(w.width, w.depth, w.x, w.z)));

  const tanks = { player: makeTank(0x2f6fe0), computer: makeTank(0xd63a3a) };
  scene.add(tanks.player, tanks.computer);

  const camera = new THREE.PerspectiveCamera(45, 1, 1, 200);
  const resize = () => {
    const aspect = innerWidth / innerHeight, dist = Math.max(48, 70 / aspect);
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = aspect;
    camera.position.set(0, 0.8 * dist, 0.6 * dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };
  const draw = () => renderer.render(scene, camera);
  addEventListener('resize', () => { resize(); draw(); });
  resize();

  const shellGeo = new THREE.SphereGeometry(SHELL_R, 8, 8), boomGeo = new THREE.SphereGeometry(1, 10, 10);
  const shellMat = mat(0xffe08a), boomMat = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true });
  const pools = { shells: [], booms: [] };
  // Keep one mesh per item in the list, adding or dropping meshes as the list changes length.
  const sync = (pool, items, make, put) => {
    while (pool.length < items.length) { const m = make(); scene.add(m); pool.push(m); }
    while (pool.length > items.length) scene.remove(pool.pop());
    items.forEach((item, i) => put(pool[i], item));
  };

  return function render(game) {
    for (const name of Object.keys(tanks)) {
      const t = game.tanks[name];
      tanks[name].position.set(t.x, 0, t.z);
      tanks[name].rotation.y = -rad(t.heading);
    }
    sync(pools.shells, game.shells, () => new THREE.Mesh(shellGeo, shellMat), (m, s) => m.position.set(s.x, 1.0, s.z));
    sync(pools.booms, game.explosions, () => new THREE.Mesh(boomGeo, boomMat.clone()), (m, e) => {
      m.position.set(e.x, 1.0, e.z);
      m.scale.setScalar(0.4 + e.age * 0.07);
      m.material.opacity = 1 - e.age / 20;
    });
    draw();
  };
}
