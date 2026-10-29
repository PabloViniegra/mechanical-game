import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileTune, noteToFreq } from '../js/core/tune.js';
import { MENU_TUNE } from '../js/data/music.js';

test('las notas se convierten a su frecuencia temperada', () => {
  assert.equal(noteToFreq('A4'), 440);
  assert.ok(Math.abs(noteToFreq('C4') - 261.63) < 0.01);
  assert.ok(Math.abs(noteToFreq('A#4') / noteToFreq('A4') - 2 ** (1 / 12)) < 1e-9);
  assert.throws(() => noteToFreq('H4'));
});

test('los guiones alargan la nota y los puntos son silencio', () => {
  const song = compileTune({ bpm: 60, tracks: { organ: ['A4 - - . C5 . . . . . . . . . . .'] } });
  const organ = song.events.map((evs) => evs[0]);
  assert.equal(song.stepTime, 0.25);
  assert.equal(organ[0].dur, 0.75);
  assert.equal(organ[3], undefined);
  assert.equal(organ[4].freq, noteToFreq('C5'));
});

test('una pista con compases incompletos o de más se rechaza', () => {
  const bar = 'D3 . . . . . . . . . . . . . . .';
  assert.throws(() => compileTune({ bpm: 60, tracks: { organ: ['D5 . .'] } }));
  assert.throws(() => compileTune({ bpm: 60, tracks: { organ: [bar], bass: [bar, bar] } }));
});

test('el tema del menú es válido y el bajo nunca se queda sin sonar al empezar compás', () => {
  const song = compileTune(MENU_TUNE);
  assert.equal(song.events.length, MENU_TUNE.tracks.organ.length * 16);
  for (let step = 0; step < song.events.length; step += 16) {
    assert.ok(song.events[step].some((e) => e.voice === 'bass'));
  }
});
