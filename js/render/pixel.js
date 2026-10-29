// Primitivas de dibujo sin antialiasing para la resolución interna.

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Rellena una región de ImageData con un degradado de paleta y tramado ordenado.
// valueAt(x, y) devuelve 0..1 y elige entre colores consecutivos.
export function ditherFill(img, y0, y1, colors, valueAt) {
  const rgb = colors.map(hexToRgb);
  const last = rgb.length - 1;
  const { data, width } = img;
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < width; x++) {
      const v = Math.min(1, Math.max(0, valueAt(x, y))) * last;
      let i = Math.floor(v);
      if (i < last && v - i > BAYER[(y & 3) * 4 + (x & 3)]) i++;
      const c = rgb[i];
      const k = (y * width + x) * 4;
      data[k] = c[0];
      data[k + 1] = c[1];
      data[k + 2] = c[2];
      data[k + 3] = 255;
    }
  }
}

export function line(ctx, x0, y0, x1, y1, color) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  ctx.fillStyle = color;
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function disc(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}

// Marco con esquinas en escalón para el texto superpuesto (u = tamaño de píxel).
export function pixelBox(ctx, x, y, w, h, u, fill, border) {
  ctx.fillStyle = border;
  ctx.fillRect(x + u, y, w - 2 * u, h);
  ctx.fillRect(x, y + u, w, h - 2 * u);
  ctx.fillStyle = fill;
  ctx.fillRect(x + u, y + u, w - 2 * u, h - 2 * u);
}

const patterns = new Map();

// Patrón 4x4 con `amount` (0..1) de píxeles encendidos según la matriz de Bayer.
// Sustituye a la transparencia: mezclar con alfa crearía tonos fuera de la paleta.
export function ditherPattern(ctx, color, amount) {
  const level = Math.round(Math.min(1, Math.max(0, amount)) * 16);
  const key = `${color}:${level}`;
  let pattern = patterns.get(key);
  if (!pattern) {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 4;
    const g = c.getContext('2d');
    g.fillStyle = color;
    BAYER.forEach((v, i) => { if (v < level / 16) g.fillRect(i % 4, i >> 2, 1, 1); });
    pattern = ctx.createPattern(c, 'repeat');
    patterns.set(key, pattern);
  }
  return pattern;
}
