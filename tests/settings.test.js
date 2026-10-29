import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSettings } from '../js/core/settings.js';
import { DEFAULT_SETTINGS, VOLUME_MAX } from '../js/data/config.js';

test('sin datos guardados se usan las opciones por defecto', () => {
  for (const raw of [null, undefined, 'basura', 42, []]) {
    assert.deepEqual(sanitizeSettings(raw), DEFAULT_SETTINGS);
  }
});

test('conserva las opciones válidas y descarta las desconocidas', () => {
  const saved = { music: 0, sfx: 3, muted: true, shake: false, crt: false, stats: false, difficulty: 'pesadilla' };
  assert.deepEqual(sanitizeSettings({ ...saved, extra: 1 }), saved);
});

test('los valores inválidos vuelven a su valor por defecto', () => {
  const s = sanitizeSettings({ music: 99, sfx: 2.5, muted: 'true', difficulty: 'toString' });
  assert.equal(s.music, VOLUME_MAX);
  assert.equal(s.sfx, DEFAULT_SETTINGS.sfx);
  assert.equal(s.muted, DEFAULT_SETTINGS.muted);
  assert.equal(s.difficulty, DEFAULT_SETTINGS.difficulty);
});
