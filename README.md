# Apocalipsis QWERTY

Arcade de mecanografía en español con pixel art: escribe las palabras de los zombis para detener la horda y sobrevivir a oleadas cada vez más difíciles.

## Cómo jugar

- Escribe la primera letra para fijar un objetivo y completa su palabra para disparar. Las tildes y la diéresis son opcionales; la `ñ` cuenta como una letra distinta.
- Pulsa **Enter** para lanzar la granada cuando esté cargada y **Esc** para pausar.
- Elige mejoras entre oleadas y enfréntate a un jefe cada cinco oleadas. La puntuación, la precisión y las palabras por minuto ayudan a seguir tu progreso.

El juego está pensado para un navegador de escritorio con teclado físico.

## Ejecutar en local

Requisitos: Python 3 para servir los archivos y Node.js 24 o posterior con npm para las herramientas de desarrollo. No hay paso de compilación ni dependencias de ejecución en el navegador.

```sh
npm ci
npm start
```

Abre [http://localhost:8000](http://localhost:8000). Hay que usar un servidor local: los módulos JavaScript no se cargan correctamente desde `file://`.

## Comprobaciones

```sh
npm run check
```

Ejecuta Oxlint, comprueba la sintaxis y ejecuta los tests unitarios con Node. También puedes usar `npm run lint` y `npm test` por separado. Las opciones y los récords se guardan localmente en el navegador.

Para las pruebas de navegador, instala Chromium una vez (y tras actualizar Playwright):

```sh
npx playwright install chromium
npm run test:e2e
```

En Linux/CI, si faltan bibliotecas del sistema, usa `npx playwright install --with-deps chromium` en un entorno con permisos para instalarlas.

Playwright arranca el servidor local o reutiliza el de `127.0.0.1:8000` fuera de CI. La suite `e2e/` prueba menú, partida, pausa, opciones, modo guiado, game over y reintento en Chromium a 1280×900 y 800×600 (este último con movimiento reducido). Falla si detecta errores, avisos de consola o violaciones de CSP, sin desactivar la política. Guarda capturas y trazas de los fallos en `test-results/`.

## Tecnología y créditos

JavaScript vanilla con módulos ES, HTML y CSS. Oxlint y Playwright son dependencias solo de desarrollo; el juego no carga paquetes externos. Los sprites se dibujan en canvas y las fuentes se sirven desde el propio proyecto.

Las licencias de las fuentes están en [`assets/fonts/`](assets/fonts/). La música «8 Bit Spooky» es de HeatleyBros; consulta la atribución y las condiciones indicadas en [`assets/music/CREDITS.txt`](assets/music/CREDITS.txt).
