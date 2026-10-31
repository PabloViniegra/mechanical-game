---
name: Apocalipsis QWERTY
description: Arcade de mecanografía en pixel art; escribe la palabra del zombi para dispararle.
colors:
  ink: "#0d0f0e"
  night: "#1b2321"
  slate: "#2e3b36"
  moss: "#4a5a45"
  lichen: "#7a8a5a"
  sick: "#b8bd6a"
  bone: "#e8dfc4"
  dust: "#b89a78"
  earth: "#3e3229"
  mud: "#6e5b44"
  blood: "#5a1a1c"
  rust: "#a8382a"
  salmon: "#e07a5f"
  ember: "#e0892e"
  flame: "#f5cf5a"
  cold: "#6c9aa8"
typography:
  display:
    fontFamily: "Press Start 2P, ui-monospace, monospace"
    fontSize: "64px"
    fontWeight: 400
    lineHeight: 1
  headline:
    fontFamily: "Press Start 2P, ui-monospace, monospace"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: "Press Start 2P, ui-monospace, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "VT323, ui-monospace, monospace"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.15
  label:
    fontFamily: "Press Start 2P, ui-monospace, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1
rounded:
  none: "0"
spacing:
  u: "4px"
  u2: "8px"
  u3: "12px"
  u4: "16px"
  u5: "20px"
  u6: "24px"
  u8: "32px"
components:
  menu-item:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "6px 0"
  menu-item-focus:
    textColor: "{colors.ember}"
  menu-item-danger:
    textColor: "{colors.salmon}"
  menu-item-rare:
    textColor: "{colors.sick}"
  panel:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    rounded: "{rounded.none}"
    padding: "24px 28px"
    width: "600px"
  option-row:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    typography: "{typography.body}"
    padding: "4px 12px"
    height: "44px"
  option-row-hover:
    backgroundColor: "{colors.night}"
  segmented-button:
    backgroundColor: "transparent"
    textColor: "{colors.dust}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    height: "44px"
  segmented-button-active:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
  kbd:
    backgroundColor: "{colors.night}"
    textColor: "{colors.bone}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 4px"
  meter:
    backgroundColor: "{colors.night}"
    padding: "2px"
    width: "120px"
    height: "12px"
  hud:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    padding: "8px 16px"
---

# Design System: Apocalipsis QWERTY

## Overview

**Creative North Star: "Recreativa del fin del mundo"**

Una máquina arcade de los 80 que sigue encendida en un búnker cuando todo lo demás se ha apagado. El fósforo es hueso sobre negro tinta, la ceniza es el polvo de las etiquetas y el único calor es el naranja brasa del cursor, la puntuación y lo que exige atención ya. Todo es pixel art honesto: cada medida es un múltiplo del píxel de arte (`--u`), que `main.js` sincroniza con la escala entera del canvas para que HUD, paneles y sprites compartan la misma rejilla.

La interfaz es táctil y crujiente. No se desliza ni rebota: cambia por pasos (`steps()`), como hardware viejo que responde con un clic. Los paneles son cuadros de diálogo de consola con marco hueso, los menús son texto plano con una flecha-cursor, y la profundidad la dan desplazamientos sólidos de píxel, nunca desenfoques. La densidad es la de una recreativa: el HUD es una franja fina arriba y el campo de batalla manda.

Se rechaza explícitamente la UI moderna: radios, degradados suaves, sombras difusas, glassmorphism y animaciones con easing elástico rompen la ilusión de máquina.

**Key Characteristics:**
- Paleta cerrada de 16 colores compartida por sprites, fondo, efectos y CSS.
- Todo medido en píxeles de arte (`--u`), escalado por enteros.
- Esquinas siempre rectas; bordes de un píxel de arte o medio.
- Movimiento por pasos (`steps()`), nunca interpolación suave.
- Naranja brasa reservado para foco y urgencia.

## Colors

Una paleta terrosa y enfermiza de 16 tonos: verdes de musgo y liquen, hueso y polvo, sangre seca y una sola brasa caliente.

### Primary
- **Brasa** (ember): el color de la acción. Foco de menú y su cursor-flecha, puntuación del HUD, «¡Nuevo récord!», granada cargada, multiplicador caliente, anillo de foco.

### Secondary
- **Óxido** (rust): sangre fresca. Corazón lleno, barra de vida del jefe, primera capa de sombra del logo y de los carteles.
- **Salmón** (salmon): peligro con nombre. Dificultad Pesadilla, mejoras malditas, «Te han devorado», nombre del jefe, brillo del corazón.

### Tertiary
- **Enfermizo** (sick): lo raro y valioso. Mejoras raras en menús y listas.
- **Liquen** (lichen): progreso neutro. Relleno por defecto de las barras (oleada).
- **Llama** (flame), **Barro** (mud), **Frío** (cold): solo en canvas (efectos, fondo, sprites); no entran en la interfaz HTML.

### Neutral
- **Tinta** (ink): fondo de todo, HUD, paneles y sombra final de los textos con relieve. Sus versiones translúcidas oscurecen la partida detrás de las pantallas (`cc` en paneles, `99` en el título) y dibujan las líneas CRT (`33`).
- **Noche** (night): pistas de barras, fondo de `kbd`, hover de filas de opciones.
- **Pizarra** (slate): bordes y separadores (HUD, `kbd`, filas, resumen, chips de mejora), pista del deslizador, corazón vacío.
- **Hueso** (bone): texto principal, marco de los paneles, pulgar del deslizador, botón segmentado activo.
- **Polvo** (dust): texto secundario: etiquetas del HUD, títulos de sección, ayuda, metadatos, estados apagados.
- **Musgo** (moss), **Tierra** (earth), **Sangre** (blood): tonos de mundo; en CSS, la sangre solo aparece como segunda capa de sombra del logo y en el sombreado del corazón.

### Named Rules
**The Closed Palette Rule.** Ningún color fuera de `js/data/palette.js` entra en sprites, efectos ni CSS (los tests lo comprueban). Si hace falta un tono nuevo, se sustituye uno; no se añade.

**The One Ember Rule.** La brasa marca lo que importa ahora mismo: foco, valor activo, urgencia. Si dos cosas compiten en naranja en la misma pantalla, una sobra.

## Typography

**Display Font:** Press Start 2P (con ui-monospace, monospace)
**Body Font:** VT323 (con ui-monospace, monospace)

**Character:** Press Start 2P es la voz del arcade: mayúsculas de marquesina para títulos, etiquetas, valores y opciones. VT323 es el texto de terminal que explica: ayudas, descripciones y metadatos, alto y estrecho para leerse rápido.

Los tamaños derivan de `--u` (valores a `--u: 4px`); los de Press Start 2P se redondean a múltiplos de 8 px.

### Hierarchy
- **Display** (400, 64px, 1): «QWERTY» del logo, con sombra en capas óxido → sangre → tinta. Se limita a 14vw, redondeado hacia abajo a múltiplos de 8px, para que el cursor quepa en la misma línea.
- **Headline** (400, 32px, 1.2): títulos de pantalla («Pausa», «Opciones», «Te han devorado»), carteles de oleada y opciones del menú principal.
- **Title** (400, 16px, 1.3): opciones de menú en paneles, valores del HUD (precisión y PPM incluidos), multiplicador, línea superior del logo (espaciado de hasta 0.5em, limitado a 1vw), títulos de sección, datos del resumen final, valores de opción, botones segmentados, «¡Nuevo récord!» y la línea de récord y PPM máx. Todo dato que el jugador quiera comparar entre partidas va aquí, nunca a 8px.
- **Body** (400, 20px, 1.15): VT323 para ayuda, descripciones de mejoras, metadatos y etiquetas de opciones. Ancho máximo 38em. En pantallas de 560px o menos, mínimo 18px.
- **Label** (400, 16px, mayúsculas): etiquetas del HUD, teclas de atajo, `kbd` y chips de mejora.

### Named Rules
**The Multiple-of-Eight Rule.** Press Start 2P solo se usa a 8, 16, 32 o 64 px (y sus múltiplos de 8). Cualquier otro tamaño emborrona el píxel.

**The No-Bold Rule.** Peso 400 siempre. La jerarquía se marca con tamaño, color y mayúsculas; las negritas sintéticas destruyen el pixel art.

## Layout

El campo de batalla (canvas) ocupa toda la ventana con `image-rendering: pixelated`, y todo lo demás flota encima en capas absolutas. El HUD es una franja fija arriba con rejilla de tres columnas (`1fr auto 1fr`): vidas y granada a la izquierda, puntos y oleada al centro, racha, multiplicador, estadísticas y sonido a la derecha. La vida del jefe ocupa una fila completa debajo.

Las pantallas superpuestas centran su contenido con `margin: auto` dentro de un overlay desplazable, de modo que un panel alto nunca se recorta. Los paneles miden hasta 150u (600px) y la pantalla de título hasta 170u (680px).

El ritmo es un múltiplo de `--u`: 1u entre filas de menú y opciones, 2–3u en bloques internos, 5–6u entre secciones, 8–10u bajo el logo. No hay valores fuera de la rejilla salvo los mínimos de 44px de los objetivos táctiles.

**Responsive:** a 860px o menos el HUD pasa a dos columnas y oculta precisión/PPM. A 560px o menos el HUD fluye en varias filas, las barras se acortan, el resumen pasa a una columna y los menús ocultan las teclas de atajo, salvo los números de las mejoras. Las filas de volumen sitúan etiqueta y valor encima del deslizador. Es escritorio primero: el móvil se muestra legible, no se diseña como objetivo.

## Elevation & Depth

Plano. No hay sombras difusas: la profundidad sale de capas de tinta translúcida (overlay `#0d0f0ecc`, título `#0d0f0e99`) y de desplazamientos sólidos de un píxel de arte. Los textos con relieve apilan sombras sin desenfoque hacia abajo (óxido, sangre, tinta), y los paneles se separan del fondo con un anillo exterior de tinta de 1u alrededor del marco hueso.

### Shadow Vocabulary
- **Relieve de logo** (`text-shadow: 0 var(--u) 0 var(--rust), 0 calc(var(--u) * 2) 0 var(--blood), 0 calc(var(--u) * 3) 0 var(--ink)`): solo el logo.
- **Relieve de cartel** (`text-shadow: 0 var(--u) 0 var(--rust), 0 calc(var(--u) * 2) 0 var(--ink)`): títulos de oleada.
- **Anillo de panel** (`box-shadow: 0 0 0 var(--u) var(--ink)`): separa el marco hueso de la partida.

### Named Rules
**The Zero-Blur Rule.** Ninguna sombra lleva radio de desenfoque. Si hay profundidad, es un píxel sólido desplazado.

## Shapes

Esquinas rectas en todo (`border-radius: 0`, incluido el pulgar del deslizador). Los bordes miden 1u en marcos estructurales (panel, base del HUD) y 0.5u en separadores y controles (`kbd`, filas de opciones, chips, botones segmentados). Los iconos son SVG de píxel con `shape-rendering: crispEdges` (sonido, corazón, cursor-flecha), dibujados con rectángulos sobre una rejilla diminuta y escalados sin suavizado.

## Components

### Elementos de menú
Texto plano con cursor, sin caja de botón.
- **Shape:** sin fondo ni borde; fila de rejilla con tecla de atajo, nombre y metadatos.
- **Reposo:** nombre en hueso (Press Start 2P), tecla de atajo y metadatos en polvo.
- **Foco:** aparece la flecha-cursor brasa a la izquierda y el nombre pasa a brasa. Sin anillo de foco: la flecha es el indicador. Se recorren con flechas.
- **Variantes:** peligro y maldita en salmón, rara en enfermizo; todas pasan a brasa con el foco. Deshabilitado en polvo al 60 %.

### Paneles
Cuadro de diálogo de consola.
- **Corner Style:** recto.
- **Background:** tinta, sobre un overlay de tinta al 80 %.
- **Border:** 1u hueso más anillo exterior de tinta de 1u.
- **Internal Padding:** 6u × 7u (5u × 4u en estrecho).

### Mejoras, ayuda y escritura
- **Oferta de mejoras:** nombre en su propia fila; rareza y nivel juntos debajo; descripción con interlineado 1.4. El atajo ocupa una columna aparte en escritorio y desaparece en estrecho.
- **Ayuda:** bloques nativos `details` en pausa y resumen, con foco brasa visible. Los efectos adquiridos se consultan con su descripción, no solo con el nombre. La fórmula de PPM y los límites del historial van en una ayuda desplegable después de las acciones del resumen.
- **Texto explicativo:** instrucciones, ayudas y descripciones usan interlineado 1.4 para facilitar la lectura.
- **Escritura:** campos nativos de esquinas rectas, hueso sobre tinta, borde pizarra y foco brasa. Los errores añaden texto que indica la primera posición incorrecta, además del borde salmón.
- **Modo guiado:** superficie tinta desplazable con objetivo y siguiente carácter en texto, entrada etiquetada y estado anunciado. Conserva la tipografía y los controles de la recreativa; no impone un límite de tiempo.
- **Móvil:** aviso visible de teclado físico; no se añade teclado virtual.

### Filas de opciones
- **Style:** fila de 44px mínimo con separador inferior pizarra de 0.5u; etiqueta en VT323 y valor a la derecha en Label hueso.
- **Interruptores:** valor apagado en polvo; hover con fondo noche.
- **Deslizador:** pista pizarra de 2u, pulgar hueso rectangular de 3u × 5u.
- **Foco:** contorno brasa de 0.5u con 0.5u de separación.

### Botones segmentados
- **Style:** Title en polvo, borde pizarra de 0.5u, 44px de alto.
- **State:** hover a hueso; activo (`aria-pressed="true"`) invertido, tinta sobre hueso.

### Barras de progreso
- **Style:** pista noche con 0.5u de relleno interior; relleno liquen (oleada), brasa (racha, granada) u óxido (jefe).
- **Motion:** el relleno escala en horizontal (`scaleX`) en `0.25s steps(5)`. Al cargarse la granada, la barra parpadea tres veces en `0.6s steps(2)` y queda fija.

### HUD
Franja tinta con borde inferior pizarra de 1u. Etiquetas en Label polvo con el número dinámico en hueso, puntuación en Title brasa, corazones de píxel 7u × 6u. Cuando el multiplicador está caliente pasa a brasa; cada vez que sube parpadea tres veces y queda fijo. Un corazón perdido destella y se encoge; uno recuperado crece desde `scale(0.6)` en `0.3s steps(3)`.

### Teclas (`kbd`)
Label hueso sobre noche con borde pizarra de 0.5u. Aparecen en ayudas y en el HUD para nombrar teclas reales.

### Cartel de oleada
Headline hueso con relieve de cartel y subtítulo en VT323, centrado al 30 % de altura. Entra desde 4u arriba y se desvanece en `2.6s steps(13)`; con movimiento reducido solo funde. Si anuncia una sinergia, el subtítulo pasa a brasa y cae con un `slam` corto.

## Do's and Don'ts

### Do:
- **Do** medir todo en múltiplos de `--u` y dejar que escale con el canvas.
- **Do** animar con `steps()` y duraciones cortas (0.25–0.8s); el movimiento es un clic, no un deslizamiento.
- **Do** reservar la brasa para foco y urgencia.
- **Do** usar Press Start 2P solo en múltiplos de 8 px y siempre a peso 400.
- **Do** dibujar iconos nuevos como SVG de píxel con `crispEdges` y colores de la paleta.
- **Do** desactivar parpadeos y desplazamientos bajo `prefers-reduced-motion` y respetar las opciones de temblor y CRT.
- **Do** mantener objetivos de 44px mínimo en controles clicables.

### Don't:
- **Don't** redondear esquinas, ni siquiera 1px.
- **Don't** usar degradados suaves, sombras con desenfoque, `backdrop-filter` ni glassmorphism.
- **Don't** usar easing elástico, `ease-in-out` o transiciones interpoladas de posición o escala.
- **Don't** introducir colores fuera de la paleta de 16, ni tonos intermedios «para matizar».
- **Don't** poner en mayúsculas texto con «ó» en Press Start 2P: su «Ó» es idéntica a «ó» y se lee como minúscula. Reescribe el título.
- **Don't** usar negritas ni tamaños de Press Start 2P que no sean múltiplos de 8.
- **Don't** convertir los elementos de menú en botones con caja; el cursor-flecha es la affordance.
