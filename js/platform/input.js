import { fold } from '../core/utils.js';

// Traduce el teclado en acciones según el estado actual del juego.
export function bindKeyboard({ getState, onChar, onEscape, onDigit, onGrenade, onRelease, onOptions, onAchievements }) {
  window.addEventListener('keydown', (e) => {
    const state = getState();
    if (e.key === 'Escape') {
      if (!e.repeat) onEscape(state);
      return;
    }
    const plain = !e.ctrlKey && !e.metaKey && !e.altKey;
    if ((state === 'menu' || state === 'upgrade') && plain && /^[1-9]$/.test(e.key)) {
      // La repetición de un dígito mantenido llegaría ya en partida como fallo.
      if (!e.repeat) onDigit(state, Number(e.key) - 1);
      return;
    }
    // Mantener Enter o Espacio pulsados no debe elegir mejora por autorrepetición.
    if (state === 'upgrade' && e.repeat && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      return;
    }
    if (state === 'menu' && plain && e.key.toLowerCase() === 'o') {
      onOptions();
      return;
    }
    if (state === 'menu' && plain && e.key.toLowerCase() === 'l') {
      onAchievements();
      return;
    }
    if (state !== 'playing') return;
    if (e.target?.closest?.('input, select, textarea, [contenteditable="true"]')) return;
    // Mantener una tecla pulsada no es teclear: la autorrepetición contaría
    // fallos (o repetiría la granada) sin que el jugador lo pretenda.
    if (e.repeat) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      // En partida las teclas son del juego aunque el foco esté en un botón del HUD.
      if (e.target?.closest?.('.hud button')) e.target.blur();
      else if (e.target?.closest?.('button')) return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      onGrenade();
      return;
    }
    // Tab solo se queda la tecla si había objetivo que soltar: sin él, y en
    // el modo guiado, sigue moviendo el foco para poder volver a los controles.
    if (e.key === 'Tab' && !e.shiftKey && plain) {
      if (onRelease()) e.preventDefault();
      return;
    }
    // 'Dead' (tecla muerta de tildes) y otras teclas especiales tienen nombres largos.
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    e.preventDefault();
    onChar(fold(e.key));
  });
}
