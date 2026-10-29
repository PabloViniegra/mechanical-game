import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../js/core/game.js';
import { updateView } from '../js/core/view.js';
import { createZombie } from '../js/core/zombie.js';
import { GUIDED } from '../js/data/config.js';
import { EMPTY_PROGRESS, recordProgress } from '../js/core/progress.js';

beforeEach(() => updateView(1280, 720));

test('el modo guiado espera sin daño ni nuevas amenazas y fija el objetivo', () => {
  const game = new Game('normal', {}, { guided: true });
  game.start();
  game.update(0.05);
  const target = game.target;
  assert.ok(target);
  const x = target.x;
  for (let i = 0; i < 600; i++) game.update(0.05);
  assert.equal(game.lives, 3);
  assert.equal(game.target, target);
  assert.equal(target.x, x);
  assert.equal(game.zombies.length, 1);
});

test('los errores guiados cuestan vidas y terminan la partida sin borrar el objetivo', () => {
  let ended = 0;
  const game = new Game('pesadilla', { over: () => ended++ }, { guided: true });
  game.zombies.push(createZombie('walker', 'uña', 10));
  game.type('u');
  for (let i = 0; i < GUIDED.missesPerLife; i++) game.type('n');
  assert.equal(game.lives, 1);
  assert.equal(game.target.typed, 1);
  assert.deepEqual(game.worstKey, { key: 'ñ', count: GUIDED.missesPerLife });
  for (let i = 0; i < GUIDED.missesPerLife; i++) game.type('n');
  assert.equal(game.over, true);
  assert.equal(ended, 1);
  game.type('n');
  assert.equal(ended, 1);
});

test('completar una oleada guiada ofrece mejoras útiles y permite continuar', () => {
  let offers = 0;
  const game = new Game('normal', { upgrade: () => offers++ }, { guided: true });
  game.start();
  const total = game.waveTotal;
  for (let i = 0; i < total; i++) {
    game.update(1);
    for (const letter of game.target.folded) game.type(letter);
  }
  game.update(1);
  assert.equal(offers, 1);
  assert.equal(game.kills, total);
  assert.ok(game.score > 0);
  for (const id of GUIDED.unavailableUpgrades) assert.equal(game.canOffer(id), false);
  game.choose(game.offer[0]);
  assert.equal(game.wave, 2);
  game.update(0.05);
  assert.ok(game.target);
});

test('el modo guiado revela encapuchados y no cambia palabras durante la lectura', () => {
  const game = new Game('normal', {}, { guided: true });
  const masked = createZombie('masked', 'uña', 10);
  const shifter = createZombie('shifter', 'tumba', 10);
  game.zombies.push(masked, shifter);
  game.update(10);
  assert.equal(game.target.masked, false);
  assert.equal(shifter.word, 'tumba');
  for (const letter of 'uña') game.type(letter);
  assert.equal(game.target, shifter);
});

test('el modo guiado recorre las palabras de un jefe y sus corredores divididos', () => {
  const game = new Game('normal', {}, { guided: true });
  const boss = createZombie('boss', 'uña', 10);
  boss.parts = ['uña', 'tumba'];
  boss.part = 0;
  game.zombies.push(boss);
  for (const letter of 'uña') game.type(letter);
  assert.equal(game.target.word, 'tumba');
  for (const letter of 'tumba') game.type(letter);
  assert.equal(game.kills, 1);
  game.zombies.push(createZombie('splitter', 'ojo', 10));
  for (const letter of 'ojo') game.type(letter);
  assert.equal(game.target.kind, 'runner');
  const first = game.target;
  for (const letter of first.folded) game.type(letter);
  assert.notEqual(game.target, first);
  assert.equal(game.target.kind, 'runner');
});

test('los resultados guiados no alteran el progreso arcade', () => {
  const prev = recordProgress(EMPTY_PROGRESS, { wpm: 20, accuracy: 90, diffKey: 'facil', time: 60 });
  assert.equal(recordProgress(prev, { wpm: 90, accuracy: 100, diffKey: 'facil', time: 60, guided: true }), prev);
});
