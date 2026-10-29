# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Solo escritorio: requiere teclado físico. En móvil basta con avisar de que no es jugable; no se diseña para teclado virtual.

## Users

Hispanohablantes que quieren aprender a teclear más rápido y con más precisión. El juego es el envoltorio de la práctica: cada partida debe dejar al jugador tecleando mejor, y la diversión arcade es el motivo para volver a practicar.

## Product Purpose

Apocalipsis QWERTY convierte la práctica de mecanografía en un arcade de supervivencia: escribir la palabra de un zombi le dispara, y la presión de la horda obliga a ganar velocidad sin sacrificar precisión. El éxito es que el jugador mejore su PPM y su precisión partida a partida mientras sigue queriendo jugar.

## Positioning

Práctica de mecanografía en español real: vocabulario y frases en castellano con tildes, diéresis y `ñ`, donde las tildes son opcionales pero la `ñ` cuenta. La dificultad progresa por oleadas, tipos de zombi y mejoras roguelite, no por lecciones.

## Operating Context

- Partidas en navegador de escritorio, servidas desde el propio origen (`npm start`, http://localhost:8000).
- Flujo: menú (dificultad Fácil / Normal / Pesadilla, opciones) → partida por oleadas → elección de mejora tras cada oleada → jefe cada 5 oleadas → game over con resumen (puntos, oleada, abatidos, precisión) y récord local.
- Pausa con `Esc`, granada con `Enter`, menús con atajos numéricos.
- `Esc` también abre pausa desde las mejoras y vuelve a la misma oferta. La pausa permite consultar efectos adquiridos, controles y enemigos; abandonar requiere confirmar.
- El resumen compara velocidad con partidas recientes de la misma dificultad (hasta 20 anteriores guardadas) y ofrece práctica con diagnóstico de la primera posición incorrecta. Los récords globales arcade se conservan por separado.
- Modo guiado opcional para la próxima partida: objetivos por turnos en texto y entrada nativa con foco, sin límite de tiempo. Cada tres fallos se pierde una vida. Revela palabras ocultas, impide mutaciones mientras se lee y excluye mejoras de movimiento sin efecto; sus resultados no modifican récords ni historial arcade.

## Capabilities and Constraints

- Mecánica: la primera letra fija el objetivo; fallos rompen la racha; multiplicador hasta x5; granada que se carga con abatidos.
- Zombis: caminante, corredor, bruto (frases sustantivo + adjetivo desde la oleada 4), encapuchado (palabra oculta), hinchado (se divide), mutante (cambia de palabra) y jefe multipalabra.
- Mejoras normales, raras y malditas (con coste) definidas en `js/data/config.js`.
- HUD: vidas, granada, puntos, progreso de oleada, racha, multiplicador, precisión y PPM opcionales, silencio, vida del jefe.
- Opciones persistentes: volumen de música y efectos, silencio, dificultad, estadísticas en HUD, temblor de pantalla, filtro CRT, borrar récord.
- Técnica: JavaScript vanilla con módulos ES, sin build ni dependencias externas; CSP estricta sin `unsafe-inline`; arquitectura en capas descrita en `AGENTS.md`.
- Todo es usable solo con teclado.

## Brand Commitments

- Nombre: **Apocalipsis QWERTY**. Idioma de UI: español.
- Tono de humor macabro: zombis con gracia (payaso podrido, cajera hambrienta), no gore serio.
- Estética pixel art con filtro CRT opcional; fuentes Press Start 2P y VT323 autoalojadas (OFL). Es un compromiso que el trabajo futuro debe preservar.
- Cero dependencias: nada de CDNs, fuentes remotas ni paquetes.

## Evidence on Hand

- Sprites como mapas de caracteres en `js/data/art.js`; paleta en `js/data/palette.js`.
- Fuentes en `assets/fonts/` con sus licencias OFL.
- Música: «8 Bit Spooky» de HeatleyBros (`assets/music/`, ver `CREDITS.txt`).
- No hay testimonios, métricas de uso, capturas promocionales ni presencia publicada; no deben inventarse.

## Product Principles

1. La práctica manda: cualquier mecánica nueva debe hacer teclear más y mejor, no menos.
2. Precisión antes que velocidad: los fallos tienen coste visible; la velocidad se gana por oleadas.
3. Español de verdad: vocabulario natural, concordancia correcta y entrada tolerante con tildes.
4. Humor macabro, nunca cruel: el miedo es de broma.
5. Ligero y propio: abre al instante, funciona sin red externa y sin dependencias.

## Accessibility & Inclusion

- Uso completo solo con teclado; las pantallas superpuestas enfocan su `[data-autofocus]`.
- Respeta `prefers-reduced-motion` y permite desactivar temblor y filtro CRT.
- Los valores del HUD mantienen sus `aria-*` sincronizados.
