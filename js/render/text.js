import { FONT, FONT_MARKS, MARK_H } from '../data/art.js';

// Texto con la fuente bitmap de data/art.js, en píxeles de arte.

function glyph(ch) {
  const up = ch.toUpperCase();
  const mark = FONT_MARKS[up];
  if (mark) return { rows: FONT[mark[0]], mark: mark.slice(1) };
  return { rows: FONT[up] ?? FONT['?'], mark: null };
}

export const charWidth = (ch) => glyph(ch).rows[0].length;

export const textWidth = (str) => Math.max(0, [...str].reduce((w, ch) => w + charWidth(ch) + 1, 0) - 1);

export const hasMarks = (str) => [...str].some((ch) => FONT_MARKS[ch.toUpperCase()]);

// (x, y) es la esquina superior de la letra; los signos quedan MARK_H filas por encima.
export function drawChar(ctx, ch, x, y, color) {
  const { rows, mark } = glyph(ch);
  ctx.fillStyle = color;
  const plot = (lines, y0) => lines.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) if (row[rx] === '#') ctx.fillRect(x + rx, y0 + ry, 1, 1);
  });
  plot(rows, y);
  if (mark) plot(mark, y - MARK_H);
  return rows[0].length;
}

export function drawText(ctx, str, x, y, color) {
  for (const ch of str) x += drawChar(ctx, ch, x, y, color) + 1;
}
