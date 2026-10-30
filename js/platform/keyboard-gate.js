// No hay una API fiable de teclado conectado: lo deducimos del dispositivo y de lo que hace el usuario.
const DESKTOP = '(pointer: fine) and (hover: hover)';

// Los teclados virtuales de Android envían 'Unidentified' o keyCode 229; no prueban un teclado físico.
function isPhysicalKey(event) {
  return event.isTrusted && !event.isComposing && event.keyCode !== 229
    && event.key !== 'Unidentified' && event.key !== 'Process';
}

export function createKeyboardGate() {
  const dialog = document.getElementById('keyboard-dialog');
  // Un dispositivo con ratón como puntero principal es un ordenador: damos el teclado por hecho.
  let verified = window.matchMedia(DESKTOP).matches;

  // El aviso fijo evita leer todo el menú antes de enterarse; el diálogo queda de respaldo al elegir.
  const notice = document.getElementById('keyboard-notice');
  const syncNotice = () => notice.classList.toggle('hidden', verified);
  syncNotice();

  dialog.addEventListener('cancel', (event) => event.preventDefault());
  window.addEventListener('keydown', (event) => {
    if (!isPhysicalKey(event)) return;
    verified = true;
    syncNotice();
    if (!dialog.open) return;

    // La tecla de comprobación no debe iniciar una partida ni activar atajos detrás.
    event.stopImmediatePropagation();
    event.preventDefault();
    dialog.close();
  }, { capture: true });

  // Portátiles táctiles: el puntero principal puede ser táctil, pero usar un ratón delata un ordenador.
  window.addEventListener('pointerdown', (event) => {
    if (event.isTrusted && event.pointerType === 'mouse') {
      verified = true;
      syncNotice();
    }
  }, { capture: true });

  function requireKeyboard() {
    if (verified) return true;
    if (!dialog.open) dialog.showModal();
    return false;
  }

  return { requireKeyboard };
}
