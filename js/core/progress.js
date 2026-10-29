// Progreso entre partidas: lo que el jugador quiere ver mejorar es su PPM y su
// precisión, no solo los puntos. `games` distingue «sin partidas» de un PPM 0.
import { DIFFICULTY_ORDER } from '../data/config.js';

export const EMPTY_PROGRESS = { games: 0, bestWpm: 0, lastWpm: 0, bestAccuracy: 0, history: [] };
const HISTORY_LIMIT = 20;

const count = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : 0);

export function sanitizeProgress(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    games: count(src.games),
    bestWpm: count(src.bestWpm),
    lastWpm: count(src.lastWpm),
    bestAccuracy: Math.min(100, count(src.bestAccuracy)),
    history: Array.isArray(src.history) ? src.history.filter((entry) => entry && DIFFICULTY_ORDER.includes(entry.difficulty)
      && Number.isSafeInteger(entry.wpm) && entry.wpm > 0 && Number.isSafeInteger(entry.accuracy)
      && entry.accuracy >= 0 && entry.accuracy <= 100 && Number.isFinite(entry.duration)
      && entry.duration >= 0).slice(-HISTORY_LIMIT).map(({ difficulty, wpm, accuracy, duration }) =>
      ({ difficulty, wpm, accuracy, duration })) : [],
  };
}

// Una partida demasiado corta para medir PPM no cuenta como anterior.
export function recordProgress(prev, { wpm, accuracy, diffKey, time }) {
  if (!wpm) return prev;
  return {
    games: prev.games + 1,
    bestWpm: Math.max(prev.bestWpm, wpm),
    lastWpm: wpm,
    bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
    history: DIFFICULTY_ORDER.includes(diffKey) && Number.isFinite(time) && time >= 0
      ? [...prev.history, { difficulty: diffKey, wpm, accuracy, duration: Math.round(time) }].slice(-HISTORY_LIMIT)
      : prev.history,
  };
}
