import { PIXEL_HEIGHT } from '../data/config.js';
import { PLAYER, spriteSize } from '../data/art.js';

const PLAYER_SIZE = spriteSize(PLAYER.rows);
// Boca del cañón respecto a la esquina superior izquierda del jugador.
export const PLAYER_TIP = { x: PLAYER_SIZE.w - 1, y: 9 };

// Geometría del mundo en píxeles de arte (resolución interna).
export const view = {
  scale: 1,
  w: 0,
  h: 0,
  horizon: 0,
  laneTop: 0,
  laneBottom: 0,
  barricadeX: 0,
  playerX: 0,
  playerY: 0,
  spawnX: 0,
};

export function updateView(screenW, screenH) {
  const scale = Math.max(2, Math.round(screenH / PIXEL_HEIGHT));
  view.scale = scale;
  view.w = Math.ceil(screenW / scale);
  view.h = Math.ceil(screenH / scale);
  view.horizon = Math.round(view.h * 0.52);
  view.laneTop = view.horizon + 26;
  view.laneBottom = view.h - 4;
  view.barricadeX = 46;
  view.playerX = 22;
  view.playerY = Math.round((view.laneTop + view.laneBottom) / 2) + 4;
  view.spawnX = view.w + 14;
}

// Posición vertical (pies) de un carril normalizado entre 0 y 1.
export const laneY = (lane) => Math.round(view.laneTop + lane * (view.laneBottom - view.laneTop));

export const gunTip = () => ({
  x: view.playerX - Math.floor(PLAYER_SIZE.w / 2) + PLAYER_TIP.x,
  y: view.playerY - PLAYER_SIZE.h + PLAYER_TIP.y,
});
