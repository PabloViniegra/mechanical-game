import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { updateView, view } from '../js/core/view.js';
import { fold } from '../js/core/utils.js';
import { createZombie } from '../js/core/zombie.js';
import { Game } from '../js/core/game.js';
import { ACHIEVEMENTS } from '../js/data/config.js';
import { AchievementTracker, sanitizeProfile } from '../js/core/achievements.js';

beforeEach(() => updateView(1280, 720));

// Partida con el rastreador cableado como en main.js y sin más apariciones.
function play({ profile = {}, day, lives } = {}) {
  const unlocked = [];
  let tracker = null;
  const events = new Proxy({}, { get: (_, name) => (data) => tracker?.handle(name, data) });
  const game = new Game('normal', events);
  if (lives) game.lives = lives;
  tracker = new AchievementTracker(sanitizeProfile(profile), game, { day, onUnlock: (a) => unlocked.push(a.id) });
  game.start();
  game.toSpawn = 0;
  return { game, tracker, unlocked };
}

function kill(game, word, kind = 'walker', x) {
  const z = createZombie(kind, word, 10);
  if (x !== undefined) z.x = x;
  game.zombies.push(z);
  [...fold(word)].forEach((c) => game.type(c));
  return z;
}

// Zombi que llega a la barricada en el siguiente fotograma.
function breach(game) {
  const z = createZombie('walker', 'cripta', 10);
  z.x = view.barricadeX;
  game.zombies.push(z);
  game.update(0.016);
  // Retira a los abatidos, que siguen en la lista mientras dura su animación.
  game.update(1);
}

test('una oleada limpia desbloquea Intocable, Pulso de cirujano y Racha perfecta', () => {
  const { game, unlocked } = play();
  kill(game, 'tumba');
  game.update(1);
  assert.ok(['untouchable', 'surgeon', 'perfectWave'].every((id) => unlocked.includes(id)));
});

test('un fallo impide la precisión perfecta, pero no Intocable', () => {
  const { game, unlocked } = play();
  game.zombies.push(createZombie('walker', 'tumba', 10));
  game.type('x');
  [...'tumba'].forEach((c) => game.type(c));
  game.update(1);
  assert.ok(unlocked.includes('untouchable'));
  assert.ok(!unlocked.includes('surgeon') && !unlocked.includes('perfectWave'));
});

test('recibir daño impide Intocable', () => {
  const { game, unlocked } = play();
  kill(game, 'tumba');
  breach(game);
  assert.equal(game.lives, 2);
  assert.ok(game.offer);
  assert.ok(!unlocked.includes('untouchable'));
});

test('Fénix exige pasar toda la oleada con una sola vida', () => {
  const one = play({ lives: 1 });
  kill(one.game, 'tumba');
  one.game.update(1);
  assert.ok(one.unlocked.includes('phoenix'));

  const two = play();
  breach(two.game);
  assert.equal(two.game.lives, 2);
  assert.ok(!two.unlocked.includes('phoenix'));
});

test('abatir al jefe da Cazador de jefes y completa el Bestiario', () => {
  const kinds = ['walker', 'brute', 'runner', 'masked', 'splitter', 'shifter'];
  const { game, tracker, unlocked } = play({ profile: { kinds } });
  const boss = createZombie('boss', 'tumba', 10);
  game.zombies.push(boss);
  [...'tumba'].forEach((c) => game.type(c));
  assert.ok(boss.dead);
  assert.ok(unlocked.includes('bossHunter') && unlocked.includes('bestiary'));
  assert.ok(tracker.profile.kinds.includes('boss'));
});

test('Palabra larga pide más de 12 letras', () => {
  const { game, unlocked } = play();
  kill(game, 'putrefacción');
  assert.ok(!unlocked.includes('longWord'));
  kill(game, 'descomposición');
  assert.ok(unlocked.includes('longWord'));
});

test('los contadores acumulados continúan desde el perfil guardado', () => {
  const { game, tracker, unlocked } = play({ profile: { kills: 99, misses: 99, games: 9 } });
  game.zombies.push(createZombie('walker', 'tumba', 10));
  game.type('x');
  [...'tumba'].forEach((c) => game.type(c));
  assert.ok(unlocked.includes('kills100') && unlocked.includes('clumsy'));
  assert.ok(!unlocked.includes('games10'));
  game.lives = 1;
  breach(game);
  assert.ok(game.over);
  assert.equal(tracker.profile.games, 10);
  assert.ok(unlocked.includes('games10'));
});

test('Regreso cuenta días seguidos y un hueco reinicia la racha', () => {
  const streak = play({ profile: { lastDay: 100, days: 2 }, day: 101 });
  assert.ok(streak.unlocked.includes('comeback'));
  const gap = play({ profile: { lastDay: 100, days: 2 }, day: 102 });
  assert.equal(gap.tracker.profile.days, 1);
  assert.ok(!gap.unlocked.includes('comeback'));
  const sameDay = play({ profile: { lastDay: 100, days: 2 }, day: 100 });
  assert.equal(sameDay.tracker.profile.days, 2);
});

test('Ráfaga exige cinco bajas en menos de tres segundos', () => {
  const words = ['tumba', 'cripta', 'hueso', 'garra', 'larva'];
  const slow = play();
  for (const word of words) {
    kill(slow.game, word);
    slow.game.time += 1;
  }
  assert.ok(!slow.unlocked.includes('burst'));
  const fast = play();
  for (const word of words) kill(fast.game, word);
  assert.ok(fast.unlocked.includes('burst'));
});

test('Última milésima solo cuenta junto a la barricada', () => {
  const { game, tracker, unlocked } = play();
  kill(game, 'tumba', 'walker', view.barricadeX + 100);
  assert.ok(!unlocked.includes('lastMoment'));
  const z = createZombie('walker', 'putrefaccion', 10);
  z.x = view.barricadeX + z.w / 2 + 2;
  game.zombies.push(z);
  tracker.update();
  // Los disparos lo alejan más allá del margen antes de morir: cuenta lo cerca que llegó.
  [...'putrefaccion'].forEach((c) => game.type(c));
  assert.ok(z.dead && z.x - z.w / 2 - view.barricadeX > 12);
  assert.ok(unlocked.includes('lastMoment'));
});

test('lo que termina una granada no suma al Combo ni a Palabra larga', () => {
  const { game, unlocked } = play();
  ['tumba', 'cripta', 'hueso', 'garra', 'larva', 'moho'].forEach((w) => kill(game, w));
  // A cada palabra le faltan las dos letras que arranca la granada.
  for (const word of ['ojo', 'pie', 'tos', 'descomposicion']) {
    const z = createZombie('runner', word, 10);
    z.typed = word.length - 2;
    game.zombies.push(z);
  }
  game.grenade = 1;
  game.throwGrenade();
  assert.equal(game.kills, 10);
  assert.ok(!unlocked.includes('chain10') && !unlocked.includes('longWord'));
});

test('Pacifista: 30 segundos sin escribir en la oleada 1 y superarla', () => {
  const { game, tracker, unlocked } = play();
  game.zombies.push(createZombie('walker', 'tumba', 0));
  for (let i = 0; i < 31; i++) {
    game.update(1);
    tracker.update();
  }
  assert.ok(!unlocked.includes('pacifist'));
  [...'tumba'].forEach((c) => game.type(c));
  game.update(1);
  assert.ok(unlocked.includes('pacifist'));
});

test('Minimalista y Partida perfecta al llegar a la oleada 10 sin mejoras ni daño', () => {
  const bare = play();
  bare.game.wave = 9;
  bare.game.offer = ['frost'];
  bare.game.choose(null);
  assert.ok(['wave10', 'minimalist', 'perfectRun'].every((id) => bare.unlocked.includes(id)));

  const upgraded = play();
  upgraded.game.wave = 9;
  upgraded.game.offer = ['frost'];
  upgraded.game.choose('frost');
  assert.ok(!upgraded.unlocked.includes('minimalist'));
});

test('el PPM no cuenta hasta pasados 30 segundos', () => {
  const { game, tracker, unlocked } = play();
  game.hits = 200;
  game.time = 10;
  tracker.update();
  assert.ok(!unlocked.includes('wpm60'));
  game.time = 31;
  tracker.update();
  assert.ok(unlocked.includes('wpm60'));
});

test('un daño rompe el Combo, aunque no sea un fallo de tecleo', () => {
  const words = ['tumba', 'cripta', 'hueso', 'garra', 'larva', 'moho', 'nuca', 'pozo', 'faro', 'eco'];
  const { game, unlocked } = play();
  words.slice(0, 5).forEach((w) => kill(game, w));
  game.lives = 5;
  game.toSpawn = 1; // que la oleada no termine al recibir el golpe
  breach(game);
  words.slice(5).forEach((w) => kill(game, w));
  assert.ok(!unlocked.includes('chain10'));

  const clean = play();
  words.forEach((w) => kill(clean.game, w));
  assert.ok(clean.unlocked.includes('chain10'));
});

test('Coleccionista se desbloquea al completar el resto', () => {
  const rest = ACHIEVEMENTS.filter((a) => a.stat !== 'collection' && a.id !== 'longWord').map((a) => a.id);
  const { game, unlocked } = play({ profile: { unlocked: rest } });
  kill(game, 'descomposición');
  assert.deepEqual(unlocked, ['longWord', 'collector50', 'collector100']);
});

test('el perfil guardado descarta logros, tipos y contadores no válidos', () => {
  const profile = sanitizeProfile({ unlocked: ['wave5', 'hack', 'wave5'], kinds: ['boss', 'crate'], kills: -3, games: 2.5 });
  assert.deepEqual(profile.unlocked, ['wave5']);
  assert.deepEqual(profile.kinds, ['boss']);
  assert.equal(profile.kills, 0);
  assert.equal(profile.games, 0);
});

test('Granadero cuenta las bajas de una sola granada', () => {
  const { game, unlocked } = play();
  // A cada palabra le faltan las dos letras que arranca la granada.
  for (const word of ['ojo', 'pie', 'tos', 'sed']) {
    const z = createZombie('runner', word, 10);
    z.typed = 1;
    game.zombies.push(z);
  }
  game.grenade = 1;
  game.throwGrenade();
  assert.equal(game.kills, 4);
  assert.ok(unlocked.includes('grenadier'));
});

test('Matagigantes exige que el jefe no llegue a golpear', () => {
  const clean = play();
  kill(clean.game, 'tumba', 'boss');
  assert.ok(clean.unlocked.includes('giantSlayer'));

  const hit = play();
  hit.game.lives = 5;
  const boss = createZombie('boss', 'tumba', 10);
  boss.parts = ['tumba'];
  boss.part = 0;
  boss.x = view.barricadeX;
  hit.game.zombies.push(boss);
  hit.game.update(0.016);
  assert.equal(hit.game.lives, 3);
  [...'tumba'].forEach((c) => hit.game.type(c));
  assert.ok(boss.dead);
  assert.ok(hit.unlocked.includes('bossHunter') && !hit.unlocked.includes('giantSlayer'));
});

test('Saqueador pide cinco cajas en la misma partida', () => {
  const { game, unlocked } = play();
  const words = ['ojo', 'pie', 'tos', 'sed', 'red'];
  words.forEach((word, i) => {
    const crate = createZombie('crate', word, 0);
    crate.loot = 'cash';
    game.zombies.push(crate);
    [...word].forEach((c) => game.type(c));
    assert.equal(unlocked.includes('looter'), i === words.length - 1);
  });
});

test('mejoras: sinergia, tres malditas y Segunda oportunidad', () => {
  const { game, unlocked } = play();
  for (const id of ['ricochet', 'heavy', 'bloodpact', 'gravedigger', 'frenzy', 'phoenix']) {
    game.offer = [id];
    game.choose(id);
  }
  assert.ok(unlocked.includes('alchemist') && unlocked.includes('devilPact'));
  game.lives = 1;
  breach(game);
  assert.ok(!game.over);
  assert.ok(unlocked.includes('lazarus'));
});

test('guardar funde lo que otra pestaña guardó entretanto sin perder lo propio', () => {
  const [mine, theirs] = ACHIEVEMENTS.filter((x) => !x.stat).map((x) => x.id);
  const { tracker } = play({ profile: { misses: 5, unlocked: [mine] } });
  tracker.handle('miss');
  tracker.handle('miss');
  const merged = tracker.sync(sanitizeProfile({ misses: 50, unlocked: [theirs] }));
  assert.equal(merged.misses, 52);
  assert.deepEqual(new Set(merged.unlocked), new Set([mine, theirs]));
  // Sin almacenamiento lo leído llega vacío: no debe borrar lo de esta sesión.
  tracker.handle('miss');
  assert.equal(tracker.sync(sanitizeProfile(null)).misses, 53);
});

test('la racha de días continúa la que otra pestaña guardó el día anterior', () => {
  const { tracker } = play({ profile: { lastDay: 8, days: 3 }, day: 10 });
  const merged = tracker.sync(sanitizeProfile({ lastDay: 9, days: 4 }));
  assert.equal(merged.lastDay, 10);
  assert.equal(merged.days, 5);
});
