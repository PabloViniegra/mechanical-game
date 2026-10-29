export const rand = (min, max) => min + Math.random() * (max - min);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Quita tildes y diéresis, pero conserva la ñ.
export const fold = (s) =>
  s.toLowerCase().replace(/ñ/g, '\0').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\0/g, 'ñ');

// PRNG determinista para que el escenario no cambie al redimensionar.
export function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
