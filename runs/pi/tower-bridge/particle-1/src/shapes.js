/* Small drawing helpers shared by the scene. All drawing happens in CSS pixels. */

export function screenRect(cam, w, h, x, y, rw, rh) {
  const [sx, sy] = cam.toScreen(x, y, w, h);
  const [ex, ey] = cam.toScreen(x + rw, y + rh, w, h);
  return [sx, sy, ex - sx, ey - sy];
}

export function fillWorldRect(ctx, cam, w, h, x, y, rw, rh, fill) {
  const [sx, sy, sw, sh] = screenRect(cam, w, h, x, y, rw, rh);
  ctx.fillStyle = fill;
  ctx.fillRect(sx, sy, sw, sh);
}

export function worldLine(ctx, cam, w, h, x1, y1, x2, y2) {
  const [ax, ay] = cam.toScreen(x1, y1, w, h);
  const [bx, by] = cam.toScreen(x2, y2, w, h);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
}

/* A pointed Gothic arch, filled with the current style. */
export function archPath(ctx, cam, w, h, cx, bottom, half, height, spring = 0.55) {
  const S = (x, y) => cam.toScreen(x, y, w, h);
  const springY = bottom - height * spring;
  const apexY = bottom - height;
  const [x0, y0] = S(cx - half, bottom);
  const [x1, y1] = S(cx - half, springY);
  const [c1x, c1y] = S(cx - half, apexY + height * 0.2);
  const [ax, ay] = S(cx, apexY);
  const [c2x, c2y] = S(cx + half, apexY + height * 0.2);
  const [x2, y2] = S(cx + half, springY);
  const [x3, y3] = S(cx + half, bottom);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.quadraticCurveTo(c1x, c1y, ax, ay);
  ctx.quadraticCurveTo(c2x, c2y, x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
}

/* A stone block with a light-left / shadow-right gradient and a shaded base. */
export function stonePanel(ctx, cam, w, h, box, tone = {}) {
  const { light = "#d9cdb2", mid = "#c7b795", dark = "#a59474" } = tone;
  const [sx, sy, sw, sh] = screenRect(cam, w, h, box.x, box.y, box.w, box.h);
  const g = ctx.createLinearGradient(sx, 0, sx + sw, 0);
  g.addColorStop(0, light);
  g.addColorStop(0.42, mid);
  g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.fillRect(sx, sy, sw, sh);
  const shade = ctx.createLinearGradient(0, sy, 0, sy + sh);
  shade.addColorStop(0, "rgba(255,255,255,0.10)");
  shade.addColorStop(0.6, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(52,39,22,0.22)");
  ctx.fillStyle = shade;
  ctx.fillRect(sx, sy, sw, sh);
}

/* Courses of masonry, drawn only once they are big enough on screen. */
export function masonry(ctx, cam, w, h, box, { row = 18, col = 38, stroke = "rgba(74,60,38,0.16)" } = {}) {
  const s = cam.scale(w, h);
  if (row * s < 5) return;
  const [sx, sy, sw, sh] = screenRect(cam, w, h, box.x, box.y, box.w, box.h);
  if (sw < 2 || sh < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(sx, sy, sw, sh);
  ctx.clip();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  let course = 0;
  for (let y = box.y + row; y < box.y + box.h; y += row, course++) {
    worldLine(ctx, cam, w, h, box.x, y, box.x + box.w, y);
    ctx.stroke();
    const offset = (course % 2) * (col / 2);
    for (let x = box.x + offset; x < box.x + box.w; x += col) {
      worldLine(ctx, cam, w, h, x, y, x, y + row);
      ctx.stroke();
    }
  }
  ctx.restore();
}
