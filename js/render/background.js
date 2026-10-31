import { view } from '../core/view.js';
import { seeded } from '../core/utils.js';
import { PALETTE as C } from '../data/palette.js';
import { SPRITES } from './sprites.js';
import { ditherFill, disc } from './pixel.js';

// Bandas planas con una franja estrecha de tramado entre colores, en lugar de
// un degradado tramado de punta a punta que llena la pantalla de ajedrez.
function banded(v, colors) {
  const last = colors.length - 1;
  const x = Math.min(1, Math.max(0, v)) * last;
  const i = Math.min(last - 1, Math.floor(x));
  const t = Math.min(1, Math.max(0, (x - i - 0.5) * 4 + 0.5));
  return (i + t) / last;
}

// Cada silueta rellena el horizonte con su propio perfil.
const SKYLINES = {
  city(ctx, r, map) {
    const { w, horizon } = view;
    let x = 0;
    while (x < w) {
      const bw = 8 + Math.floor(r() * 18);
      const bh = 8 + Math.floor(r() * horizon * 0.36);
      const top = horizon - bh;
      ctx.fillStyle = map.silhouette;
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
  },

  forest(ctx, r, map) {
    const { w, horizon } = view;
    ctx.fillStyle = map.silhouette;
    ctx.fillRect(0, horizon - 2, w, 2);
    for (let x = 2; x < w; x += 6 + Math.floor(r() * 8)) {
      const th = 12 + Math.floor(r() * horizon * 0.34);
      const top = horizon - th;
      ctx.fillRect(x, top, 2, th);
      for (let b = 0; b < 3; b++) {
        const by = top + 2 + Math.floor(r() * th * 0.6);
        const len = 3 + Math.floor(r() * 5);
        const dir = r() < 0.5 ? -1 : 1;
        for (let k = 1; k <= len; k++) ctx.fillRect(x + (dir > 0 ? 1 + k : 1 - k), by - Math.floor(k / 2), 1, 1);
      }
    }
  },

  dunes(ctx, r, map) {
    const { w, horizon } = view;
    ctx.fillStyle = map.silhouette;
    const phase = r() * 6;
    for (let x = 0; x < w; x++) {
      const h = 5 + Math.round(3 * Math.sin(x / 17 + phase) + 2 * Math.sin(x / 7 + phase * 2));
      ctx.fillRect(x, horizon - h, 1, h);
    }
    for (let x = 12; x < w; x += 22 + Math.floor(r() * 30)) {
      const ph = 10 + Math.floor(r() * 10);
      ctx.fillRect(x, horizon - ph - 6, 1, ph);
      ctx.fillRect(x - 2, horizon - ph - 4, 5, 1);
    }
  },

  peaks(ctx, r, map) {
    const { w, horizon } = view;
    ctx.fillStyle = map.silhouette;
    let x = -4;
    while (x < w) {
      const pw = 14 + Math.floor(r() * 22);
      const ph = 8 + Math.floor(r() * horizon * 0.36);
      for (let i = 0; i < pw; i++) {
        const h = Math.round(ph * (1 - Math.abs(i - pw / 2) / (pw / 2)));
        ctx.fillRect(x + i, horizon - h, 1, h);
      }
      x += Math.floor(pw * 0.7);
    }
  },
};

export function paintBackground(canvas, map) {
  const { w, h, horizon, barricadeX } = view;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const r = seeded(1337);
  const { sky, ground } = map;

  // Cielo que se aclara hacia el horizonte; el suelo se oscurece hacia el jugador.
  const img = ctx.createImageData(w, h);
  ditherFill(img, 0, horizon, sky, (x, y) => banded((y / horizon) ** 1.6, sky));
  ditherFill(img, horizon, h, ground, (x, y) => banded((y - horizon) / (h - horizon), ground));
  ctx.putImageData(img, 0, 0);

  // Luna baja, medio tapada por la silueta del horizonte.
  const moon = { x: Math.round(w * 0.7), y: Math.round(horizon * 0.62), r: Math.max(8, Math.round(h * 0.09)) };
  disc(ctx, moon.x, moon.y, moon.r, map.orb.outer);
  disc(ctx, moon.x - 1, moon.y - 1, moon.r - 1, map.orb.inner);
  for (let i = 0; i < 3; i++) {
    const cr = 1 + Math.floor(r() * moon.r * 0.3);
    disc(ctx, moon.x + Math.round((r() - 0.5) * moon.r), moon.y + Math.round((r() - 0.5) * moon.r), cr, map.orb.outer);
  }

  for (let i = 0; i < w * 0.06; i++) {
    const x = Math.floor(r() * w);
    const y = Math.floor(r() * horizon * 0.45);
    if (Math.hypot(x - moon.x, y - moon.y) < moon.r * 1.6) continue;
    ctx.fillStyle = r() < 0.25 ? map.orb.outer : map.orb.inner;
    ctx.fillRect(x, y, 1, 1);
  }

  SKYLINES[map.skyline](ctx, r, map);

  if (map.fence) {
    ctx.fillStyle = map.silhouette;
    ctx.fillRect(0, horizon - 4, w, 1);
    for (let fx = 0; fx < w; fx += 3) {
      ctx.fillRect(fx, horizon - 6, 1, 7);
      if ((fx / 3) % 2 === 0) ctx.fillRect(fx, horizon - 7, 1, 1);
    }
  }

  // Lápidas y cruces, o rocas donde no hay cementerio.
  for (let i = 0; i < Math.floor(w / 30); i++) {
    const tx = Math.floor(barricadeX + 20 + r() * (w - barricadeX - 30));
    const ty = horizon + 2 + Math.floor(r() * 16);
    if (map.props) {
      const s = SPRITES[r() < 0.7 ? map.props[0] : map.props[1]];
      ctx.drawImage(s, tx, ty - s.height);
    } else {
      ctx.fillStyle = map.silhouette;
      ctx.fillRect(tx, ty - 3, 5, 3);
      ctx.fillRect(tx + 1, ty - 4, 3, 1);
      ctx.fillStyle = map.ground[0];
      ctx.fillRect(tx + 1, ty - 3, 2, 1);
    }
  }

  // Matojos y piedras escasos, más densos cerca del horizonte.
  for (let i = 0; i < w * h * 0.004; i++) {
    const gx = Math.floor(r() * w);
    const gy = horizon + 2 + Math.floor((r() ** 1.5) * (h - horizon));
    if (r() < 0.7) {
      ctx.fillStyle = map.grass[0];
      ctx.fillRect(gx, gy, 1, 2);
      ctx.fillRect(gx + 2, gy + 1, 1, 1);
      ctx.fillStyle = map.grass[1];
      ctx.fillRect(gx + 1, gy - 1, 1, 3);
    } else {
      ctx.fillStyle = C.earth;
      ctx.fillRect(gx, gy, 2, 1);
      ctx.fillStyle = C.mud;
      ctx.fillRect(gx, gy - 1, 1, 1);
    }
  }
}
