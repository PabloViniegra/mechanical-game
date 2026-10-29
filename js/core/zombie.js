import { ZOMBIE_TYPES, PHRASES } from '../data/config.js';
import { ZOMBIE_ART, spriteSize } from '../data/art.js';
import { view, laneY } from './view.js';
import { fold, pick } from './utils.js';

// Caja de colisión de cada tipo, igual al tamaño de su sprite.
const SIZE = Object.fromEntries(
  Object.entries(ZOMBIE_ART).map(([kind, art]) => [kind, spriteSize([...art.body, ...art.legs[0]])]),
);

export function pickKind(wave) {
  let r = Math.random();
  for (const [kind, type] of Object.entries(ZOMBIE_TYPES)) {
    if (!type.from || wave < type.from) continue;
    const chance = Math.min(type.cap, type.step * (wave - type.from + 1));
    if (r < chance) return kind;
    r -= chance;
  }
  return 'walker';
}

// Evita palabras repetidas y, si es posible, iniciales que ya estén en pantalla.
export function pickWord(list, zombies) {
  const alive = zombies.filter((z) => !z.dead);
  const used = new Set(alive.map((z) => z.word));
  const initials = new Set(alive.map((z) => z.folded[0]));
  const fresh = list.filter((w) => !used.has(w));
  const distinct = fresh.filter((w) => !initials.has(fold(w)[0]));
  return pick(distinct.length ? distinct : fresh.length ? fresh : list);
}

// Frase «sustantivo + adjetivo» con el adjetivo concordado en género.
export function makePhrase(zombies) {
  const gender = Math.random() < 0.5 ? 'm' : 'f';
  const adj = pick(PHRASES.adjectives);
  const form = typeof adj === 'string' ? adj : adj[gender === 'm' ? 0 : 1];
  return `${pickWord(PHRASES.nouns[gender], zombies)} ${form}`;
}

export function createZombie(kind, word, speed) {
  return {
    kind,
    type: ZOMBIE_TYPES[kind],
    w: SIZE[kind].w,
    h: SIZE[kind].h,
    word,
    folded: fold(word),
    typed: 0,
    x: view.spawnX,
    lane: Math.random(),
    speed,
    anim: Math.random() * 4,
    hit: 0,
    shake: 0,
    shiftT: ZOMBIE_TYPES[kind].shift ?? 0,
    masked: Boolean(ZOMBIE_TYPES[kind].masked),
    dead: false,
    deathT: 0,
    gone: false,
  };
}

// `pace` frena al zombi (mejoras); los temporizadores siguen a ritmo normal.
export function updateZombie(z, dt, pace = 1) {
  if (z.dead) {
    z.deathT += dt;
    return;
  }
  z.anim += dt * 6 * z.type.speed * pace;
  z.hit = Math.max(0, z.hit - dt);
  z.shake = Math.max(0, z.shake - dt);
  z.x -= z.speed * dt * pace;
}

export const frameIndex = (z) => Math.floor(z.anim) % 4;
export const footY = (z) => laneY(z.lane);
export const chestY = (z) => footY(z) - Math.round(z.h * 0.6);
export const reachedBarricade = (z) => z.x - z.w / 2 <= view.barricadeX + 3;
