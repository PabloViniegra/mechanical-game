import { view } from '../core/view.js';
import { seeded } from '../core/utils.js';
import { PALETTE as C } from '../data/palette.js';
import { SPRITES } from './sprites.js';
import { ditherFill, disc } from './pixel.js';

// Pocos elementos y una sola silueta: la niebla del horizonte da la profundidad.
const SKY = [C.ink, C.night, C.slate];
const GROUND = [C.slate, C.night, C.ink];
const SILHOUETTE = C.ink;

// Bandas planas con una franja estrecha de tramado entre colores, en lugar de
// un degradado tramado de punta a punta que llena la pantalla de ajedrez.
function banded(v, colors) {
  const last = colors.length - 1;
  const x = Math.min(1, Math.max(0, v)) * last;
  const i = Math.min(last - 1, Math.floor(x));
  const t = Math.min(1, Math.max(0, (x - i - 0.5) * 4 + 0.5));
  return (i + t) / last;
}

export function paintBackground(canvas) {
  const { w, h, horizon, barricadeX } = view;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const r = seeded(1337);

  // Cielo que se aclara hacia el horizonte; el suelo se oscurece hacia el jugador.
  const img = ctx.createImageData(w, h);
  ditherFill(img, 0, horizon, SKY, (x, y) => banded((y / horizon) ** 1.6, SKY));
  ditherFill(img, horizon, h, GROUND, (x, y) => banded((y - horizon) / (h - horizon), GROUND));
  ctx.putImageData(img, 0, 0);

  // Luna baja, medio tapada por la ciudad.
  const moon = { x: Math.round(w * 0.7), y: Math.round(horizon * 0.62), r: Math.max(8, Math.round(h * 0.09)) };
  disc(ctx, moon.x, moon.y, moon.r, C.dust);
  disc(ctx, moon.x - 1, moon.y - 1, moon.r - 1, C.bone);
  for (let i = 0; i < 3; i++) {
    const cr = 1 + Math.floor(r() * moon.r * 0.3);
    disc(ctx, moon.x + Math.round((r() - 0.5) * moon.r), moon.y + Math.round((r() - 0.5) * moon.r), cr, C.dust);
  }

  for (let i = 0; i < w * 0.06; i++) {
    const x = Math.floor(r() * w);
    const y = Math.floor(r() * horizon * 0.45);
    if (Math.hypot(x - moon.x, y - moon.y) < moon.r * 1.6) continue;
    ctx.fillStyle = r() < 0.25 ? C.dust : C.moss;
    ctx.fillRect(x, y, 1, 1);
  }

  // Ciudad en ruinas
  let x = 0;
  while (x < w) {
    const bw = 8 + Math.floor(r() * 18);
    const bh = 8 + Math.floor(r() * horizon * 0.36);
    const top = horizon - bh;
    ctx.fillStyle = SILHOUETTE;
    ctx.fillRect(x, top, bw - 1, bh);
    if (r() < 0.3) ctx.fillRect(x + Math.floor(bw / 2), top - 4, 1, 4);
    if (r() < 0.4) ctx.fillRect(x + bw - 4, top - 2, 3, 2);
    // Muy pocas ventanas encendidas: casi toda la ciudad está muerta.
    for (let wy = top + 2; wy < horizon - 3; wy += 3) {
      for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
        if (r() < 0.025) {
          ctx.fillStyle = C.ember;
          ctx.fillRect(wx, wy, 1, 1);
        }
      }
    }
    x += bw;
  }

  // Verja del cementerio
  ctx.fillStyle = SILHOUETTE;
  ctx.fillRect(0, horizon - 4, w, 1);
  for (let fx = 0; fx < w; fx += 3) {
    ctx.fillRect(fx, horizon - 6, 1, 7);
    if ((fx / 3) % 2 === 0) ctx.fillRect(fx, horizon - 7, 1, 1);
  }

  // Lápidas y cruces
  for (let i = 0; i < Math.floor(w / 30); i++) {
    const s = r() < 0.7 ? SPRITES.tomb : SPRITES.cross;
    const tx = Math.floor(barricadeX + 20 + r() * (w - barricadeX - 30));
    const ty = horizon + 2 + Math.floor(r() * 16);
    ctx.drawImage(s, tx, ty - s.height);
  }

  // Matojos y piedras escasos, más densos cerca del horizonte.
  for (let i = 0; i < w * h * 0.004; i++) {
    const gx = Math.floor(r() * w);
    const gy = horizon + 2 + Math.floor((r() ** 1.5) * (h - horizon));
    if (r() < 0.7) {
      ctx.fillStyle = C.moss;
      ctx.fillRect(gx, gy, 1, 2);
      ctx.fillRect(gx + 2, gy + 1, 1, 1);
      ctx.fillStyle = C.lichen;
      ctx.fillRect(gx + 1, gy - 1, 1, 3);
    } else {
      ctx.fillStyle = C.earth;
      ctx.fillRect(gx, gy, 2, 1);
      ctx.fillStyle = C.mud;
      ctx.fillRect(gx, gy - 1, 1, 1);
    }
  }
}
