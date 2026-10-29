import { DEFAULT_SETTINGS, DIFFICULTY, VOLUME_MAX } from '../data/config.js';
import { clamp } from './utils.js';

// Lo guardado puede venir editado a mano o de una versión anterior: cada campo
// inválido vuelve a su valor por defecto y los desconocidos se descartan.
export function sanitizeSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = { ...DEFAULT_SETTINGS };
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    const v = src[key];
    if (typeof def === 'boolean' && typeof v === 'boolean') out[key] = v;
    else if (typeof def === 'number' && Number.isInteger(v)) out[key] = clamp(v, 0, VOLUME_MAX);
  }
  if (typeof src.difficulty === 'string' && Object.hasOwn(DIFFICULTY, src.difficulty)) {
    out.difficulty = src.difficulty;
  }
  return out;
}
