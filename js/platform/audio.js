import { rand } from '../core/utils.js';

// Efectos sintetizados con Web Audio, sin archivos externos.
let ac = null;
let noiseBuf = null;
let muted = false;
let sfxLevel = 1;
let musicLevel = 1;
let track = null;

function tone(freq, dur, type, vol, slide = 0, delay = 0) {
  if (!ac || muted || !sfxLevel) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  gain.gain.setValueAtTime(vol * sfxLevel, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur);
}

function noise(dur, vol, freq) {
  if (!ac || muted || !sfxLevel) return;
  const t = ac.currentTime;
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  src.buffer = noiseBuf;
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  gain.gain.setValueAtTime(vol * sfxLevel, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t);
  src.stop(t + dur);
}

export const sfx = {
  ensure() {
    if (!ac) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return; // Sin Web Audio el juego sigue, solo que en silencio.
      ac = new Ctx();
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
  },
  lock() { tone(1200, 0.04, 'square', 0.03); },
  shoot() { noise(0.07, 0.35, 2200); tone(900, 0.05, 'square', 0.03, -500); },
  kill() { noise(0.2, 0.3, 500); tone(140, 0.3, 'square', 0.1, -90); },
  miss() { tone(95, 0.12, 'square', 0.07); },
  hurt() { tone(220, 0.5, 'sawtooth', 0.18, -170); noise(0.3, 0.3, 300); },
  grenade() { noise(0.6, 0.5, 180); tone(90, 0.6, 'sawtooth', 0.15, -60); },
  ready() {
    tone(660, 0.08, 'square', 0.08);
    tone(990, 0.08, 'square', 0.08, 0, 0.09);
    tone(1320, 0.18, 'square', 0.08, 0, 0.18);
  },
  part() { noise(0.25, 0.35, 400); tone(110, 0.4, 'square', 0.12, -60); },
  shift() { tone(300, 0.18, 'triangle', 0.05, 500); },
  groan() { tone(rand(65, 95), 0.7, 'sawtooth', 0.035, -25); },
  wave() {
    tone(440, 0.12, 'square', 0.07);
    tone(660, 0.25, 'square', 0.07, 0, 0.14);
  },
  gameOver() {
    tone(330, 0.3, 'square', 0.08, -60);
    tone(220, 0.3, 'square', 0.08, -50, 0.3);
    tone(110, 0.8, 'square', 0.08, -50, 0.6);
  },
};

const MUSIC_VOLUME = 0.35;

// La música va en <audio> y no en Web Audio: decodificar el tema entero
// ocuparía decenas de MB en memoria.
function getTrack() {
  if (!track && typeof Audio === 'function') {
    track = new Audio('assets/music/8-bit-spooky.webm');
    track.loop = true;
    applyTrack();
  }
  return track;
}

function applyTrack() {
  track.volume = MUSIC_VOLUME * musicLevel;
  track.muted = muted;
}

// `music` y `sfx` van de 0 a 1. Se elevan al cuadrado porque el oído percibe
// el volumen de forma logarítmica y un paso lineal apenas se nota arriba.
export function setAudio({ music: m, sfx: s, muted: off }) {
  musicLevel = m * m;
  sfxLevel = s * s;
  muted = off;
  if (track) applyTrack();
}

export const music = {
  play(restart = false) {
    const t = getTrack();
    if (!t) return;
    if (restart) t.currentTime = 0;
    // play() se rechaza si el navegador bloquea el audio; el juego sigue sin música.
    t.play()?.catch(() => {});
  },
  pause() { track?.pause(); },
  stop() {
    if (!track) return;
    track.pause();
    track.currentTime = 0;
  },
};
