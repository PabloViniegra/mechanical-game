# Apocalipsis QWERTY

Arcade de mecanografía en español con pixel art: escribe las palabras de los zombis para detener la horda y sobrevivir a oleadas cada vez más difíciles.

## Cómo jugar

- Escribe la primera letra para fijar un objetivo y completa su palabra para disparar. Las tildes y la diéresis son opcionales; la `ñ` cuenta como una letra distinta.
- Pulsa **Enter** para lanzar la granada cuando esté cargada y **Esc** para pausar.
- Elige mejoras entre oleadas y enfréntate a un jefe cada cinco oleadas. La puntuación, la precisión y las palabras por minuto ayudan a seguir tu progreso.

El juego está pensado para un navegador de escritorio con teclado físico.

## Ejecutar en local

Requisitos: Python 3 para servir los archivos y Node.js 20 o posterior con npm para ejecutar los comandos y las pruebas. No hay dependencias que instalar ni paso de compilación.

```sh
npm start
```

Abre [http://localhost:8000](http://localhost:8000). Hay que usar un servidor local: los módulos JavaScript no se cargan correctamente desde `file://`.

## Comprobaciones

```sh
npm run check
```

Comprueba la sintaxis y ejecuta las pruebas con Node. Las opciones y los récords se guardan localmente en el navegador.

## Tecnología y créditos

JavaScript vanilla con módulos ES, HTML y CSS, sin dependencias externas. Los sprites se dibujan en canvas y las fuentes se sirven desde el propio proyecto.

Las licencias de las fuentes están en [`assets/fonts/`](assets/fonts/). La música «8 Bit Spooky» es de HeatleyBros; consulta la atribución y las condiciones indicadas en [`assets/music/CREDITS.txt`](assets/music/CREDITS.txt).
