// Progreso entre partidas: lo que el jugador quiere ver mejorar es su PPM y su
// precisión, no solo los puntos. `games` distingue «sin partidas» de un PPM 0.
import { DIFFICULTY_ORDER, WEAK_KEYS } from '../data/config.js';

// `keys`: aciertos y fallos acumulados por letra esperada, como `{ ñ: [hits, misses] }`.
export const EMPTY_PROGRESS = { games: 0, bestWpm: 0, lastWpm: 0, bestAccuracy: 0, history: [], keys: {} };
const HISTORY_LIMIT = 20;

const count = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : 0);
// Sin espacio: solo aparece en frases y no se puede entrenar sesgando palabras.
const KEY = /^[a-zñ]$/;

function sanitizeKeys(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const keys = {};
  for (const [key, value] of Object.entries(raw)) {
    if (KEY.test(key) && Array.isArray(value) && value.length === 2) keys[key] = [count(value[0]), count(value[1])];
  }
  return keys;
}

// Suma los aciertos y fallos de una partida; las letras muy practicadas se
// reducen a la mitad para que una mejora reciente se note.
function mergeKeys(prev, hits, misses) {
  const keys = { ...prev };
  for (const key of new Set([...Object.keys(hits), ...Object.keys(misses)])) {
    if (!KEY.test(key)) continue;
    let [h, m] = keys[key] ?? [0, 0];
    h += hits[key] ?? 0;
    m += misses[key] ?? 0;
    if (h + m > WEAK_KEYS.memory) [h, m] = [Math.round(h / 2), Math.round(m / 2)];
    keys[key] = [h, m];
  }
  return keys;
}

export function keyAccuracy(hits, misses) {
  const total = hits + misses;
  return total ? Math.round((hits / total) * 100) : null;
}

export function trainingReport(prev, { weak, hitKeys, missedKeys }) {
  return weak.map((key) => ({
    key,
    before: keyAccuracy(...(prev.keys?.[key] ?? [0, 0])),
    now: keyAccuracy(hitKeys[key] ?? 0, missedKeys[key] ?? 0),
  })).filter((r) => r.before !== null && r.now !== null);
}

// Letras con suficientes muestras que más se fallan, de peor a mejor.
export function weakKeys(progress) {
  return Object.entries(progress.keys ?? {})
    .filter(([, [h, m]]) => h + m >= WEAK_KEYS.minSamples && m / (h + m) >= WEAK_KEYS.minRate)
    .sort(([, [h1, m1]], [, [h2, m2]]) => m2 / (h2 + m2) - m1 / (h1 + m1))
    .slice(0, WEAK_KEYS.count)
    .map(([key]) => key);
}

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
    keys: sanitizeKeys(src.keys),
  };
}

// Una partida demasiado corta para medir PPM no cuenta como anterior.
export function recordProgress(prev, { wpm, accuracy, diffKey, time, guided, hitKeys = {}, missedKeys = {} }) {
  if (!wpm || guided) return prev;
  return {
    games: prev.games + 1,
    bestWpm: Math.max(prev.bestWpm, wpm),
    lastWpm: wpm,
    bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
    history: DIFFICULTY_ORDER.includes(diffKey) && Number.isFinite(time) && time >= 0
      ? [...prev.history, { difficulty: diffKey, wpm, accuracy, duration: Math.round(time) }].slice(-HISTORY_LIMIT)
      : prev.history,
    keys: mergeKeys(prev.keys ?? {}, hitKeys, missedKeys),
  };
}
