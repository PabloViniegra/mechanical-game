import { view, updateView, PLAYER_TIP } from '../core/view.js';
import { SPRITES } from './sprites.js';
import { paintBackground } from './background.js';
import { MAPS } from '../data/maps.js';
import { frameIndex, footY, isPickup } from '../core/zombie.js';
import { line, pixelBox, ditherPattern } from './pixel.js';
import { drawChar, drawText, textWidth, hasMarks } from './text.js';
import { clamp, rand } from '../core/utils.js';
import { ZOMBIE_ACCENTS, GLYPH_H, MARK_H } from '../data/art.js';
import { LOOT, HEARTBEAT } from '../data/config.js';
import { PALETTE as C } from '../data/palette.js';

const SHAKE_HZ = 30;

const COLORS = {
  target: C.ember,
  text: C.dust,
  next: C.bone,
  error: C.salmon,
  box: C.ink,
  boxBorder: C.slate,
  danger: C.rust,
  tracer: C.flame,
  boss: C.rust,
  hidden: C.lichen,
  weak: C.cold,
};

// Todo, textos incluidos, se dibuja a baja resolución en un búfer que se amplía
// con un factor entero sin suavizado: un único tamaño de píxel en pantalla.
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.buffer = document.createElement('canvas');
    this.bctx = this.buffer.getContext('2d');
    this.bg = document.createElement('canvas');
    this.map = 0;
    this.shakeStep = -1;
    this.shakeDir = [0, 0];
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = motion.matches;
    motion.addEventListener('change', (event) => { this.reducedMotion = event.matches; });
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    updateView(window.innerWidth, window.innerHeight);
    this.canvas.width = Math.round(window.innerWidth * this.dpr);
    this.canvas.height = Math.round(window.innerHeight * this.dpr);
    this.buffer.width = view.w;
    this.buffer.height = view.h;
    paintBackground(this.bg, MAPS[this.map]);
  }

  setMap(index) {
    if (index === this.map) return false;
    this.map = index;
    paintBackground(this.bg, MAPS[index]);
    return true;
  }

  // scene: { zombies, effects, target, lives, maxLives, shake, hurtFlash, missFlash, muzzle, weak }
  render(scene, t, { labels = false, shake = true } = {}) {
    const b = this.bctx;
    this.weak = scene.weak;
    b.drawImage(this.bg, 0, 0);
    this.drawMist(b, t);
    this.drawBarricade(b, scene.lives / scene.maxLives);
    this.drawPlayer(b, scene.muzzle > 0);

    const ordered = [...scene.zombies].sort((a, c) => a.lane - c.lane);
    for (const z of ordered) this.drawZombie(b, z);
    if (scene.target) this.drawReticle(b, scene.target, t);
    this.drawEffects(b, scene.effects, t);
    if (labels) {
      const placed = [];
      if (scene.target) this.drawLabel(b, scene.target, true, t, placed, false);
      for (const z of ordered) if (!z.dead && z !== scene.target) this.drawLabel(b, z, false, t, placed);
      if (scene.target) this.drawLabel(b, scene.target, true, t, []);
      this.drawFlashes(b, scene, t);
    }

    let ox = 0;
    let oy = 0;
    if (shake && scene.shake > 0 && !this.reducedMotion) {
      // El sacudón cambia a ritmo fijo: sortearlo en cada fotograma haría que
      // temblara más deprisa en pantallas de alta frecuencia.
      const step = Math.floor(t * SHAKE_HZ);
      if (step !== this.shakeStep) {
        this.shakeStep = step;
        this.shakeDir = [rand(-2, 2), rand(-2, 2)];
      }
      const k = scene.shake / 0.4;
      ox = Math.round(this.shakeDir[0] * k);
      oy = Math.round(this.shakeDir[1] * k);
    }
    const ctx = this.ctx;
    const px = view.scale * this.dpr;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.buffer, ox * px, oy * px, view.w * px, view.h * px);
  }

  drawMist(b, t) {
    b.fillStyle = ditherPattern(b, MAPS[this.map].mist, 0.25);
    const band = (view.h - view.horizon) / 4;
    for (let i = 0; i < 4; i++) {
      const w = 80 + i * 24;
      const x = Math.round(((t * (3 + i * 2) + i * 97) % (view.w + w)) - w);
      const y = Math.round(view.horizon + 4 + i * band);
      b.fillRect(x, y, w, 3);
      b.fillRect(x + 6, y - 2, w - 12, 2);
      b.fillRect(x + 10, y + 3, w - 20, 1);
    }
  }

  drawBarricade(b, health) {
    const x = view.barricadeX;
    const top = view.laneTop - 14;
    const bottom = view.laneBottom;
    b.fillStyle = C.ink;
    b.fillRect(x - 2, top, 5, bottom - top);
    b.fillStyle = C.earth;
    b.fillRect(x - 1, top, 3, bottom - top);

    const seg = SPRITES.barricade;
    const count = Math.ceil((bottom - top) / 8);
    const intact = Math.ceil(clamp(health, 0, 1) * count);
    for (let i = 0; i < count; i++) {
      const sprite = (i * 7) % count < intact ? seg : SPRITES.barricadeBroken;
      b.drawImage(sprite, x - Math.floor(seg.width / 2), top + i * 8);
    }
  }

  drawShadow(b, x, y, w) {
    b.fillStyle = ditherPattern(b, C.ink, 0.5);
    b.fillRect(x, y, w, 2);
  }

  drawPlayer(b, firing) {
    const p = SPRITES.player;
    const x = view.playerX - Math.floor(p.width / 2);
    const y = view.playerY - p.height;
    this.drawShadow(b, x + 3, view.playerY - 1, p.width - 6);
    b.drawImage(p, x - (firing ? 1 : 0), y);
    if (firing) {
      const m = SPRITES.muzzle;
      b.drawImage(m, x + PLAYER_TIP.x, y + PLAYER_TIP.y - Math.floor(m.height / 2));
    }
  }

  drawZombie(b, z) {
    const spr = SPRITES.zombies[z.kind];
    const f = frameIndex(z);
    const flash = !this.reducedMotion && (z.hit > 0 || (z.dead && z.deathT < 0.1));
    const img = flash ? spr.flash[f] : spr.frames[f];
    let x = Math.round(z.x - spr.w / 2);
    if (z.shake > 0 && !this.reducedMotion) x += Math.floor(z.shake * 40) % 2 ? 1 : -1;
    const fy = footY(z);

    this.drawShadow(b, x + 3, fy - 1, spr.w - 6);

    if (z.dead) {
      const k = clamp((z.deathT - 0.1) / 0.6, 0, 1);
      const visible = Math.round(spr.h * (1 - k));
      if (visible > 0) b.drawImage(img, 0, 0, spr.w, visible, x, fy - visible, spr.w, visible);
      return;
    }
    if (spr.glow) this.drawGlow(b, spr.glow[f], x, fy - spr.h, z.parts ? 2 : 1);
    b.drawImage(img, x, fy - spr.h);
  }

  // Contorno de color alrededor de la silueta: distingue a especiales y jefe
  // aunque compartan cuerpo con el caminante o el bruto.
  drawGlow(b, glow, x, y, width) {
    for (let d = 1; d <= width; d++) {
      b.drawImage(glow, x - d, y);
      b.drawImage(glow, x + d, y);
      b.drawImage(glow, x, y - d);
      b.drawImage(glow, x, y + d);
    }
  }

  drawReticle(b, z, t) {
    const p = this.reducedMotion ? 0 : Math.floor(t * 4) % 2;
    const x0 = Math.round(z.x - z.w / 2) - 2 - p;
    const y0 = footY(z) - z.h - 2 - p;
    const x1 = x0 + z.w + 3 + p * 2;
    const y1 = footY(z) + 1 + p;
    b.fillStyle = COLORS.target;
    for (const [cx, cy, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
      b.fillRect(Math.min(cx, cx + dx * 2), cy, 3, 1);
      b.fillRect(cx, Math.min(cy, cy + dy * 2), 1, 3);
    }
  }

  drawEffects(b, effects, t) {
    // Las partículas se disuelven con tramado en lugar de volverse translúcidas.
    for (const p of effects.particles) {
      const fade = clamp(p.life / 0.4, 0, 1);
      b.fillStyle = fade < 1 ? ditherPattern(b, p.color, fade) : p.color;
      b.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    for (const s of effects.tracers) line(b, s.x1, s.y1, s.x2, s.y2, COLORS.tracer);

    // Los textos flotantes parpadean antes de desaparecer.
    const blink = this.reducedMotion || Math.floor(t * 12) % 2 === 0;
    for (const tx of effects.texts) {
      if (tx.t < 0.3 && !blink) continue;
      const x = Math.round(tx.x - textWidth(tx.text) / 2);
      const y = Math.round(tx.y) - GLYPH_H;
      drawText(b, tx.text, x, y + 1, C.ink);
      drawText(b, tx.text, x, y, tx.color);
    }
  }

  drawLabel(b, z, isTarget, t, placed, draw = true) {
    // Caja: borde 1, margen 1, [signos], letra, fila del cursor, margen 1, borde 1.
    const word = z.word;
    const marks = hasMarks(word) ? MARK_H : 0;
    const textW = textWidth(word);
    const boxW = textW + 6;
    const boxH = GLYPH_H + marks + 5;
    // El encapuchado solo enseña la siguiente letra hasta que se le apunta.
    const masked = z.masked && !isTarget;
    const pointer = isTarget ? 2 : 0;

    let x = Math.round(z.x - boxW / 2);
    x = clamp(x, 1, view.w - boxW - 1);
    if (z.shake > 0 && !this.reducedMotion) x += Math.floor(z.shake * 40) % 2 ? 1 : -1;
    let y = footY(z) - z.h - 3 - boxH - pointer;
    // Desplaza hacia arriba las etiquetas que se pisan, priorizando el objetivo.
    let previous;
    do {
      previous = y;
      for (const other of placed) {
        if (x < other.x + other.w && x + boxW > other.x && y < other.y + other.h && y + boxH > other.y) {
          y = other.y - boxH - 2;
        }
      }
    } while (y !== previous);
    y = Math.max(1, y);
    placed.push({ x, y, w: boxW, h: boxH });
    if (!draw) return;

    const danger = !isPickup(z) && z.x < view.barricadeX + (view.w - view.barricadeX) * 0.22;
    const blink = this.reducedMotion || Math.floor(t * 6) % 2 === 0;
    const accent = ZOMBIE_ACCENTS[z.kind];
    let border = accent ?? COLORS.boxBorder;
    if (isTarget) border = COLORS.target;
    else if (danger && blink) border = COLORS.danger;

    pixelBox(b, x, y, boxW, boxH, 1, COLORS.box, border);
    if (isTarget) {
      const cx = Math.round(x + boxW / 2 - 1);
      b.fillStyle = border;
      b.fillRect(cx, y + boxH, 3, 1);
      b.fillRect(cx + 1, y + boxH + 1, 1, 1);
    }

    const ty = y + 2 + marks;
    let cx = x + 3;
    for (let i = 0; i < word.length; i++) {
      const hide = masked && i > z.typed && word[i] !== ' ';
      let color = COLORS.text;
      if (i < z.typed) color = COLORS.target;
      else if (isTarget && i === z.typed) color = z.shake > 0 ? COLORS.error : COLORS.next;
      else if (hide) color = COLORS.hidden;
      else if (this.weak.includes(z.folded[i])) color = COLORS.weak;
      const w = drawChar(b, hide ? '?' : word[i], cx, ty, color);
      if (isTarget && i === z.typed) b.fillRect(cx, ty + GLYPH_H + 1, w, 1);
      cx += w + 1;
    }
    // Mientras tiembla, la tecla pulsada por error asoma junto a la que tocaba.
    if (isTarget && z.shake > 0 && z.wrong && z.wrong !== ' ') this.drawWrongKey(b, z.wrong, x, y, boxW, boxH);
    if (z.parts) this.drawBossBar(b, z, x, y, boxW);
    // Cuenta atrás del mutante: la barra se vacía hasta que cambia de palabra.
    if (z.type.shift && !isTarget) {
      b.fillStyle = accent;
      b.fillRect(x, y + boxH + 1, Math.round(boxW * (z.shiftT / z.type.shift)), 1);
    }
    if (isPickup(z)) {
      b.fillStyle = accent;
      b.fillRect(x, y + boxH + 1, Math.round(boxW * (z.lifeT / LOOT.life)), 1);
    }
  }

  // Bordes en penumbra con la última vida; laten al ritmo del corazón salvo
  // que se pida menos movimiento.
  drawVignette(b, t) {
    const beat = !this.reducedMotion && t % HEARTBEAT < 0.12 ? 3 : 0;
    const { w, h } = view;
    for (const [d, density] of [[14 + beat, 0.25], [6 + beat, 0.5]]) {
      b.fillStyle = ditherPattern(b, C.ink, density);
      b.fillRect(0, 0, w, d);
      b.fillRect(0, h - d, w, d);
      b.fillRect(0, d, d, h - d * 2);
      b.fillRect(w - d, d, d, h - d * 2);
    }
  }

  // A la derecha de la etiqueta, o a la izquierda si se saldría de la pantalla.
  drawWrongKey(b, ch, labelX, y, labelW, h) {
    const w = textWidth(ch) + 6;
    let x = labelX + labelW + 1;
    if (x + w > view.w - 1) x = labelX - w - 1;
    pixelBox(b, x, y, w, h, 1, COLORS.box, COLORS.error);
    drawChar(b, ch, x + 3, y + h - GLYPH_H - 3, COLORS.error);
  }

  // Una casilla por palabra que le queda al jefe, encima de su etiqueta.
  drawBossBar(b, z, x, y, boxW) {
    const n = z.parts.length;
    const segW = Math.max(3, Math.floor((boxW - (n - 1)) / n));
    const total = segW * n + (n - 1);
    const x0 = Math.round(x + (boxW - total) / 2);
    const y0 = y - 4;
    b.fillStyle = C.ink;
    b.fillRect(x0 - 1, y0 - 1, total + 2, 4);
    for (let i = 0; i < n; i++) {
      b.fillStyle = i < n - z.part ? COLORS.boss : COLORS.boxBorder;
      b.fillRect(x0 + i * (segW + 1), y0, segW, 2);
    }
  }

  drawFlashes(b, scene, t) {
    if (scene.lives === 1) this.drawVignette(b, t);
    if (scene.hurtFlash > 0 && !this.reducedMotion) {
      b.fillStyle = ditherPattern(b, C.rust, scene.hurtFlash * 1.5);
      b.fillRect(0, 0, view.w, view.h);
    }
    // Marco rojo al fallar o, parpadeando, con la última vida.
    const lastLife = scene.lives === 1 && (this.reducedMotion || Math.floor(t * 3) % 2 === 0);
    if ((!this.reducedMotion && scene.missFlash > 0) || lastLife) {
      const { w, h } = view;
      b.fillStyle = COLORS.danger;
      b.fillRect(0, 0, w, 2);
      b.fillRect(0, h - 2, w, 2);
      b.fillRect(0, 2, 2, h - 4);
      b.fillRect(w - 2, 2, 2, h - 4);
    }
  }
}
