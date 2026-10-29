import * as THREE from 'three';
import {EXPLOSION_SECONDS, HALF, NAMES, SHELL_R, WALLS} from './config.js';
import {makeTank} from './tankmodel.js';

const WALL_HEIGHT = 2;
const SHELL_HEIGHT = 0.95;
const CAMERA = new THREE.Vector3(0, 36, 26);
const AIM = new THREE.Vector3(0, 0, 1.5);

const box = (w, h, d, x, z, color) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({color}));
  mesh.position.set(x, h / 2, z);
  return mesh;
};

/** Builds the scene in canvasParent and returns draw(g). */
export function createView(canvasParent) {
  const renderer = new THREE.WebGLRenderer();
  canvasParent.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1d2330);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-10, 30, 15);
  scene.add(new THREE.AmbientLight(0xffffff, 1.6), sun);

  const floor = box(2 * HALF.x, 0.2, 2 * HALF.z, 0, 0, 0x55604a);
  floor.position.y = -0.1;
  scene.add(floor);
  for (const w of WALLS) scene.add(box(w.width, WALL_HEIGHT, w.depth, w.x, w.z, 0x8a8f99));
  const wallColor = 0x6b7078;
  scene.add(
    box(2 * HALF.x + 2, WALL_HEIGHT, 1, 0, HALF.z + 0.5, wallColor), box(2 * HALF.x + 2, WALL_HEIGHT, 1, 0, -HALF.z - 0.5, wallColor),
    box(1, WALL_HEIGHT, 2 * HALF.z, HALF.x + 0.5, 0, wallColor), box(1, WALL_HEIGHT, 2 * HALF.z, -HALF.x - 0.5, 0, wallColor),
  );

  const models = {player: makeTank(0x2f6df0), computer: makeTank(0xe0412f)};
  scene.add(...Object.values(models));

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  const shellGeometry = new THREE.SphereGeometry(SHELL_R, 12, 8);
  const shellMaterial = new THREE.MeshBasicMaterial({color: 0xffe066});
  const blastGeometry = new THREE.SphereGeometry(1, 12, 8);
  const meshes = new Map();

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.copy(AIM).addScaledVector(CAMERA.clone().sub(AIM), Math.max(1, 1.6 / camera.aspect));
    camera.lookAt(AIM);
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  /** The mesh for a shell or explosion object; made on first sight, dropped when the object is gone. */
  const live = new Set();
  const sync = (objects, make, place) => {
    for (const o of objects) {
      if (!meshes.has(o)) {
        const m = make();
        meshes.set(o, m);
        scene.add(m);
      }
      place(meshes.get(o), o);
      live.add(o);
    }
  };

  let drawn = '';
  const draw = g => {
    // Software rendering is slow; a paused, unchanged game need not be redrawn.
    const view = JSON.stringify([g.tick, g.tanks, g.shells.length, window.innerWidth, window.innerHeight]);
    if (view === drawn) return;
    drawn = view;
    for (const name of NAMES) {
      const t = g.tanks[name];
      models[name].position.set(t.x, 0, t.z);
      models[name].rotation.y = -t.heading * Math.PI / 180;
    }
    live.clear();
    sync(g.shells, () => new THREE.Mesh(shellGeometry, shellMaterial), (m, s) => m.position.set(s.x, SHELL_HEIGHT, s.z));
    sync(g.explosions, () => new THREE.Mesh(blastGeometry, new THREE.MeshBasicMaterial({color: 0xff8a2b, transparent: true})), (m, e) => {
      const k = e.age / EXPLOSION_SECONDS;
      m.position.set(e.x, SHELL_HEIGHT, e.z);
      m.scale.setScalar(0.4 + 1.4 * k);
      m.material.opacity = 1 - k;
    });
    for (const [o, m] of meshes) {
      if (live.has(o)) continue;
      scene.remove(m);
      meshes.delete(o);
      if (m.material.transparent) m.material.dispose();
    }
    renderer.render(scene, camera);
  };
  return draw;
}
