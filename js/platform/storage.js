import { RECORD_KEY, PROGRESS_KEY, SETTINGS_KEY } from '../data/config.js';
import { sanitizeSettings } from '../core/settings.js';
import { sanitizeProgress } from '../core/progress.js';

// localStorage puede lanzar (almacenamiento bloqueado) o contener valores
// editados a mano, así que nunca se confía en lo leído.
export function loadRecord() {
  try {
    const value = Number(localStorage.getItem(RECORD_KEY));
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function saveRecord(value) {
  try {
    localStorage.setItem(RECORD_KEY, String(value));
  } catch {
    // Sin almacenamiento el récord solo dura la sesión.
  }
}

export function clearRecord() {
  try {
    localStorage.removeItem(RECORD_KEY);
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // Nada que borrar si no hay almacenamiento.
  }
}

export function loadSettings() {
  try {
    return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY)));
  } catch {
    return sanitizeSettings(null);
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Sin almacenamiento las opciones solo duran la sesión.
  }
}

export function loadProgress() {
  try {
    return sanitizeProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY)));
  } catch {
    return sanitizeProgress(null);
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Sin almacenamiento el progreso solo dura la sesión.
  }
}
