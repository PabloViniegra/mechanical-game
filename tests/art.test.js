import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FONT, FONT_MARKS, GLYPH_H, MARK_H } from '../js/data/art.js';
import { WORDS, PHRASES } from '../js/data/config.js';

const strings = (v) => (typeof v === 'string' ? [v] : Object.values(v).flatMap(strings));

test('la fuente tiene todas las letras de las palabras y frases', () => {
  for (const word of strings({ WORDS, PHRASES })) {
    for (const ch of word.toUpperCase()) {
      assert.ok(FONT[ch] || FONT_MARKS[ch], `falta el glifo «${ch}» (${word})`);
    }
  }
});

test('cada glifo es rectangular y del alto común', () => {
  for (const [ch, rows] of Object.entries(FONT)) {
    assert.equal(rows.length, GLYPH_H, ch);
    assert.ok(rows.every((r) => r.length === rows[0].length), ch);
  }
  for (const [ch, [base, ...mark]] of Object.entries(FONT_MARKS)) {
    assert.ok(FONT[base], ch);
    assert.ok(mark.length <= MARK_H, ch);
    assert.ok(mark.every((r) => r.length === FONT[base][0].length), ch);
  }
});
