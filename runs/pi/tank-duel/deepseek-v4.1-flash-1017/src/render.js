import * as THREE from 'three';
import { DEG, SHELL } from './constants.js';
import { buildArena } from './arena.js';
import { createTank } from './tankModel.js';

export function createView(canvas, game) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  buildArena(scene);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 38, 34);
  camera.lookAt(0, 0, 0);

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / Math.max(height, 1);
    renderer.setSize(width, height);
    camera.aspect = aspect;
    // Keep the whole 40 x 30 arena in view when the window is narrow.
    camera.fov = aspect >= 1.6
      ? 45
      : (2 * Math.atan(Math.tan(22.5 * Math.PI / 180) * 1.6 / aspect) * 180) / Math.PI;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  const tanks = {
    player: createTank(0x3b82f6),
    computer: createTank(0xef4444),
  };
  scene.add(tanks.player, tanks.computer);

  const shellGeometry = new THREE.SphereGeometry(SHELL.radius, 10, 8);
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: 0xff9500,
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  const shellMeshes = new Map();

  const burstGeometry = new THREE.SphereGeometry(0.45, 10, 8);
  const explosions = [];

  function syncShells() {
    const seen = new Set();
    for (const shell of game.shells) {
      seen.add(shell.id);
      let mesh = shellMeshes.get(shell.id);
      if (!mesh) {
        mesh = new THREE.Mesh(shellGeometry, shellMaterial);
        mesh.position.y = 0.8;
        scene.add(mesh);
        shellMeshes.set(shell.id, mesh);
      }
      mesh.position.x = shell.x;
      mesh.position.z = shell.z;
    }
    for (const [id, mesh] of shellMeshes) {
      if (seen.has(id)) continue;
      scene.remove(mesh);
      shellMeshes.delete(id);
    }
  }

  function spawnExplosion(x, z) {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffa733,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(burstGeometry, material);
    mesh.position.set(x, 0.85, z);
    scene.add(mesh);
    explosions.push({ mesh, life: 0.38, max: 0.38 });
  }

  function updateExplosions(dt) {
    for (let i = explosions.length - 1; i >= 0; i -= 1) {
      const burst = explosions[i];
      burst.life -= dt;
      if (burst.life <= 0) {
        scene.remove(burst.mesh);
        burst.mesh.material.dispose();
        explosions.splice(i, 1);
        continue;
      }
      const progress = 1 - burst.life / burst.max;
      burst.mesh.scale.setScalar(1 + progress * 3);
      burst.mesh.material.opacity = 1 - progress;
    }
  }

  function update(dt) {
    for (const name of ['player', 'computer']) {
      const tank = game.tanks[name];
      tanks[name].position.set(tank.x, 0, tank.z);
      tanks[name].rotation.y = -tank.heading * DEG;
    }

    syncShells();
    for (const hit of game.drainHits()) spawnExplosion(hit.x, hit.z);
    updateExplosions(dt);
    renderer.render(scene, camera);
  }

  return { renderer, scene, camera, update };
}
