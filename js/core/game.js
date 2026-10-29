import {
  DIFFICULTY, WORDS, ZOMBIE_TYPES, CROSS_TIME, COMBO_STEP, MAX_MULTIPLIER, BOSS, GRENADE,
  PHRASE_WAVE, PHRASE_CHANCE, UPGRADES, UPGRADE_CHOICES, RARITY, WAVES, GUIDED,
} from '../data/config.js';
import { PALETTE as C } from '../data/palette.js';
import { view, gunTip } from './view.js';
import { Effects } from './effects.js';
import { createZombie, pickKind, pickWord, makePhrase, updateZombie, footY, chestY, reachedBarricade } from './zombie.js';
import { rand, clamp, fold } from './utils.js';

const BLOOD = [C.rust, C.blood];
const GORE = [C.lichen, C.moss, C.rust, C.blood, C.bone];
const SPLINTERS = [C.mud, C.earth, C.rust];
const FIRE = [C.ember, C.flame, C.bone, C.slate];

// Lógica de una partida, sin DOM ni audio. Notifica mediante callbacks:
// change (estadísticas), wave ({ wave, total, bonus, boss }), upgrade (ids a elegir),
// over, revive y los momentos sonoros spawn, lock, shoot, miss, kill, hurt,
// grenade, ready (la granada se carga del todo), part (el jefe pierde una palabra) y shift (un mutante cambia de palabra).
export class Game {
  constructor(diffKey, events = {}, { guided = false } = {}) {
    this.diffKey = diffKey;
    this.guided = guided;
    this.guidedMisses = 0;
    this.diff = DIFFICULTY[diffKey];
    this.events = events;
    this.maxLives = this.diff.lives;
    this.lives = this.diff.lives;
    this.score = 0;
    this.wave = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hits = 0;
    this.misses = 0;
    // Fallos por letra esperada: el resumen final señala la que más cuesta.
    this.missedKeys = {};
    this.kills = 0;
    this.time = 0;
    this.zombies = [];
    this.effects = new Effects();
    this.target = null;
    this.toSpawn = 0;
    this.waveTotal = 0;
    this.waveDone = 0;
    this.spawnTimer = 0;
    this.bossPending = false;
    this.shake = 0;
    this.hurtFlash = 0;
    this.missFlash = 0;
    this.muzzle = 0;
    this.over = false;
    this.perks = {};
    this.offer = null;
    this.bonus = 0;
    this.wireLeft = 0;
    this.revived = false;
    this.grenade = 0;
  }

  start() {
    this.nextWave(0);
  }

  get maxMultiplier() {
    return MAX_MULTIPLIER + this.perk('frenzy');
  }

  get multiplier() {
    return Math.min(this.maxMultiplier, 1 + Math.floor(this.combo / COMBO_STEP));
  }

  get comboProgress() {
    return this.multiplier >= this.maxMultiplier ? 1 : (this.combo % COMBO_STEP) / COMBO_STEP;
  }

  // Letra esperada con más fallos (o null si no hubo ninguno).
  get worstKey() {
    let worst = null;
    for (const [key, count] of Object.entries(this.missedKeys)) {
      if (!worst || count > worst.count) worst = { key, count };
    }
    return worst;
  }

  get accuracy() {
    const total = this.hits + this.misses;
    return total ? Math.round((this.hits / total) * 100) : 100;
  }

  get wpm() {
    return this.time > 3 ? Math.round(this.hits / 5 / (this.time / 60)) : 0;
  }

  get waveProgress() {
    return this.waveTotal ? this.waveDone / this.waveTotal : 0;
  }

  // Vida del jefe en pantalla (0–1), contando letras ya escritas; null si no hay.
  get bossHealth() {
    const z = this.zombies.find((o) => o.parts && !o.dead);
    if (!z) return null;
    return (z.parts.length - z.part - z.typed / z.folded.length) / z.parts.length;
  }

  level(id) {
    return this.perks[id] ?? 0;
  }

  // Efecto acumulado de una mejora: nivel × valor por nivel.
  perk(id) {
    return this.level(id) * UPGRADES[id].value;
  }

  // Precio acumulado de una mejora maldita.
  curse(id) {
    return this.level(id) * (UPGRADES[id].cost ?? 0);
  }

  emit(name, data) {
    this.events[name]?.(data, this);
  }

  nextWave(bonus) {
    this.wave++;
    this.bossPending = this.wave % BOSS.every === 0;
    const total = Math.round((WAVES.size + this.wave * WAVES.perWave) * (1 + this.curse('gravedigger')));
    // En la oleada del jefe le acompaña la mitad de la horda.
    this.toSpawn = this.waveTotal = this.bossPending ? 1 + Math.floor(total / 2) : total;
    this.waveDone = 0;
    this.spawnTimer = this.guided ? 0 : WAVES.firstSpawn;
    this.wireLeft = this.perk('wire');
    this.lives = Math.min(this.maxLives, this.lives + this.perk('gravedigger'));
    if (this.level('quickfuse')) this.grenade = 1;
    this.emit('wave', { wave: this.wave, total: this.waveTotal, bonus, boss: this.bossPending });
  }

  speedFor(kind) {
    const base = ((view.spawnX - view.barricadeX) / CROSS_TIME) * this.diff.speed
      * (1 + (this.wave - 1) * WAVES.speedStep) * (1 - this.perk('frost')) * (1 + this.curse('bloodpact'));
    return ZOMBIE_TYPES[kind].speed * base * rand(0.9, 1.1);
  }

  spawn() {
    if (this.bossPending) {
      this.bossPending = false;
      this.spawnBoss();
      return;
    }
    const kind = pickKind(this.wave);
    const phrase = kind === 'brute' && this.wave >= PHRASE_WAVE && Math.random() < PHRASE_CHANCE;
    const word = phrase ? makePhrase(this.zombies) : pickWord(WORDS[ZOMBIE_TYPES[kind].words], this.zombies);
    const z = createZombie(kind, word, this.speedFor(kind));
    if (this.level('flare')) z.masked = false;
    this.zombies.push(z);
    this.emit('spawn', z);
  }

  // El jefe alterna frases y palabras largas; cada aparición trae una más.
  spawnBoss() {
    const count = BOSS.parts + Math.floor(this.wave / BOSS.every) - 1;
    const parts = Array.from({ length: count }, (_, i) =>
      (i % 2 ? pickWord(WORDS.long, this.zombies) : makePhrase(this.zombies)));
    const z = createZombie('boss', parts[0], this.speedFor('boss'));
    z.parts = parts;
    z.part = 0;
    z.lane = 0.5;
    this.zombies.push(z);
    this.emit('spawn', z);
  }

  // Recibe un carácter ya normalizado (sin tildes, en minúscula). El espacio
  // solo cuenta dentro de una frase: fuera de ella no es un fallo.
  type(c) {
    if (this.over || this.offer) return;
    if (this.guided) {
      this.selectGuidedTarget();
      if (!this.target) return;
    }
    let z = this.target;
    if (!z) {
      // Rebotes y granadas pueden dejar palabras empezadas: se fija por la siguiente letra.
      for (const cand of this.zombies) {
        if (!cand.dead && cand.folded[cand.typed] === c && (!z || cand.x < z.x)) z = cand;
      }
      if (!z) return c === ' ' ? undefined : this.miss(null, c);
      this.target = z;
      this.emit('lock', z);
    }
    if (z.folded[z.typed] !== c) return c === ' ' ? undefined : this.miss(z, c);

    z.typed++;
    this.hits++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.shoot(z);
    if (this.finished(z)) this.complete(z);
    if (this.guided) this.selectGuidedTarget();
    this.emit('change');
  }

  selectGuidedTarget() {
    if (!this.target || this.target.dead || this.target.gone) {
      this.target = this.zombies.find((z) => !z.dead && !z.gone) ?? null;
    }
    if (this.target) this.target.masked = false;
  }

  finished(z) {
    return z.typed >= z.folded.length - this.perk('autoload');
  }

  // Palabra terminada: el jefe pasa a la siguiente; el resto muere.
  complete(z) {
    if (z.parts && z.part < z.parts.length - 1) this.nextPart(z);
    else this.kill(z);
  }

  miss(z, c) {
    this.misses++;
    // La racha que perdona la dificultad y la de sangre fría se acumulan.
    const keep = 1 - (1 - this.diff.keep) * (1 - this.perk('focus'));
    this.combo = Math.floor(this.combo * keep);
    this.score = Math.max(0, this.score - this.diff.cost - this.curse('frenzy'));
    this.missFlash = 0.15;
    if (z) {
      z.shake = 0.25;
      z.wrong = c;
      const key = z.folded[z.typed];
      this.missedKeys[key] = (this.missedKeys[key] ?? 0) + 1;
    }
    this.emit('miss', z);
    if (this.guided && z) {
      this.guidedMisses++;
      if (this.guidedMisses === GUIDED.missesPerLife) {
        this.guidedMisses = 0;
        this.damage(z, 1);
      }
    }
    this.emit('change');
  }

  shoot(z) {
    const tip = gunTip();
    const ty = chestY(z);
    this.effects.tracer(tip.x + 2, tip.y, z.x - 2, ty);
    this.effects.burst(z.x, ty, { count: 3, colors: BLOOD, force: 45, floorY: footY(z), stay: 2 });
    this.muzzle = 0.06;
    z.hit = 0.08;
    z.x += 1.5 + this.perk('heavy');
    this.emit('shoot', z);
  }

  // Arranca n letras sin teclear: rebotes y granadas.
  chip(z, n) {
    for (let i = 0; i < n && !this.finished(z); i++) {
      z.typed++;
      if (z.folded[z.typed] === ' ') z.typed++;
    }
    z.hit = 0.08;
    if (this.finished(z)) this.complete(z);
  }

  award(z) {
    const gain = 1 + this.perk('bounty') + this.perk('bloodpact');
    const points = Math.round(z.word.length * 10 * this.multiplier * z.type.bonus * gain);
    this.score += points;
    this.effects.text(z.x, footY(z) - z.h - 4, `+${points}`, C.flame);
  }

  nextPart(z) {
    this.award(z);
    this.effects.burst(z.x, chestY(z), { count: 20, colors: GORE, force: 80, floorY: footY(z), stay: 5 });
    z.part++;
    z.word = z.parts[z.part];
    z.folded = fold(z.word);
    z.typed = 0;
    z.x += BOSS.push;
    // Furia lineal: la velocidad base crece `rage` por palabra, no se compone.
    z.speed *= (1 + BOSS.rage * z.part) / (1 + BOSS.rage * (z.part - 1));
    this.release(z, BOSS.minions, { reserved: z.parts.slice(z.part + 1), gap: BOSS.minionGap });
    if (this.target === z) this.target = null;
    this.shake = 0.25;
    this.emit('part', z);
  }

  kill(z) {
    z.dead = true;
    // Rebotes, granadas y alambre abaten zombis que no son el objetivo fijado.
    if (this.target === z) this.target = null;
    this.kills++;
    this.waveDone++;
    this.award(z);
    const wasReady = this.grenade >= 1;
    this.grenade = Math.min(1, this.grenade + GRENADE.perKill * (1 + this.perk('fury')));
    if (!wasReady && this.grenade >= 1) this.emit('ready');
    // La racha se nota en el estallido: más salpicadura y, al máximo, chispas de brasa.
    const hot = this.multiplier >= this.maxMultiplier;
    this.effects.burst(z.x, chestY(z), {
      count: 26 + Math.min(this.multiplier - 1, 4) * 4,
      colors: hot ? [...GORE, C.ember, C.flame] : GORE,
      force: 90 + (hot ? 20 : 0),
      floorY: footY(z),
      stay: 5,
    });
    this.emit('kill', z);
    if (z.type.split) this.release(z, z.type.split);
    this.ricochet(z);
  }

  // Suelta `n` corredores desde el zombi; nunca encima de la barricada.
  // `reserved` son palabras aún por salir del jefe: sus iniciales deben seguir libres.
  // `gap` es la distancia mínima a la barricada.
  release(z, n, { reserved = [], gap = 40 } = {}) {
    const x = Math.max(z.x, view.barricadeX + gap);
    for (let i = 0; i < n; i++) {
      const child = createZombie('runner', pickWord(WORDS.short, this.zombies, reserved), this.speedFor('runner'));
      child.x = x + i * 10;
      child.lane = clamp(z.lane + (i - (n - 1) / 2) * 0.3, 0, 1);
      this.zombies.push(child);
      this.emit('spawn', child);
    }
    this.waveTotal += n;
  }

  // Arranca la siguiente letra a los zombis más cercanos al abatido.
  ricochet(from) {
    const near = this.zombies
      // No toca el objetivo fijado para no mover la letra que el jugador espera.
      .filter((z) => !z.dead && !z.gone && z !== this.target)
      .sort((a, b) => Math.abs(a.x - from.x) - Math.abs(b.x - from.x))
      .slice(0, this.perk('ricochet'));
    for (const z of near) {
      if (z.dead) continue; // abatido por un rebote anterior en cadena
      this.effects.tracer(from.x, chestY(from), z.x, chestY(z));
      this.emit('shoot', z);
      this.chip(z, 1);
    }
  }

  throwGrenade() {
    if (this.over || this.offer || this.grenade < 1) return false;
    this.grenade = 0;
    this.shake = 0.4;
    const letters = GRENADE.letters + this.perk('napalm');
    for (const z of this.zombies.filter((o) => !o.dead && !o.gone)) {
      if (z.dead) continue; // abatido en cadena por un rebote
      this.effects.burst(z.x, chestY(z), { count: 14, colors: FIRE, force: 70, floorY: footY(z), stay: 1 });
      z.x += GRENADE.push;
      this.chip(z, letters);
    }
    this.emit('grenade');
    if (this.guided) this.selectGuidedTarget();
    this.emit('change');
    return true;
  }

  shift(z) {
    z.word = pickWord(WORDS[z.type.words], this.zombies.filter((o) => o !== z));
    z.folded = fold(z.word);
    z.typed = 0;
    z.shiftT = z.type.shift;
    z.hit = 0.15;
    this.emit('shift', z);
  }

  breach(z) {
    const boss = Boolean(z.parts);
    if (!boss && this.wireLeft > 0) {
      this.wireLeft--;
      this.kill(z);
      return;
    }
    // El jefe no cae al llegar: golpea y retrocede.
    if (boss) {
      z.x += BOSS.knockback;
    } else {
      z.gone = true;
      if (this.target === z) this.target = null;
      this.waveDone++;
    }
    this.damage(z, boss ? BOSS.damage : 1);
  }

  damage(z, amount) {
    this.lives -= amount;
    if (!this.level('steady')) this.combo = 0;
    this.shake = 0.4;
    this.hurtFlash = 0.35;
    this.effects.burst(view.barricadeX, chestY(z), { count: 18, colors: SPLINTERS, force: 80, floorY: footY(z), stay: 4 });
    this.emit('hurt', z);
    if (this.lives <= 0 && this.level('phoenix') && !this.revived) {
      this.revived = true;
      this.lives = Math.min(this.maxLives, this.perk('phoenix'));
      this.emit('revive');
    }
    this.emit('change');
    if (this.lives <= 0) {
      this.over = true;
      this.emit('over');
    }
  }

  update(dt) {
    this.shake = Math.max(0, this.shake - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    this.missFlash = Math.max(0, this.missFlash - dt);
    this.muzzle = Math.max(0, this.muzzle - dt);
    this.effects.update(dt);
    // Tras perder solo se terminan las animaciones en curso.
    if (this.over) {
      for (const z of this.zombies) if (z.dead) updateZombie(z, dt);
      return;
    }
    // Mientras se elige una mejora la partida queda en suspenso.
    if (this.offer) return;

    this.time += dt;
    if (this.toSpawn > 0 && (!this.guided || !this.zombies.some((z) => !z.dead && !z.gone))) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn();
        this.toSpawn--;
        this.spawnTimer = this.guided ? 0 : Math.max(WAVES.spawnMin, WAVES.spawnStart - this.wave * WAVES.spawnStep)
          * this.diff.spawn * rand(0.7, 1.3);
      }
    }

    for (const z of this.zombies) {
      updateZombie(z, dt, this.guided ? 0 : this.pace(z));
      // El mutante solo cambia mientras nadie le apunta.
      if (!this.guided && z.type.shift && !z.dead && z !== this.target) {
        z.shiftT = Math.max(0, z.shiftT - dt);
        if (z.shiftT === 0) this.shift(z);
      }
      if (!this.guided && !z.dead && reachedBarricade(z)) this.breach(z);
      if (this.over) return;
    }
    this.zombies = this.zombies.filter((z) => !z.gone && !(z.dead && z.deathT > 0.8));
    if (this.guided) this.selectGuidedTarget();

    if (this.toSpawn === 0 && this.zombies.length === 0) {
      this.bonus = this.wave * WAVES.bonus;
      this.score += this.bonus;
      this.offer = this.rollUpgrades();
      this.emit('change');
      if (this.offer.length) this.emit('upgrade', this.offer);
      else this.choose(null);
    }
  }

  // Ralentización de mejoras que dependen del momento, no de la aparición.
  pace(z) {
    const scope = z === this.target ? this.perk('scope') : 0;
    const rush = this.lives === 1 ? this.perk('adrenaline') : 0;
    return (1 - scope) * (1 - rush);
  }

  canOffer(id) {
    if (this.guided && GUIDED.unavailableUpgrades.includes(id)) return false;
    if (this.level(id) >= UPGRADES[id].max) return false;
    // Las bengalas no sirven hasta que los encapuchados están a punto de salir.
    if (id === 'flare') return this.wave >= ZOMBIE_TYPES.masked.from - 1;
    if (id === 'repair') return this.lives < this.maxLives;
    if (id === 'fury') return this.maxLives > 1;
    return true;
  }

  // Sorteo sin repetición ponderado por rareza.
  rollUpgrades() {
    const pool = Object.keys(UPGRADES).filter((id) => this.canOffer(id));
    const picks = [];
    while (picks.length < UPGRADE_CHOICES && pool.length) {
      const weights = pool.map((id) => RARITY[UPGRADES[id].rarity ?? 'common'].weight);
      let r = Math.random() * weights.reduce((a, b) => a + b, 0);
      const i = weights.findIndex((w) => (r -= w) < 0);
      picks.push(...pool.splice(i === -1 ? pool.length - 1 : i, 1));
    }
    return picks;
  }

  // Aplica la mejora elegida (null si no quedaba ninguna) y lanza la siguiente oleada.
  choose(id) {
    if (!this.offer || (id !== null && !this.offer.includes(id))) return;
    if (id) {
      this.perks[id] = this.level(id) + 1;
      if (id === 'armor') {
        this.maxLives += UPGRADES.armor.value;
        this.lives += UPGRADES.armor.value;
      }
      if (id === 'fury') {
        this.maxLives -= UPGRADES.fury.cost;
        this.lives = clamp(this.lives, 1, this.maxLives);
      }
      if (id === 'repair') this.lives = this.maxLives;
    }
    this.offer = null;
    this.nextWave(this.bonus);
    this.emit('change');
  }
}
