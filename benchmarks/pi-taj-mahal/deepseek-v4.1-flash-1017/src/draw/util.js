/* Shared palette, seeded noise and the two shapes everything else is built from. */

export const PAL = {
  skyTop: "#5f93cb",
  skyMid: "#9ec5e6",
  skyLow: "#d4e8f6",
  marble: "#f6f1e5",
  marbleMid: "#e9e2d1",
  marbleShade: "#d3cab7",
  marbleDeep: "#b3a992",
  shadow: "#80745f",
  ink: "#514434",
  bronze: "#5e4b2f",
  stone: "#b25a41",
  stoneDark: "#8e4432",
  grass: "#4f7c2e",
  grassDark: "#385c20",
  tree: "#2b4822",
  treeLight: "#3d622b",
  treeDark: "#1c3017",
  water: "#31534e",
  waterDeep: "#213b36",
};

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** mulberry32: the same leaves, stones and people on every redraw. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A pointed (four-centred-ish) arch, bottom-left at (x, y+h). */
export function archPath(ctx, x, y, w, h, spring = 0.45) {
  const cx = x + w / 2;
  const sy = y + h * (1 - spring);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, sy);
  ctx.bezierCurveTo(x, sy - h * 0.2, cx - w * 0.22, y + h * 0.16, cx, y);
  ctx.bezierCurveTo(cx + w * 0.22, y + h * 0.16, x + w, sy - h * 0.2, x + w, sy);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

export function marble(ctx, x, y, w, h, a = PAL.marble, b = PAL.marbleMid) {
  const g = ctx.createLinearGradient(x, y, x + w * 0.8, y + h);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

export function shadowEllipse(ctx, x, y, rx, ry, alpha = 0.25) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#23301f";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Fill a polygon given as [x, y] points. */
export function polygon(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}
