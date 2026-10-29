import * as THREE from 'three';
import { ARENA, WALLS } from './constants.js';

const box = (w, h, d, color) => new THREE.Mesh(
  new THREE.BoxGeometry(w, h, d),
  new THREE.MeshLambertMaterial({ color }),
);

function makeTank(color) {
  const group = new THREE.Group();
  const hull = box(2.4, 0.7, 1.8, color);
  hull.position.y = 0.6;
  group.add(hull);
  for (const side of [-1, 1]) {
    const track = box(2.5, 0.5, 0.35, 0x22262b);
    track.position.set(0, 0.3, side * 0.95);
    group.add(track);
  }
  const turret = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.7, 0.45, 12),
    new THREE.MeshLambertMaterial({ color }),
  );
  turret.position.y = 1.15;
  group.add(turret);
  const barrel = box(1.7, 0.18, 0.18, 0x2a2f36);
  barrel.position.set(1.3, 1.15, 0);
  group.add(barrel);
  return group;
}

export class SceneView {
  constructor(container) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e141b);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
    this.camera.position.set(0, 44, 40);
    this.camera.lookAt(0, 0, 0);
    this.addLights();
    this.addArena();
    this.player = makeTank(0x3b82f6);
    this.computer = makeTank(0xef4444);
    this.scene.add(this.player, this.computer);
    this.shellMeshes = new Map();
    this.effectMeshes = new Map();
    this.resize();
  }

  addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(12, 30, 10);
    this.scene.add(sun);
  }

  addArena() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA.width, ARENA.depth),
      new THREE.MeshLambertMaterial({ color: 0x34463a }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    const rail = 0xc8c2a8;
    for (const z of [-1, 1]) {
      const wall = box(ARENA.width + 1.2, 1.2, 0.6, rail);
      wall.position.set(0, 0.6, z * (ARENA.depth / 2 + 0.3));
      this.scene.add(wall);
    }
    for (const x of [-1, 1]) {
      const wall = box(0.6, 1.2, ARENA.depth + 1.2, rail);
      wall.position.set(x * (ARENA.width / 2 + 0.3), 0.6, 0);
      this.scene.add(wall);
    }
    for (const wall of WALLS) {
      const block = box(wall.width, 1.6, wall.depth, 0xb0a88c);
      block.position.set(wall.x, 0.8, wall.z);
      this.scene.add(block);
    }
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  syncShells(shells) {
    const live = new Set(shells.map((s) => s.id));
    for (const [id, mesh] of this.shellMeshes) {
      if (!live.has(id)) {
        this.scene.remove(mesh);
        this.shellMeshes.delete(id);
      }
    }
    for (const shell of shells) {
      let mesh = this.shellMeshes.get(shell.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 10, 8),
          new THREE.MeshLambertMaterial({ color: shell.owner === 'player' ? 0x9fd3ff : 0xffb4a8 }),
        );
        this.scene.add(mesh);
        this.shellMeshes.set(shell.id, mesh);
      }
      mesh.position.set(shell.x, 0.8, shell.z);
    }
  }

  syncEffects(effects) {
    const live = new Set(effects);
    for (const [effect, mesh] of this.effectMeshes) {
      if (!live.has(effect)) {
        this.scene.remove(mesh);
        this.effectMeshes.delete(effect);
      }
    }
    for (const effect of effects) {
      let mesh = this.effectMeshes.get(effect);
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.6, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xffc24a, transparent: true }),
        );
        this.scene.add(mesh);
        this.effectMeshes.set(effect, mesh);
      }
      const grow = 1 + (0.3 - effect.life) * 4;
      mesh.scale.setScalar(grow);
      mesh.material.opacity = Math.max(0, effect.life / 0.3);
      mesh.position.set(effect.x, 0.8, effect.z);
    }
  }

  sync(game) {
    const place = (group, tank) => {
      group.position.set(tank.x, 0, tank.z);
      group.rotation.y = (-tank.heading * Math.PI) / 180;
    };
    place(this.player, game.tanks.player);
    place(this.computer, game.tanks.computer);
    this.syncShells(game.shells);
    this.syncEffects(game.effects);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
