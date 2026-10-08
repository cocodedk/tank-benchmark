import * as THREE from 'three';
import { ARENA, WALLS, SHELL_RADIUS, FX_STEPS } from './config.js';
import { rad } from './geom.js';
import { tankModel } from './models.js';

const WALL_HEIGHT = 2;
const DIRECTION = new THREE.Vector3(0, 3, 2).normalize(); // from the arena's centre to the camera

export function createView(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b2330);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-10, 25, 15);
  scene.add(new THREE.AmbientLight(0xffffff, 1.4), sun);
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 300);

  const box = (w, h, d, x, y, z, color) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    mesh.position.set(x, y, z);
    scene.add(mesh);
  };
  const { width, depth } = ARENA;
  box(width, 0.4, depth, 0, -0.2, 0, 0x4a5d3a);
  box(width + 2, WALL_HEIGHT, 1, 0, WALL_HEIGHT / 2, -depth / 2 - 0.5, 0x6b6f76);
  box(width + 2, WALL_HEIGHT, 1, 0, WALL_HEIGHT / 2, depth / 2 + 0.5, 0x6b6f76);
  box(1, WALL_HEIGHT, depth, -width / 2 - 0.5, WALL_HEIGHT / 2, 0, 0x6b6f76);
  box(1, WALL_HEIGHT, depth, width / 2 + 0.5, WALL_HEIGHT / 2, 0, 0x6b6f76);
  for (const w of WALLS) box(w.width, WALL_HEIGHT, w.depth, w.x, WALL_HEIGHT / 2, w.z, 0x8a8f98);

  const models = { player: tankModel(0x2f6fdf), computer: tankModel(0xd8403a) };
  scene.add(models.player, models.computer);
  const shellGeometry = new THREE.SphereGeometry(SHELL_RADIUS, 8, 6);
  const shellMaterial = new THREE.MeshLambertMaterial({ color: 0xffe08a });
  const blastGeometry = new THREE.SphereGeometry(1, 10, 8);
  const blastMaterial = new THREE.MeshBasicMaterial({ color: 0xff9a2e, transparent: true, opacity: 0.8 });
  const pool = (make) => {
    const meshes = [];
    return (items, apply) => {
      while (meshes.length < items.length) scene.add(meshes[meshes.length] = make());
      meshes.forEach((m, i) => {
        m.visible = i < items.length;
        if (m.visible) apply(m, items[i]);
      });
    };
  };
  const shells = pool(() => new THREE.Mesh(shellGeometry, shellMaterial));
  const blasts = pool(() => new THREE.Mesh(blastGeometry, blastMaterial));

  // Moves the camera along DIRECTION until every corner of the walled arena is in view.
  const corners = [-1, 1].flatMap((sx) => [0, WALL_HEIGHT].flatMap((y) => [-1, 1].map((sz) => new THREE.Vector3(sx * (width / 2 + 1), y, sz * (depth / 2 + 1)))));
  function fit() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.position.copy(DIRECTION);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const ty = Math.tan(rad(camera.fov / 2));
    const tx = ty * camera.aspect;
    let distance = 1;
    for (const c of corners) {
      const p = c.clone().applyMatrix4(camera.matrixWorldInverse);
      distance = Math.max(distance, 1 + 1.05 * Math.max(Math.abs(p.x) / tx, Math.abs(p.y) / ty) + p.z);
    }
    camera.position.copy(DIRECTION).multiplyScalar(distance);
    camera.lookAt(0, 0, 0);
  }
  let seen = -1; // the last g.tick drawn
  fit();
  window.addEventListener('resize', () => {
    fit();
    seen = -1;
  });

  return function draw(g) {
    if (g.tick === seen) return;
    seen = g.tick;
    for (const name of Object.keys(models)) {
      const t = g.tanks[name];
      models[name].position.set(t.x, 0, t.z);
      models[name].rotation.y = -rad(t.heading);
      models[name].visible = t.health > 0;
    }
    shells(g.shells, (m, s) => m.position.set(s.x, 1, s.z));
    blasts(g.fx, (m, e) => {
      m.position.set(e.x, 1, e.z);
      m.scale.setScalar(0.4 + (1.2 * e.age) / FX_STEPS);
    });
    renderer.render(scene, camera);
  };
}
