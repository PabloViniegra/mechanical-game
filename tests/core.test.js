import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { updateView, view } from '../js/core/view.js';
import { fold } from '../js/core/utils.js';
import { createZombie, pickWord, makePhrase } from '../js/core/zombie.js';
import { WORDS, PHRASES, UPGRADES, WAVES } from '../js/data/config.js';
import { Game } from '../js/core/game.js';
import { EMPTY_PROGRESS, sanitizeProgress, recordProgress } from '../js/core/progress.js';

beforeEach(() => updateView(1280, 720));

const typeWord = (game, word) => [...fold(word)].forEach((c) => game.type(c));

test('fold quita tildes y diéresis pero conserva la ñ', () => {
  assert.equal(fold('Ataúd'), 'ataud');
  assert.equal(fold('pingüino'), 'pinguino');
  assert.equal(fold('Uña'), 'uña');
});

test('pickWord evita palabras e iniciales que ya están en pantalla', () => {
  const onScreen = [createZombie('walker', 'tumba', 10)];
  for (let i = 0; i < 50; i++) {
    assert.equal(pickWord(['tumba', 'tos', 'hacha'], onScreen), 'hacha');
  }
});

test('escribir sin tildes una palabra con tildes abate al zombi y puntúa', () => {
  const kills = [];
  const game = new Game('normal', { kill: (z) => kills.push(z.word) });
  game.zombies.push(createZombie('walker', 'ataúd', 10));
  typeWord(game, 'ataud');
  assert.deepEqual(kills, ['ataúd']);
  assert.equal(game.score, 5 * 10);
  assert.equal(game.target, null);
});

test('un fallo rompe la racha sin perder el objetivo', () => {
  const game = new Game('normal');
  const z = createZombie('walker', 'cripta', 10);
  game.zombies.push(z);
  typeWord(game, 'cr');
  game.type('x');
  assert.equal(game.combo, 0);
  assert.equal(game.misses, 1);
  assert.equal(game.target, z);
});

test('la partida termina cuando los zombis agotan las vidas', () => {
  let over = 0;
  const game = new Game('pesadilla', { over: () => over++ });
  game.start();
  for (let i = 0; i < game.maxLives; i++) {
    const z = createZombie('walker', `z${i}`, 0);
    z.x = 0;
    game.zombies.push(z);
  }
  game.update(0.016);
  assert.equal(game.lives, 0);
  assert.equal(over, 1);
});

// Partida con la primera oleada recién superada y la oferta de mejoras abierta.
function clearedGame(events = {}) {
  const game = new Game('normal', events);
  game.start();
  game.toSpawn = 0;
  game.update(0.016);
  return game;
}

const withPerk = (game, id) => {
  game.offer = [id];
  game.choose(id);
};

test('las listas de palabras no repiten y solo usan letras escribibles', () => {
  for (const list of [...Object.values(WORDS), PHRASES.nouns.m, PHRASES.nouns.f]) {
    assert.equal(new Set(list).size, list.length);
    for (const w of list) assert.match(fold(w), /^[a-zñ]+$/);
  }
});

test('las frases concuerdan el adjetivo con el género del sustantivo', () => {
  const masc = new Set(PHRASES.nouns.m);
  for (let i = 0; i < 200; i++) {
    const [noun, adj] = makePhrase([]).split(' ');
    const forms = PHRASES.adjectives.find((a) => (typeof a === 'string' ? a === adj : a.includes(adj)));
    assert.ok(forms, adj);
    if (typeof forms !== 'string') assert.equal(forms[masc.has(noun) ? 0 : 1], adj);
  }
});

test('el espacio solo cuenta dentro de una frase y nunca es un fallo', () => {
  const kills = [];
  const game = new Game('normal', { kill: (z) => kills.push(z.word) });
  game.zombies.push(createZombie('brute', 'momia gris', 10));
  game.type(' ');
  typeWord(game, 'momia gris');
  assert.equal(game.misses, 0);
  assert.deepEqual(kills, ['momia gris']);
});

test('superar una oleada ofrece mejoras y espera a la elección', () => {
  const offers = [];
  const waves = [];
  const game = clearedGame({ upgrade: (ids) => offers.push(ids), wave: ({ wave }) => waves.push(wave) });
  assert.equal(offers.length, 1);
  assert.equal(offers[0].length, 3);
  assert.ok(offers[0].every((id) => id in UPGRADES && id !== 'repair'));
  game.update(5);
  assert.equal(game.zombies.length, 0);
  assert.deepEqual(waves, [1]);

  game.choose(offers[0][0]);
  assert.equal(game.level(offers[0][0]), 1);
  assert.equal(game.offer, null);
  assert.deepEqual(waves, [1, 2]);
});

test('no se puede elegir una mejora que no está en la oferta', () => {
  const game = clearedGame();
  const absent = Object.keys(UPGRADES).find((id) => !game.offer.includes(id));
  game.choose(absent);
  assert.equal(game.level(absent), 0);
  assert.equal(game.wave, 1);
});

test('la barricada reforzada suma una vida máxima ya recuperada', () => {
  const game = clearedGame();
  withPerk(game, 'armor');
  assert.equal(game.maxLives, 4);
  assert.equal(game.lives, 4);
});

test('el rebote arranca letras a otro zombi sin tocar el objetivo', () => {
  const kills = [];
  const game = new Game('normal', { kill: (z) => kills.push(z.word) });
  game.perks.ricochet = 1;
  const near = createZombie('walker', 'ojo', 10);
  game.zombies.push(createZombie('walker', 'tos', 10), near);
  typeWord(game, 'tos');
  assert.equal(near.typed, 1);
  // La palabra empezada se fija por su siguiente letra.
  typeWord(game, 'jo');
  assert.deepEqual(kills, ['tos', 'ojo']);
  assert.equal(game.misses, 0);
});

test('el alambre de espino abate al primer zombi que llega sin quitar vida', () => {
  const game = clearedGame();
  withPerk(game, 'wire');
  for (const word of ['uno', 'dos']) {
    const z = createZombie('walker', word, 0);
    z.x = 0;
    game.zombies.push(z);
  }
  game.update(0.016);
  assert.equal(game.lives, game.maxLives - 1);
  assert.equal(game.kills, 1);
});

test('sangre fría reduce la racha a la mitad en vez de perderla', () => {
  const game = new Game('normal');
  game.perks.focus = 1;
  game.zombies.push(createZombie('walker', 'cripta', 10));
  typeWord(game, 'crip');
  game.type('x');
  assert.equal(game.combo, 2);
});

test('el cargador automático dispara la última letra', () => {
  const game = new Game('normal');
  game.perks.autoload = 1;
  game.zombies.push(createZombie('walker', 'tumba', 10));
  typeWord(game, 'tumb');
  assert.equal(game.kills, 1);
});

test('la granada solo se lanza cargada y daña a toda la horda', () => {
  const kills = [];
  const game = new Game('normal', { kill: (z) => kills.push(z.word) });
  const long = createZombie('walker', 'cripta', 10);
  game.zombies.push(createZombie('runner', 'ojo', 10), long);
  assert.equal(game.throwGrenade(), false);

  game.grenade = 1;
  assert.equal(game.throwGrenade(), true);
  assert.equal(long.typed, 2);
  assert.equal(game.hits, 0);
  // A 'ojo' le queda una letra: sigue vivo.
  assert.deepEqual(kills, []);
  assert.equal(game.grenade, 0);
  // Tras la granada se puede seguir la palabra empezada.
  typeWord(game, 'ipta');
  assert.deepEqual(kills, ['cripta']);
});

test('cada zombi abatido carga la granada', () => {
  const game = new Game('normal');
  for (const w of ['tos', 'ojo']) {
    game.zombies.push(createZombie('walker', w, 10));
    typeWord(game, w);
  }
  assert.ok(Math.abs(game.grenade - 0.2) < 1e-9);
});

test('avisa una sola vez al completarse la carga de la granada', () => {
  let ready = 0;
  const game = new Game('normal', { ready: () => ready++ });
  game.grenade = 0.9;
  for (const w of ['tos', 'ojo']) {
    game.zombies.push(createZombie('walker', w, 10));
    typeWord(game, w);
  }
  assert.equal(game.grenade, 1);
  assert.equal(ready, 1);
});

test('el hinchado suelta corredores al morir y alargan la oleada', () => {
  const game = new Game('normal');
  game.start();
  const total = game.waveTotal;
  game.zombies.push(createZombie('splitter', 'tumba', 10));
  typeWord(game, 'tumba');
  const runners = game.zombies.filter((z) => !z.dead);
  assert.equal(runners.length, 2);
  assert.ok(runners.every((z) => z.kind === 'runner'));
  assert.equal(game.waveTotal, total + 2);
});

test('el mutante cambia de palabra si nadie le apunta', () => {
  const shifts = [];
  const game = new Game('normal', { shift: (z) => shifts.push(z) });
  game.start();
  game.toSpawn = 0;
  const z = createZombie('shifter', 'cripta', 0);
  game.zombies.push(z);
  game.type('c');
  game.update(10);
  assert.equal(shifts.length, 0);

  game.target = null;
  z.typed = 0;
  game.update(5.1);
  assert.equal(shifts.length, 1);
  assert.equal(z.typed, 0);
  assert.equal(z.folded, fold(z.word));
});

test('cada cinco oleadas aparece un jefe con varias palabras', () => {
  const parts = [];
  const kills = [];
  const game = new Game('normal', { part: (z) => parts.push(z.part), kill: (z) => kills.push(z.kind) });
  game.wave = 4;
  game.nextWave(0);
  game.spawn();
  const boss = game.zombies[0];
  assert.equal(boss.kind, 'boss');
  assert.equal(boss.parts.length, 3);

  typeWord(game, boss.parts[0]);
  assert.deepEqual(parts, [1]);
  assert.equal(boss.dead, false);
  assert.equal(game.target, null);
  typeWord(game, boss.parts[1]);
  typeWord(game, boss.parts[2]);
  assert.deepEqual(kills, ['boss']);
});

test('la vida del jefe baja con cada palabra y desaparece al abatirlo', () => {
  const game = new Game('normal');
  assert.equal(game.bossHealth, null);
  game.wave = 4;
  game.nextWave(0);
  game.spawn();
  const boss = game.zombies[0];
  assert.equal(game.bossHealth, 1);
  typeWord(game, boss.parts[0]);
  assert.equal(game.bossHealth, 2 / 3);
  typeWord(game, boss.parts[1]);
  typeWord(game, boss.parts[2]);
  assert.equal(game.bossHealth, null);
});

test('el jefe quita dos vidas, retrocede y el alambre no lo detiene', () => {
  const game = clearedGame();
  withPerk(game, 'wire');
  game.wave = 4;
  game.nextWave(0);
  game.spawn();
  const boss = game.zombies[0];
  boss.x = 0;
  game.update(0.016);
  assert.equal(game.lives, game.maxLives - 2);
  assert.equal(boss.dead, false);
  assert.ok(boss.x > 0);
});

test('segunda oportunidad devuelve dos vidas una sola vez', () => {
  let over = 0;
  const revives = [];
  const game = new Game('pesadilla', { over: () => over++, revive: () => revives.push(1) });
  game.perks.phoenix = 1;
  game.start();
  const breachWith = (n) => {
    for (let i = 0; i < n; i++) {
      const z = createZombie('walker', `z${i}`, 0);
      z.x = 0;
      game.zombies.push(z);
    }
    game.update(0.016);
  };
  breachWith(2);
  assert.equal(game.lives, 2);
  assert.equal(over, 0);
  breachWith(2);
  assert.equal(over, 1);
  assert.equal(revives.length, 1);
});

test('las mejoras malditas cobran su precio', () => {
  const game = clearedGame();
  withPerk(game, 'fury');
  assert.equal(game.maxLives, 2);
  assert.equal(game.lives, 2);

  game.perks.frenzy = 1;
  game.score = 100;
  game.combo = 200;
  assert.equal(game.multiplier, 7);
  game.type('#');
  assert.equal(game.score, 50);
});

test('furia no se ofrece si solo queda una vida máxima', () => {
  const game = clearedGame();
  game.maxLives = 1;
  game.lives = 1;
  for (let i = 0; i < 50; i++) assert.ok(!game.rollUpgrades().includes('fury'));
});

test('la oferta nunca repite mejoras', () => {
  const game = clearedGame();
  for (let i = 0; i < 50; i++) {
    const offer = game.rollUpgrades();
    assert.equal(new Set(offer).size, offer.length);
  }
});

test('la mira telescópica frena solo al zombi fijado', () => {
  const game = new Game('normal');
  game.start();
  game.perks.scope = 2;
  const locked = createZombie('walker', 'tumba', 10);
  const free = createZombie('walker', 'cripta', 10);
  game.zombies.push(locked, free);
  game.type('t');
  const start = locked.x;
  game.update(1);
  assert.ok(Math.abs(start - locked.x - 5) < 0.01);
  assert.ok(Math.abs(view.spawnX - free.x - 10) < 0.01);
});

test('la adrenalina frena a la horda cuando queda una vida', () => {
  const game = new Game('normal');
  game.start();
  game.perks.adrenaline = 1;
  const z = createZombie('walker', 'tumba', 10);
  game.zombies.push(z);
  game.update(1);
  assert.ok(Math.abs(view.spawnX - z.x - 10) < 0.01);
  game.lives = 1;
  game.update(1);
  assert.ok(Math.abs(view.spawnX - z.x - 16) < 0.01);
});

test('las bengalas destapan a los encapuchados y no se ofrecen antes de tiempo', () => {
  const game = clearedGame();
  for (let i = 0; i < 50; i++) assert.ok(!game.rollUpgrades().includes('flare'));
  game.perks.flare = 1;
  game.wave = 10;
  game.bossPending = false;
  let z;
  for (let i = 0; i < 1000 && z?.kind !== 'masked'; i++) {
    game.zombies = [];
    game.spawn();
    z = game.zombies[0];
  }
  assert.equal(z.kind, 'masked');
  assert.equal(z.masked, false);
  assert.ok(createZombie('masked', 'tumba', 10).masked);
});

test('pulso firme conserva la racha al recibir un golpe', () => {
  const game = clearedGame();
  withPerk(game, 'steady');
  game.combo = 20;
  const z = createZombie('walker', 'tumba', 0);
  z.x = 0;
  game.zombies.push(z);
  game.update(0.016);
  assert.equal(game.lives, game.maxLives - 1);
  assert.equal(game.combo, 20);
});

test('el trato del sepulturero cura al empezar la oleada y la alarga', () => {
  const game = clearedGame();
  game.lives = 1;
  withPerk(game, 'gravedigger');
  assert.equal(game.lives, 2);
  assert.equal(game.waveTotal, Math.round((WAVES.size + 2 * WAVES.perWave) * 1.25));
});

test('el intervalo entre apariciones no baja del mínimo', () => {
  const game = new Game('normal');
  game.start();
  game.wave = 40;
  game.bossPending = false;
  game.update(game.spawnTimer);
  assert.ok(game.spawnTimer >= WAVES.spawnMin * 0.7);
});

test('en fácil un fallo conserva media racha y en pesadilla resta puntos', () => {
  const easy = new Game('facil');
  easy.zombies.push(createZombie('walker', 'cripta', 10));
  typeWord(easy, 'crip');
  easy.type('x');
  assert.equal(easy.combo, 2);

  const hard = new Game('pesadilla');
  hard.score = 50;
  hard.zombies.push(createZombie('walker', 'cripta', 10));
  typeWord(hard, 'crip');
  hard.type('x');
  assert.equal(hard.combo, 0);
  assert.equal(hard.score, 40);
});

test('sangre fría se suma al perdón de fácil', () => {
  const game = new Game('facil');
  game.perks.focus = 1;
  game.zombies.push(createZombie('walker', 'cripta', 10));
  typeWord(game, 'crip');
  game.type('x');
  assert.equal(game.combo, 3);
});

test('worstKey señala la letra esperada que más se falla', () => {
  const game = new Game('normal');
  assert.equal(game.worstKey, null);
  game.zombies.push(createZombie('walker', 'uña', 10));
  typeWord(game, 'u');
  game.type('n');
  game.type('n');
  typeWord(game, 'ña');
  assert.deepEqual(game.worstKey, { key: 'ñ', count: 2 });
});

test('el progreso descarta valores corruptos y guarda mejor y última marca', () => {
  assert.deepEqual(sanitizeProgress({ games: -1, bestWpm: 'x', lastWpm: 12, bestAccuracy: 400 }),
    { games: 0, bestWpm: 0, lastWpm: 12, bestAccuracy: 100 });
  const first = recordProgress(EMPTY_PROGRESS, { wpm: 20, accuracy: 90 });
  const second = recordProgress(first, { wpm: 15, accuracy: 95 });
  assert.deepEqual(second, { games: 2, bestWpm: 20, lastWpm: 15, bestAccuracy: 95 });
  assert.equal(recordProgress(second, { wpm: 0, accuracy: 0 }), second);
});
