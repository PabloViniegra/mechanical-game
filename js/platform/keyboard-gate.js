// No hay una API fiable de teclado conectado: exigimos una pulsación antes de jugar.
export function createKeyboardGate() {
  const dialog = document.getElementById('keyboard-dialog');
  let verified = false;

  dialog.addEventListener('cancel', (event) => event.preventDefault());
  window.addEventListener('keydown', (event) => {
    const letter = event.isTrusted && !event.isComposing && !event.repeat
      && !event.ctrlKey && !event.metaKey && !event.altKey
      && /^Key[A-Z]$/.test(event.code) && event.key.length === 1;

    if (letter) verified = true;
    if (!dialog.open) return;

    // La tecla de comprobación no debe iniciar una partida ni activar atajos detrás.
    event.stopImmediatePropagation();
    if (event.key === 'Escape' || letter) event.preventDefault();
    if (letter) dialog.close();
  }, { capture: true });

  function requireKeyboard() {
    if (verified) return true;
    if (!dialog.open) dialog.showModal();
    return false;
  }

  if (window.matchMedia('(any-pointer: coarse)').matches) requireKeyboard();

  return { requireKeyboard };
}
