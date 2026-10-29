// Progreso entre partidas: lo que el jugador quiere ver mejorar es su PPM y su
// precisión, no solo los puntos. `games` distingue «sin partidas» de un PPM 0.
export const EMPTY_PROGRESS = { games: 0, bestWpm: 0, lastWpm: 0, bestAccuracy: 0 };

const count = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : 0);

export function sanitizeProgress(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    games: count(src.games),
    bestWpm: count(src.bestWpm),
    lastWpm: count(src.lastWpm),
    bestAccuracy: Math.min(100, count(src.bestAccuracy)),
  };
}

// Una partida demasiado corta para medir PPM no cuenta como anterior.
export function recordProgress(prev, { wpm, accuracy }) {
  if (!wpm) return prev;
  return {
    games: prev.games + 1,
    bestWpm: Math.max(prev.bestWpm, wpm),
    lastWpm: wpm,
    bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
  };
}
