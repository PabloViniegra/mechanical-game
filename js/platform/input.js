import { fold } from '../core/utils.js';

// Traduce el teclado en acciones según el estado actual del juego.
export function bindKeyboard({ getState, onChar, onEscape, onDigit, onGrenade, onOptions }) {
  window.addEventListener('keydown', (e) => {
    const state = getState();
    if (e.key === 'Escape') {
      if (!e.repeat) onEscape(state);
      return;
    }
    if ((state === 'menu' || state === 'upgrade') && /^[1-9]$/.test(e.key)) {
      onDigit(state, Number(e.key) - 1);
      return;
    }
    // Mantener Enter o Espacio pulsados no debe elegir mejora por autorrepetición.
    if (state === 'upgrade' && e.repeat && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      return;
    }
    if (state === 'menu' && e.key.toLowerCase() === 'o') {
      onOptions();
      return;
    }
    if (state !== 'playing') return;
    if (e.target?.closest?.('input, select, textarea, [contenteditable="true"]')) return;
    if ((e.key === 'Enter' || e.key === ' ') && e.target?.closest?.('button')) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      onGrenade();
      return;
    }
    // 'Dead' (tecla muerta de tildes) y otras teclas especiales tienen nombres largos.
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    e.preventDefault();
    onChar(fold(e.key));
  });
}
