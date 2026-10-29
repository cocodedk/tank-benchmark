import * as THREE from "three";
import { ARENA, WALLS } from "./sim.js";

const WALL_H = 1.5;
const WALL_T = 1;
const SHELL_Y = 0.8;
const BLAST_LIFE = 0.4;
const TEAM = { player: 0x2f6fde, computer: 0xd23c3c };

function at(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  return mesh;
}

function makeTank(color) {
  const paint = new THREE.MeshLambertMaterial({ color });
  const track = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const steel = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const group = new THREE.Group();
  group.add(
    at(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 1.6), paint), 0, 0.3, 0),
    at(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.35), track), 0, 0.25, -0.95),
    at(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.35), track), 0, 0.25, 0.95),
    at(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.35, 16), paint), 0, 0.775, 0),
  );
  const barrel = at(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.3, 8), steel), 0.9, 0.775, 0);
  barrel.rotation.z = Math.PI / 2;
  group.add(barrel);
  return group;
}

// Grows the pool on demand, shows the first items.length meshes and hides the rest.
function syncPool(scene, pool, items, make, apply) {
  while (pool.length < items.length) {
    const mesh = make();
    pool.push(mesh);
    scene.add(mesh);
  }
  pool.forEach((mesh, i) => {
    mesh.visible = i < items.length;
    if (mesh.visible) apply(mesh, items[i]);
  });
}

export function createView(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9bb7d0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(10, 30, 12);
  scene.add(sun);

  // Floor and walls.
  const hw = ARENA.width / 2;
  const hd = ARENA.depth / 2;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA.width, ARENA.depth),
    new THREE.MeshLambertMaterial({ color: 0x6b8f4e }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const wallMat = new THREE.MeshLambertMaterial({ color: 0x8a8580 });
  const addWall = (x, z, width, depth) => scene.add(at(new THREE.Mesh(new THREE.BoxGeometry(width, WALL_H, depth), wallMat), x, WALL_H / 2, z));
  addWall(0, hd + WALL_T / 2, ARENA.width + 2 * WALL_T, WALL_T);
  addWall(0, -(hd + WALL_T / 2), ARENA.width + 2 * WALL_T, WALL_T);
  addWall(hw + WALL_T / 2, 0, WALL_T, ARENA.depth + WALL_T);
  addWall(-(hw + WALL_T / 2), 0, WALL_T, ARENA.depth + WALL_T);
  for (const w of WALLS) addWall(w.x, w.z, w.width, w.depth);

  // Camera fits the whole arena in view.
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 34, 26);
  camera.lookAt(0, 0, 0);

  function fit() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Back the camera off on narrow windows so the arena's full width stays in view.
    const back = Math.max(1, 1.6 / camera.aspect);
    camera.position.set(0, 34, 26).multiplyScalar(back);
    camera.far = 200 * back;
    camera.updateProjectionMatrix();
  }
  fit();
  window.addEventListener("resize", fit);

  // Tanks.
  const tanks = { player: makeTank(TEAM.player), computer: makeTank(TEAM.computer) };
  scene.add(tanks.player, tanks.computer);

  // Shell and blast pools.
  const shellGeo = new THREE.SphereGeometry(0.25, 12, 8);
  const shellMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const blastGeo = new THREE.SphereGeometry(1, 16, 12);
  const shellPool = [];
  const blastPool = [];

  // HUD elements, looked up once.
  const hp = { player: document.getElementById("hp-player"), computer: document.getElementById("hp-computer") };
  const scoreEl = document.getElementById("score");
  const roundEl = document.getElementById("round");
  const bannerEl = document.getElementById("banner");

  return function render(game) {
    for (const key of ["player", "computer"]) {
      const t = game.tanks[key];
      const g = tanks[key];
      g.position.set(t.x, 0, t.z);
      g.rotation.y = (-t.heading * Math.PI) / 180;
      hp[key].style.width = `${t.health}%`;
    }

    syncPool(scene, shellPool, game.shells, () => new THREE.Mesh(shellGeo, shellMat), (mesh, s) => {
      mesh.position.set(s.x, SHELL_Y, s.z);
    });

    syncPool(
      scene,
      blastPool,
      game.blasts,
      () => new THREE.Mesh(blastGeo, new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true })),
      (mesh, b) => {
        const t = Math.min(Math.max(b.age / BLAST_LIFE, 0), 1);
        mesh.position.set(b.x, SHELL_Y, b.z);
        mesh.scale.setScalar(0.5 + 1.5 * t);
        mesh.material.opacity = 1 - t;
      },
    );

    scoreEl.textContent = `You ${game.score.player} – ${game.score.computer} Computer`;
    roundEl.textContent = `Round ${game.round}`;
    const over = game.state === "round_over";
    bannerEl.style.display = over ? "block" : "none";
    if (over) bannerEl.textContent = game.banner;

    renderer.render(scene, camera);
  };
}
