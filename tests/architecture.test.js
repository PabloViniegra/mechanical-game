import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Cada capa solo puede importar de las capas listadas.
const ALLOWED = {
  data: ['data'],
  core: ['data', 'core'],
  render: ['data', 'core', 'render'],
  platform: ['data', 'core', 'platform'],
};
const BROWSER_GLOBALS = /\b(document|window|localStorage|matchMedia|AudioContext|requestAnimationFrame)\b/;
const UNSAFE_SINKS = /innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function/;

const filesIn = (layer) => readdirSync(join('js', layer)).map((f) => join('js', layer, f));
const importsOf = (src) => [...src.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
const layerOf = (file, spec) => join(file, '..', spec).split('/')[1];

for (const [layer, allowed] of Object.entries(ALLOWED)) {
  test(`${layer}/ solo importa de ${allowed.join(', ')}`, () => {
    for (const file of filesIn(layer)) {
      for (const spec of importsOf(readFileSync(file, 'utf8'))) {
        assert.ok(spec.startsWith('.'), `${file}: import externo ${spec}`);
        assert.ok(allowed.includes(layerOf(file, spec)), `${file} importa ${spec}`);
      }
    }
  });
}

test('data/ y core/ no usan APIs del navegador', () => {
  for (const file of [...filesIn('data'), ...filesIn('core')]) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), BROWSER_GLOBALS, file);
  }
});

test('ningún módulo inyecta HTML ni evalúa código', () => {
  for (const file of ['js/main.js', ...['data', 'core', 'render', 'platform'].flatMap(filesIn)]) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), UNSAFE_SINKS, file);
  }
});

test('todos los colores salen de la paleta', async () => {
  const { PALETTE } = await import('../js/data/palette.js');
  const allowed = new Set(Object.values(PALETTE));
  // Magenta de depuración para claves de sprite que no existen en su paleta.
  allowed.add('#ff00ff');
  const files = ['style.css', 'js/main.js', ...['data', 'core', 'render', 'platform'].flatMap(filesIn)];
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    // Hex con alfa opcional, también escapado en URLs de datos SVG (%23).
    for (const [, hex] of src.matchAll(/(?:#|%23)([0-9a-fA-F]{6})(?:[0-9a-fA-F]{2})?\b/g)) {
      assert.ok(allowed.has(`#${hex.toLowerCase()}`), `${file}: #${hex} no está en la paleta`);
    }
    assert.doesNotMatch(src, /rgba?\(/, `${file}: usa un color de la paleta en lugar de rgb()`);
  }
});
