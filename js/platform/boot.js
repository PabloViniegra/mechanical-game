// Respaldo por si no llega el animationend final (p. ej. pestaña en segundo plano).
const BOOT_FALLBACK_MS = 4000;

// Encendido de recreativa al cargar: el tubo se abre y el título se imprime.
// Cualquier tecla o clic lo termina.
// `onKeystroke` avisa cada vez que una tecla del logo aterriza, también al volver al menú.
export function bootTitle(root, { onKeystroke }) {
  const logo = root.querySelector('.logo-main');
  logo.addEventListener('animationend', (e) => {
    if (e.animationName === 'key-in') onKeystroke();
  });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.classList.add('booting', 'boot-logo');
  // El retardo del logo dura hasta su última tecla, o hasta que se oculta al empezar
  // partida; si siguiera, al volver al menú el tecleo tardaría de más.
  const endLogo = (e) => {
    if (e.type === 'animationend' && (e.animationName !== 'key-in' || e.target !== logo.lastElementChild)) return;
    root.classList.remove('boot-logo');
  };
  logo.addEventListener('animationend', endLogo);
  logo.addEventListener('animationcancel', endLogo);

  // Saltar no se traga la pulsación: quien ya sabe a qué viene entra sin esperar.
  const end = () => {
    clearTimeout(timer);
    root.classList.remove('booting');
    window.removeEventListener('keydown', end, true);
    window.removeEventListener('pointerdown', end, true);
  };
  const last = (e) => {
    if (e.animationName === 'type-on' && e.target.matches('.title-screen .record')) end();
  };
  const timer = setTimeout(end, BOOT_FALLBACK_MS);
  root.addEventListener('animationend', last);
  window.addEventListener('keydown', end, true);
  window.addEventListener('pointerdown', end, true);
}
