import { ARENA, WALLS } from './config.js';

const HX = ARENA.width / 2;
const HZ = ARENA.depth / 2;

/** Every wall a circle of radius r at (x, z) overlaps: [{nx, nz, depth}], n points away from the wall. */
export function contacts(x, z, r) {
  const out = [];
  for (const w of WALLS) {
    const hx = w.width / 2, hz = w.depth / 2;
    const dx = x - Math.max(w.x - hx, Math.min(x, w.x + hx));
    const dz = z - Math.max(w.z - hz, Math.min(z, w.z + hz));
    const d = Math.hypot(dx, dz);
    if (d >= r) continue;
    if (d > 0) {
      out.push({ nx: dx / d, nz: dz / d, depth: r - d });
    } else if (hx - Math.abs(x - w.x) < hz - Math.abs(z - w.z)) {
      out.push({ nx: Math.sign(x - w.x) || 1, nz: 0, depth: r + hx - Math.abs(x - w.x) });
    } else {
      out.push({ nx: 0, nz: Math.sign(z - w.z) || 1, depth: r + hz - Math.abs(z - w.z) });
    }
  }
  if (x - r < -HX) out.push({ nx: 1, nz: 0, depth: -HX - (x - r) });
  if (x + r > HX) out.push({ nx: -1, nz: 0, depth: x + r - HX });
  if (z - r < -HZ) out.push({ nx: 0, nz: 1, depth: -HZ - (z - r) });
  if (z + r > HZ) out.push({ nx: 0, nz: -1, depth: z + r - HZ });
  return out;
}

/** True when a circle of radius r travelling from a to b touches no wall. */
export function clearLine(a, b, r) {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.25));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (contacts(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, r).length) return false;
  }
  return true;
}
