import { view } from './view.js';
import { Effects } from './effects.js';
import { createZombie, updateZombie } from './zombie.js';
import { rand } from './utils.js';

const SPEED = { walker: 1, runner: 1.6, brute: 0.7 };

// Escena decorativa del menú: zombis que deambulan sin palabras.
// Cumple el mismo contrato de escena que Game para el renderer.
export function createDemo() {
  return {
    zombies: ['walker', 'runner', 'walker', 'brute', 'walker'].map((kind, i) => {
      const z = createZombie(kind, '', rand(8, 14) * SPEED[kind]);
      z.x = view.barricadeX + 60 + i * 50;
      return z;
    }),
    effects: new Effects(),
    target: null,
    lives: 1,
    maxLives: 1,
    shake: 0,
    hurtFlash: 0,
    missFlash: 0,
    muzzle: 0,
  };
}

export function updateDemo(demo, dt) {
  for (const z of demo.zombies) {
    updateZombie(z, dt);
    if (z.x < view.barricadeX + 24) {
      z.x = view.spawnX + rand(0, 60);
      z.lane = Math.random();
    }
  }
}
