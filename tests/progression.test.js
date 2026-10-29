import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { updateView, view } from '../js/core/view.js';
import { fold } from '../js/core/utils.js';
import { createZombie } from '../js/core/zombie.js';
import { LOOT, PERFECT, UPGRADES, UPGRADE_CHOICES, WAVES, WEAK_KEYS } from '../js/data/config.js';
import { Game } from '../js/core/game.js';
import { EMPTY_PROGRESS, sanitizeProgress, recordProgress, weakKeys, trainingReport } from '../js/core/progress.js';

const random = Math.random;
beforeEach(() => updateView(1280, 720));
afterEach(() => { Math.random = random; });

const typeWord = (game, word) => [...fold(word)].forEach((c) => game.type(c));

// Oleada en curso con un único zombi en pantalla y nada más por salir.
function lastZombie(word, events = {}, options = {}) {
  const game = new Game('normal', events, options);
  game.start();
  game.toSpawn = 0;
  const z = createZombie('walker', word, 10);
  game.zombies.push(z);
  return { game, z };
}

// Partida en la oleada 2 donde abatir a `tumba` suelta una caja; `cripta` sigue en pie.
function withCrate(events = {}, setup = () => {}) {
  const { game } = lastZombie('tumba', events);
  const other = createZombie('walker', 'cripta', 10);
  game.zombies.push(other);
  game.wave = LOOT.from;
  setup(game);
  Math.random = () => 0;
  typeWord(game, 'tumba');
  Math.random = random;
  const crate = game.zombies.find((z) => z.loot);
  assert.ok(crate);
  return { game, crate, other };
}

const withPerks = (game, ...ids) => ids.forEach((id) => {
  game.offer = [id];
  game.choose(id);
});

test('el progreso acumula aciertos y fallos por letra y descarta los corruptos', () => {
  const progress = recordProgress(EMPTY_PROGRESS, { wpm: 20, accuracy: 90, hitKeys: { a: 8, ñ: 2 }, missedKeys: { ñ: 3 } });
  const again = recordProgress(progress, { wpm: 20, accuracy: 90, hitKeys: { ñ: 1 }, missedKeys: {} });
  assert.deepEqual(again.keys, { a: [8, 0], ñ: [3, 3] });
  assert.deepEqual(sanitizeProgress({ keys: { ñ: [3, 3], ab: [1, 1], b: 'x', c: [-1, 2] } }).keys, { ñ: [3, 3], c: [0, 2] });
});

test('las letras muy practicadas pierden peso para que se note la mejora', () => {
  const half = WEAK_KEYS.memory / 2;
  const progress = recordProgress(EMPTY_PROGRESS, { wpm: 20, accuracy: 90, hitKeys: { e: half }, missedKeys: { e: half + 2 } });
  assert.deepEqual(progress.keys.e, [half / 2, half / 2 + 1]);
});

test('las teclas débiles son las más falladas con muestras suficientes', () => {
  const n = WEAK_KEYS.minSamples;
  const keys = { ñ: [n / 2, n / 2], b: [n - 3, 3], v: [n * 2 - 1, 1], z: [0, n - 1], a: [n * 10, 0] };
  assert.deepEqual(weakKeys({ keys }), ['ñ', 'b']);
  assert.deepEqual(weakKeys(EMPTY_PROGRESS), []);
});

test('el informe compara la precisión histórica de cada letra entrenada con la de la partida', () => {
  const prev = { keys: { ñ: [6, 4], b: [9, 1] } };
  const game = { weak: ['ñ', 'b', 'v'], hitKeys: { ñ: 9 }, missedKeys: { ñ: 1 } };
  assert.deepEqual(trainingReport(prev, game), [{ key: 'ñ', before: 60, now: 90 }]);
});

test('la partida cuenta los aciertos por letra esperada', () => {
  const { game } = lastZombie('uña');
  typeWord(game, 'uña');
  assert.deepEqual(game.hitKeys, { u: 1, ñ: 1, a: 1 });
});

test('las letras débiles salen más y su zombi puntúa más', () => {
  const { game } = lastZombie('uña', {}, { weak: ['ñ'] });
  typeWord(game, 'uña');
  assert.equal(game.score, Math.round(3 * 10 * (1 + WEAK_KEYS.bonus)));
  Math.random = () => 0;
  assert.ok(game.wordsFor('walker').every((w) => fold(w).includes('ñ')));
});

test('la letra débil solo puntúa más si se teclea', () => {
  const { game, z } = lastZombie('uña', {}, { weak: ['ñ'] });
  game.chip(z, 3);
  assert.ok(z.dead);
  assert.equal(game.score, 3 * 10);
});

test('el espacio nunca es tecla débil porque las palabras no lo tienen', () => {
  const n = WEAK_KEYS.minSamples;
  const progress = recordProgress(EMPTY_PROGRESS, { wpm: 20, accuracy: 90, hitKeys: { b: n - 3 }, missedKeys: { ' ': n, b: 3 } });
  assert.deepEqual(weakKeys(progress), ['b']);
});

test('el modo guiado no sesga las palabras hacia las letras débiles', () => {
  const game = new Game('normal', {}, { guided: true, weak: ['ñ'] });
  assert.deepEqual(game.weak, []);
});

test('una oleada sin fallos ni daño dobla el bonus y ofrece una carta rara más', () => {
  const perfect = [];
  const { game, z } = lastZombie('tumba', { perfect: () => perfect.push(true) });
  typeWord(game, 'tumba');
  game.update(1);
  assert.deepEqual(perfect, [true]);
  assert.equal(game.bonus, WAVES.bonus * PERFECT.bonus);
  assert.equal(game.offer.length, UPGRADE_CHOICES + PERFECT.extra);
  assert.equal(UPGRADES[game.offer[0]].rarity, 'rare');
  assert.ok(z.dead);
});

test('un fallo estropea la oleada perfecta', () => {
  const { game } = lastZombie('tumba');
  game.type('x');
  typeWord(game, 'tumba');
  game.update(1);
  assert.equal(game.perfect, false);
  assert.equal(game.bonus, WAVES.bonus);
  assert.equal(game.offer.length, UPGRADE_CHOICES);
});

test('recibir daño estropea la oleada perfecta', () => {
  const { game, z } = lastZombie('tumba');
  game.update(1);
  z.x = view.barricadeX;
  game.update(0.016);
  game.update(1);
  assert.equal(game.perfect, false);
});

test('una caja de botín se recoge al escribir su palabra', () => {
  const loot = [];
  const { game, crate } = withCrate({ loot: (z) => loot.push(z.loot) });
  assert.equal(crate.loot, 'ammo');
  const charge = game.grenade;
  typeWord(game, crate.word);
  assert.deepEqual(loot, ['ammo']);
  assert.equal(game.grenade, Math.min(1, charge + LOOT.rewards.ammo.value));
});

test('el botiquín solo cae si falta vida y la recupera', () => {
  const { game, crate } = withCrate({}, (g) => { g.lives = 1; });
  assert.equal(crate.loot, 'medkit');
  typeWord(game, crate.word);
  assert.equal(game.lives, 2);
});

test('la caja caduca, nunca golpea la barricada y no retrasa el fin de la oleada', () => {
  const { game, crate, other } = withCrate();
  game.zombies.splice(game.zombies.indexOf(other), 1);
  crate.x = view.barricadeX;
  game.update(0.016);
  assert.equal(game.lives, game.maxLives);
  game.update(1);
  assert.ok(game.offer, 'la oleada termina con la caja aún en pantalla');
  assert.ok(crate.gone);
});

test('la caja desaparece si no se escribe a tiempo', () => {
  const { game, crate } = withCrate();
  game.update(LOOT.life + 0.1);
  assert.ok(crate.gone);
});

test('la caja fijada no caduca a media palabra', () => {
  const { game, crate } = withCrate();
  game.type(crate.folded[0]);
  game.update(LOOT.life + 0.1);
  assert.ok(!crate.gone);
  typeWord(game, crate.folded.slice(1));
  assert.ok(crate.dead);
  assert.equal(game.misses, 0);
});

test('la última baja de la oleada no suelta una caja imposible de coger', () => {
  const { game } = lastZombie('tumba');
  game.wave = LOOT.from;
  Math.random = () => 0;
  typeWord(game, 'tumba');
  assert.ok(!game.zombies.some((z) => z.loot));
});

test('ni la granada ni los rebotes gastan las cajas', () => {
  const { game, crate } = withCrate();
  game.grenade = 1;
  game.throwGrenade();
  assert.equal(crate.typed, 0);
});

test('sin botín en modo guiado ni antes de su oleada', () => {
  Math.random = () => 0;
  const early = lastZombie('tumba');
  early.game.toSpawn = 1;
  typeWord(early.game, 'tumba');
  assert.ok(!early.game.zombies.some((z) => z.loot));
  const guided = lastZombie('tumba', {}, { guided: true });
  guided.game.toSpawn = 1;
  guided.game.wave = LOOT.from;
  typeWord(guided.game, 'tumba');
  assert.ok(!guided.game.zombies.some((z) => z.loot));
});

test('completar una pareja de mejoras activa su sinergia una sola vez', () => {
  const synergies = [];
  const game = new Game('normal', { synergy: (id) => synergies.push(id) });
  game.start();
  assert.deepEqual(game.completes('steady'), []);
  withPerks(game, 'focus');
  assert.deepEqual(game.completes('steady'), ['nerves']);
  withPerks(game, 'steady', 'repair');
  assert.deepEqual(synergies, ['nerves']);
  assert.deepEqual(game.synergies, ['nerves']);
});

test('nervios de acero conserva la racha al fallar', () => {
  const { game } = lastZombie('cripta');
  withPerks(game, 'focus', 'steady');
  game.zombies.push(createZombie('walker', 'cripta', 10));
  typeWord(game, 'cri');
  game.type('x');
  assert.equal(game.combo, 3);
});

test('perforante hace que cada rebote arranque una letra más', () => {
  const game = new Game('normal');
  withPerks(game, 'ricochet', 'heavy');
  const other = createZombie('walker', 'cripta', 10);
  game.zombies.push(createZombie('walker', 'tos', 10), other);
  typeWord(game, 'tos');
  assert.equal(other.typed, 2);
});
