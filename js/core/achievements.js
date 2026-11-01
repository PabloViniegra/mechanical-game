import { ACHIEVEMENTS, ACHIEVEMENT_RULES as RULES, ZOMBIE_TYPES, UPGRADES } from '../data/config.js';
import { view } from './view.js';

// Logros del jugador. El perfil guarda lo desbloqueado y los contadores que
// abarcan varias partidas; `AchievementTracker` observa una partida concreta.

const IDS = new Set(ACHIEVEMENTS.map((a) => a.id));
const KINDS = Object.keys(ZOMBIE_TYPES).filter((kind) => !ZOMBIE_TYPES[kind].pickup);
// Los que dependen de un contador se revisan en cada fotograma.
const COUNTED = ACHIEVEMENTS.filter((a) => a.stat && a.stat !== 'collection');
// Coleccionista se mide sobre el resto para no contarse a sí mismo.
const COLLECTABLE = ACHIEVEMENTS.filter((a) => a.stat !== 'collection');

const count = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : 0);
const known = (list, valid) => (Array.isArray(list) ? [...new Set(list.filter((v) => valid.has(v)))] : []);

export function sanitizeProfile(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    unlocked: known(src.unlocked, IDS),
    kills: count(src.kills),
    misses: count(src.misses),
    games: count(src.games),
    kinds: known(src.kinds, new Set(KINDS)),
    lastDay: count(src.lastDay),
    days: count(src.days),
  };
}

// Día del calendario local como entero, para comparar días consecutivos.
export function dayNumber(date) {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

export const collection = (unlocked) =>
  Math.floor((COLLECTABLE.filter((a) => unlocked.includes(a.id)).length / COLLECTABLE.length) * 100);

export class AchievementTracker {
  // `day` es el día de juego (dayNumber); `onUnlock` recibe la definición del logro.
  constructor(profile, game, { day = 0, onUnlock = () => {} } = {}) {
    this.profile = { ...profile, unlocked: [...profile.unlocked], kinds: [...profile.kinds] };
    this.unlocked = new Set(profile.unlocked);
    this.game = game;
    this.onUnlock = onUnlock;
    this.chain = 0; // palabras seguidas sin fallo ni daño
    this.clean = 0; // palabras seguidas sin fallo
    this.killTimes = [];
    this.loot = 0;
    this.bossHits = new Set(); // jefes que han llegado a golpear
    // Distancia mínima de cada zombi a la barricada: el disparo lo empuja
    // atrás justo antes de morir y medir entonces castigaría a Balas pesadas.
    this.closest = new WeakMap();
    this.hurt = false;
    this.typed = 0;
    this.idleSince = 0;
    this.idleMax = 0;
    this.waveStart(game);
    const p = this.profile;
    if (day && day !== p.lastDay) {
      p.days = day === p.lastDay + 1 ? p.days + 1 : 1;
      p.lastDay = day;
    }
    this.check();
  }

  has(id) {
    return this.unlocked.has(id);
  }

  unlock(id) {
    if (this.has(id)) return;
    this.unlocked.add(id);
    this.profile.unlocked.push(id);
    this.onUnlock(ACHIEVEMENTS.find((a) => a.id === id));
    const percent = collection(this.profile.unlocked);
    for (const a of ACHIEVEMENTS) if (a.stat === 'collection' && percent >= a.goal) this.unlock(a.id);
  }

  waveStart(g) {
    this.waveHits = g.hits;
    this.waveMisses = g.misses;
    this.breached = false;
    this.onOne = g.lives === 1;
  }

  // Solo cuentan las palabras que el jugador termina tecleando.
  word(z) {
    const out = this.game.typedOut;
    if (out?.zombie !== z) return false;
    this.chain++;
    this.clean++;
    if (!out.word.includes(' ') && out.keyed > RULES.longWord) this.unlock('longWord');
    return true;
  }

  gap(z) {
    return z.x - z.w / 2 - view.barricadeX;
  }

  handle(name, data) {
    const g = this.game;
    const p = this.profile;
    if (g.lives !== 1) this.onOne = false;
    if (name === 'wave') {
      this.waveStart(g);
      if (g.wave >= RULES.minimalist && !Object.keys(g.perks).length) this.unlock('minimalist');
      if (g.wave >= RULES.perfectRun && !this.hurt) this.unlock('perfectRun');
      if (g.diffKey === 'pesadilla' && g.wave >= RULES.nightmare) this.unlock('nightmare10');
      const cursed = Object.keys(g.perks).filter((id) => UPGRADES[id].rarity === 'cursed');
      if (cursed.length >= RULES.devilPact) this.unlock('devilPact');
    } else if (name === 'clear') {
      if (!this.breached) this.unlock('untouchable');
      if (g.misses === this.waveMisses && g.hits > this.waveHits) this.unlock('surgeon');
      if (g.perfect) this.unlock('perfectWave');
      if (this.onOne) this.unlock('phoenix');
      if (data === RULES.pacifist.wave && this.idleMax >= RULES.pacifist.idle) this.unlock('pacifist');
    } else if (name === 'kill') {
      this.kill(data);
    } else if (name === 'part') {
      this.word(data);
    } else if (name === 'loot') {
      this.word(data);
      if (++this.loot >= RULES.looter) this.unlock('looter');
    } else if (name === 'miss') {
      p.misses++;
      this.chain = 0;
      this.clean = 0;
    } else if (name === 'hurt') {
      this.breached = true;
      this.hurt = true;
      if (data?.parts) this.bossHits.add(data);
      this.chain = 0;
    } else if (name === 'over') {
      p.games++;
    } else if (name === 'grenade') {
      if (data >= RULES.grenadier) this.unlock('grenadier');
    } else if (name === 'synergy') {
      this.unlock('alchemist');
    } else if (name === 'revive') {
      this.unlock('lazarus');
    }
    this.check();
  }

  kill(z) {
    const g = this.game;
    const p = this.profile;
    p.kills++;
    if (!p.kinds.includes(z.kind)) p.kinds.push(z.kind);
    if (KINDS.every((kind) => p.kinds.includes(kind))) this.unlock('bestiary');
    if (z.kind === 'boss') this.unlock('bossHunter');
    if (z.kind === 'boss' && !this.bossHits.has(z)) this.unlock('giantSlayer');
    this.killTimes = [...this.killTimes, g.time].filter((t) => g.time - t < RULES.burst.seconds);
    if (this.killTimes.length >= RULES.burst.kills) this.unlock('burst');
    if (!this.word(z)) return;
    const gap = Math.min(this.gap(z), this.closest.get(z) ?? Infinity);
    if (gap <= RULES.lastMoment) this.unlock('lastMoment');
  }

  // Cada fotograma de juego: lo que depende del tiempo y no de un evento.
  update() {
    const g = this.game;
    if (g.lives !== 1) this.onOne = false;
    for (const z of g.hostiles) this.closest.set(z, Math.min(this.gap(z), this.closest.get(z) ?? Infinity));
    const typed = g.hits + g.misses;
    if (typed !== this.typed) {
      this.typed = typed;
      this.idleSince = g.time;
    }
    if (g.wave === RULES.pacifist.wave) this.idleMax = Math.max(this.idleMax, g.time - this.idleSince);
    this.check();
  }

  check() {
    const g = this.game;
    const p = this.profile;
    const stats = {
      wave: g.wave,
      time: g.time,
      wpm: g.time >= RULES.wpmMinTime ? g.wpm : 0,
      chain: this.chain,
      clean: this.clean,
      kills: p.kills,
      misses: p.misses,
      games: p.games,
      days: p.days,
    };
    for (const a of COUNTED) if (stats[a.stat] >= a.goal) this.unlock(a.id);
  }
}
