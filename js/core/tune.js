const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const BAR_STEPS = 16;

export function noteToFreq(name) {
  const m = /^([A-G])(#?)(\d)$/.exec(name);
  if (!m) throw new Error(`Nota no válida: ${name}`);
  const midi = (Number(m[3]) + 1) * 12 + SEMITONES[m[1]] + (m[2] ? 1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

// Convierte la partitura de `data/music.js` en eventos por semicorchea para
// que el secuenciador solo tenga que recorrer una lista.
export function compileTune({ bpm, tracks }) {
  const stepTime = 60 / bpm / 4;
  const bars = Object.values(tracks)[0].length;
  const events = Array.from({ length: bars * BAR_STEPS }, () => []);

  for (const [voice, rows] of Object.entries(tracks)) {
    if (rows.length !== bars) throw new Error(`La pista ${voice} no tiene ${bars} compases`);
    let held = null;
    rows.forEach((row, bar) => {
      const tokens = row.trim().split(/\s+/);
      if (tokens.length !== BAR_STEPS) throw new Error(`La pista ${voice} tiene un compás ${bar + 1} incompleto`);
      tokens.forEach((tok, i) => {
        if (tok === '-') {
          if (held) held.dur += stepTime;
          return;
        }
        held = null;
        if (tok === '.') return;
        held = { voice, freq: noteToFreq(tok), dur: stepTime };
        events[bar * BAR_STEPS + i].push(held);
      });
    });
  }

  return { stepTime, events };
}
