import { rand, pick } from './utils.js';

const GRAVITY = 320;

// Partículas, trazadoras de bala y textos flotantes, en coordenadas del mundo.
export class Effects {
  constructor() {
    this.particles = [];
    this.tracers = [];
    this.texts = [];
  }

  // floorY: altura del suelo donde caen; stay: segundos que permanecen como mancha.
  burst(x, y, { count, colors, force, floorY, stay = 0.3 }) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = Math.random() * force;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - force * 0.5,
        life: rand(0.5, 1),
        size: Math.random() < 0.3 ? 2 : 1,
        color: pick(colors),
        floorY: floorY + rand(-2, 2),
        stay,
        landed: false,
      });
    }
  }

  tracer(x1, y1, x2, y2) {
    this.tracers.push({ x1, y1, x2, y2, t: 0.07 });
  }

  text(x, y, text, color) {
    this.texts.push({ x, y, text, color, t: 1 });
  }

  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      if (p.landed) continue;
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.vy > 0 && p.y >= p.floorY) {
        p.y = p.floorY;
        p.landed = true;
        p.life = p.stay;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const s of this.tracers) s.t -= dt;
    this.tracers = this.tracers.filter((s) => s.t > 0);

    for (const t of this.texts) { t.t -= dt; t.y -= 14 * dt; }
    this.texts = this.texts.filter((t) => t.t > 0);
  }
}
