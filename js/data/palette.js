// Paleta única del juego: sprites, fondo, efectos y CSS solo usan estos 16
// colores (los tests lo comprueban). Mantenerla cerrada es lo que da unidad
// al conjunto; si hace falta un tono nuevo, sustituye uno, no añadas.
export const PALETTE = {
  ink: '#0d0f0e',
  night: '#1b2321',
  slate: '#2e3b36',
  moss: '#4a5a45',
  lichen: '#7a8a5a',
  sick: '#b8bd6a',
  bone: '#e8dfc4',
  dust: '#b89a78',
  earth: '#3e3229',
  mud: '#6e5b44',
  blood: '#5a1a1c',
  rust: '#a8382a',
  salmon: '#e07a5f',
  ember: '#e0892e',
  flame: '#f5cf5a',
  cold: '#6c9aa8',
};

// Salpicaduras compartidas por la partida y la demo del título.
export const BLOOD = [PALETTE.rust, PALETTE.blood];
export const GORE = [PALETTE.lichen, PALETTE.moss, PALETTE.rust, PALETTE.blood, PALETTE.bone];
