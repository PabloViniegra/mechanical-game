import { view, gunTip } from './view.js';
import { Effects } from './effects.js';
import { createZombie, updateZombie, chestY, footY } from './zombie.js';
import { rand } from './utils.js';
import { BLOOD, GORE } from '../data/palette.js';

const SPEED = { walker: 1, runner: 1.6, brute: 0.7 };
const KINDS = ['walker', 'runner', 'walker', 'brute', 'walker', 'walker', 'runner', 'walker'];

// Horda y cadencia del título según la dificultad que tiene el cursor.
const MOODS = {
  facil: { count: 4, pace: 0.8, fire: 1.6 },
  normal: { count: 6, pace: 1, fire: 1.1 },
  pesadilla: { count: 8, pace: 1.5, fire: 0.6 },
};

function spawn(kind, x) {
  const z = createZombie(kind, '', rand(8, 14) * SPEED[kind]);
  z.x = x;
  return z;
}

// Escena decorativa del menú: la heroína abate a la horda sin palabras.
// Cumple el mismo contrato de escena que Game para el renderer.
export function createDemo() {
  return {
    zombies: KINDS.slice(0, MOODS.normal.count).map((kind, i) => spawn(kind, view.barricadeX + 60 + i * 50)),
    effects: new Effects(),
    mood: MOODS.normal,
    cooldown: 1,
    target: null,
    lives: 1,
    maxLives: 1,
    shake: 0,
    hurtFlash: 0,
    missFlash: 0,
    muzzle: 0,
    weak: [],
  };
}

export function setDemoMood(demo, difficulty) {
  demo.mood = MOODS[difficulty] ?? MOODS.normal;
  while (demo.zombies.length < demo.mood.count) {
    demo.zombies.push(spawn(KINDS[demo.zombies.length], view.spawnX + rand(0, 80)));
  }
}

// `still` desactiva los disparos para quien pide menos movimiento.
export function updateDemo(demo, dt, { still = false } = {}) {
  const { pace, fire } = demo.mood;
  demo.muzzle = Math.max(0, demo.muzzle - dt);
  demo.shake = Math.max(0, demo.shake - dt);
  demo.effects.update(dt);

  for (const z of demo.zombies) {
    updateZombie(z, dt, pace);
    if (z.dead && z.deathT > 0.7) respawn(z);
    else if (!z.dead && z.x < view.barricadeX + 24) respawn(z);
  }
  // Los sobrantes de un estado anterior más tranquilo se retiran al salir de pantalla.
  while (demo.zombies.length > demo.mood.count) {
    const i = demo.zombies.findIndex((z) => z.x > view.w);
    if (i < 0) break;
    demo.zombies.splice(i, 1);
  }

  demo.cooldown = Math.max(0, demo.cooldown - dt);
  if (still || demo.cooldown > 0) return;
  const near = demo.zombies
    .filter((z) => !z.dead && z.x < view.w - 10)
    .sort((a, b) => a.x - b.x)[0];
  if (!near) return;
  demo.cooldown = fire * rand(0.7, 1.3);
  shoot(demo, near);
}

function respawn(z) {
  z.x = view.spawnX + rand(0, 60);
  z.lane = Math.random();
  z.dead = false;
  z.deathT = 0;
  z.hit = 0;
}

function shoot(demo, z) {
  const tip = gunTip();
  const y = chestY(z);
  demo.effects.tracer(tip.x + 2, tip.y, z.x - 2, y);
  demo.muzzle = 0.06;
  z.hit = 0.08;
  // Tres de cada cuatro tiros abaten al zombi; el resto solo lo hiere.
  if (Math.random() < 0.75) {
    z.dead = true;
    demo.effects.burst(z.x, y, { count: 20, colors: GORE, force: 80, floorY: footY(z), stay: 5 });
  } else {
    demo.effects.burst(z.x, y, { count: 3, colors: BLOOD, force: 45, floorY: footY(z), stay: 2 });
  }
}
