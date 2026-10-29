# Apocalipsis QWERTY — reglas del proyecto

Juego de mecanografía en pixel art. JavaScript vanilla con módulos ES, sin build
ni dependencias. Estas reglas son obligatorias; `npm run check` hace cumplir las
marcadas con ✔.

## Comandos

- `npm start` — sirve el juego en http://localhost:8000 (los módulos ES no cargan desde `file://`).
- `npm run check` — sintaxis + tests (`node --test`, Node ≥ 20). Debe pasar antes de dar un cambio por terminado.
- Si cambias render, UI o input, pruébalo además en el navegador: menú, partida, pausa (`Esc`), game over y consola sin errores ni avisos de CSP.

## Arquitectura en capas

```
js/
  data/      datos puros: textos, ajustes, mapas de píxeles
  core/      lógica y simulación; sin DOM, audio ni almacenamiento
  render/    dibujo en canvas
  platform/  navegador: DOM/HUD, teclado, audio, localStorage
  main.js    raíz de composición: estados, bucle y cableado
```

| Capa       | Puede importar de              |
|------------|--------------------------------|
| `data`     | `data`                         |
| `core`     | `data`, `core`                 |
| `render`   | `data`, `core`, `render`       |
| `platform` | `data`, `core`, `platform`     |
| `main.js`  | todas                          |

- ✔ Ninguna capa importa fuera de lo permitido; `render` y `platform` no se conocen entre sí.
- ✔ `data/` y `core/` no usan `document`, `window`, `localStorage`, `matchMedia`, `AudioContext` ni `requestAnimationFrame`. Todo `core/` debe poder ejecutarse en Node.
- ✔ Sin imports externos (paquetes o URLs). Todo se sirve desde el propio origen.
- Un módulo nuevo va en la capa de su dependencia más alta, no en `main.js`.

## Patrones fijos

- **Eventos, no dependencias.** `Game` notifica con `this.emit(nombre, datos)` y nunca llama a audio ni UI. `main.js` es el único que conecta eventos con `sfx` y `ui`. Eventos actuales: `change`, `wave`, `upgrade`, `over`, `revive`, `spawn`, `lock`, `shoot`, `miss`, `kill`, `hurt`, `grenade`, `part`, `shift`.
- **Contrato de escena.** El renderer solo lee `{ zombies, effects, target, lives, maxLives, shake, hurtFlash, missFlash, muzzle }`. `Game` y `createDemo()` lo cumplen; si añades un campo, añádelo a ambos.
- **Coordenadas.** Todo `core/` trabaja en píxeles de arte (`view`). Solo el renderer multiplica por `view.scale` y `devicePixelRatio`.
- **Tiempo.** `dt` en segundos y limitado en `main.js`. Los temporizadores decrecen con `Math.max(0, x - dt)`; nada depende de la tasa de fotogramas.
- **Ajustes y textos.** Listas de palabras, dificultades y cualquier ajuste de equilibrio nuevo van en `data/config.js`. Los tiempos de animación locales (destellos, temblores) pueden quedarse junto a su uso.
- **Arte.** Los sprites son mapas de caracteres en `data/art.js`. `render/sprites.js` los convierte en canvas; `core/` obtiene tamaños con `spriteSize()`, nunca de un canvas.
- **Entrada.** El teclado pasa por `fold()` antes de llegar a `Game.type()`: minúsculas, sin tildes ni diéresis, conservando la `ñ`. Compara siempre contra `zombie.folded`, no contra `zombie.word`.
- **Estilo.** Exports con nombre, comillas simples, punto y coma, 2 espacios. Clases para objetos con estado y ciclo de vida (`Game`, `Effects`, `Renderer`); funciones factoría para la capa DOM (`createUI`). Comentarios y textos de UI en español; los comentarios explican el porqué.

## Seguridad

- La CSP de `index.html` (`default-src 'none'`, `script-src 'self'`, sin `unsafe-inline`) no se relaja. Nada de scripts o estilos inline, `style="…"` en HTML, CDNs ni fuentes remotas. Las fuentes están en `assets/fonts/` con su licencia OFL.
- ✔ Nunca `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval` ni `new Function`. El DOM se construye con `createElement` y `textContent`.
- `localStorage` solo a través de `platform/storage.js`: todo acceso va en `try/catch` y lo leído se valida antes de usarse.
- Las APIs opcionales del navegador (Web Audio, etc.) se degradan en silencio si no existen; el juego debe seguir siendo jugable.

## Accesibilidad

- Respeta `prefers-reduced-motion` (temblor, parpadeos, retícula).
- Las pantallas superpuestas enfocan su `[data-autofocus]`; todo es usable solo con teclado.
- Los valores del HUD que cambian mantienen sus `aria-*` sincronizados (`aria-valuenow`, `aria-label`, `aria-pressed`).

## Tests

- Los tests viven en `tests/` y solo importan de `data/` y `core/`.
- Prueba comportamiento observable (puntos, vidas, eventos emitidos), no detalles internos.
- Un bug corregido en `core/` lleva un test que lo reproduce.
