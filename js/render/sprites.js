import { OUTLINE, ZOMBIE_ART, ZOMBIE_PALETTES, ZOMBIE_ACCENTS, PLAYER, MUZZLE, BARRICADE, TOMB } from '../data/art.js';
import { PALETTE } from '../data/palette.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function buildSprite(rows, palette, { outline = true } = {}) {
  const pad = outline ? 1 : 0;
  const w = Math.max(...rows.map((r) => r.length)) + pad * 2;
  const h = rows.length + pad * 2;
  const grid = Array.from({ length: h }, () => Array(w).fill(null));
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== '.') grid[y + pad][x + pad] = palette[ch] ?? '#ff00ff';
    });
  });

  if (outline) {
    const solid = (x, y) => Boolean(grid[y]?.[x]);
    const edge = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!grid[y][x] && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) {
          edge.push([x, y]);
        }
      }
    }
    for (const [x, y] of edge) grid[y][x] = OUTLINE;
  }

  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  grid.forEach((row, y) => row.forEach((color, x) => {
    if (!color) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }));
  return canvas;
}

// Silueta de un color (destello al recibir un disparo).
function tint(src, color) {
  const c = makeCanvas(src.width, src.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

function buildZombie({ body, legs }, palette, accent) {
  const [a, b, c] = legs;
  const frames = [a, b, c, b].map((l) => buildSprite([...body, ...l], palette));
  return {
    frames,
    flash: frames.map((f) => tint(f, PALETTE.bone)),
    glow: accent ? frames.map((f) => tint(f, accent)) : null,
    w: frames[0].width,
    h: frames[0].height,
  };
}

export const SPRITES = {
  zombies: Object.fromEntries(
    Object.entries(ZOMBIE_ART).map(([kind, art]) => [kind, buildZombie(art, ZOMBIE_PALETTES[kind], ZOMBIE_ACCENTS[kind])]),
  ),
  player: buildSprite(PLAYER.rows, PLAYER.palette),
  muzzle: buildSprite(MUZZLE.rows, MUZZLE.palette, { outline: false }),
  barricade: buildSprite(BARRICADE.whole, BARRICADE.palette),
  barricadeBroken: buildSprite(BARRICADE.broken, BARRICADE.palette),
  tomb: buildSprite(TOMB.stone, TOMB.palette),
  cross: buildSprite(TOMB.cross, TOMB.palette),
};
