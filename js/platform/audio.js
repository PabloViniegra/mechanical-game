import { rand } from '../core/utils.js';
import { compileTune } from '../core/tune.js';
import { MENU_TUNE } from '../data/music.js';

// Efectos sintetizados con Web Audio, sin archivos externos.
let ac = null;
let noiseBuf = null;
let muted = false;
let sfxLevel = 1;
let musicLevel = 1;
let track = null;
let menuBus = null; // volumen de la música del menú; persiste entre arranques
let menu = null; // { out, timer, next } mientras suena el tema del menú
let menuStep = 0; // se conserva al pausar para retomar el tema donde iba

function tone(freq, dur, type, vol, slide = 0, delay = 0) {
  if (!ac || muted || !sfxLevel) return;
  synth(ac.destination, ac.currentTime + delay, freq, dur, type, vol * sfxLevel, { slide });
}

function synth(out, t, freq, dur, type, vol, { slide = 0, sustain = false } = {}) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  if (sustain) {
    // Ataque y caída cortos para que suene a tubo de órgano, no a pitido.
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.015);
    gain.gain.setValueAtTime(vol, Math.max(t + 0.015, t + dur - 0.05));
    gain.gain.linearRampToValueAtTime(0, t + dur);
  } else {
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  osc.connect(gain).connect(out);
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
  loot() {
    tone(880, 0.06, 'square', 0.06);
    tone(1320, 0.12, 'square', 0.06, 0, 0.07);
  },
  perfect() {
    tone(523, 0.1, 'square', 0.07);
    tone(659, 0.1, 'square', 0.07, 0, 0.1);
    tone(784, 0.1, 'square', 0.07, 0, 0.2);
    tone(1047, 0.3, 'square', 0.07, 0, 0.3);
  },
  heartbeat() {
    tone(62, 0.12, 'sine', 0.3, -20);
    tone(55, 0.16, 'sine', 0.24, -20, 0.16);
  },
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
// Con la última vida el tema se acelera sin cambiar de tono.
const TENSE_RATE = 1.12;
let tense = false;

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

const MENU_SONG = compileTune(MENU_TUNE);
// Se programa con antelación sobre el reloj de Web Audio; los temporizadores
// de JS solo rellenan la cola, así un fotograma lento no desafina el ritmo.
const MENU_AHEAD = 0.2;
const MENU_TICK = 50;
const MENU_FADE = 0.4;

const instruments = {
  // Fundamental, una copia desafinada que la hace ondular y la octava grave.
  organ: (out, t, e) => {
    synth(out, t, e.freq, e.dur, 'square', 0.07, { sustain: true });
    synth(out, t, e.freq * 1.006, e.dur, 'square', 0.04, { sustain: true });
    synth(out, t, e.freq / 2, e.dur, 'triangle', 0.12, { sustain: true });
  },
  harpsichord: (out, t, e) => {
    synth(out, t, e.freq, 0.18, 'square', 0.05);
    synth(out, t, e.freq * 2, 0.1, 'square', 0.02);
  },
  bass: (out, t, e) => synth(out, t, e.freq, e.dur * 0.95, 'triangle', 0.35, { sustain: true }),
  // El parcial inarmónico (×2,76) es lo que la hace sonar a metal y no a flauta.
  bell: (out, t, e) => {
    synth(out, t, e.freq, 2.5, 'sine', 0.18);
    synth(out, t, e.freq * 2.76, 1.2, 'sine', 0.08);
    synth(out, t, e.freq / 2, 3, 'triangle', 0.1);
  },
};

function menuVolume() {
  return muted ? 0 : MUSIC_VOLUME * musicLevel;
}

function fillMenu() {
  const until = ac.currentTime + MENU_AHEAD;
  // Si la pestaña estuvo congelada, salta lo perdido en vez de amontonarlo.
  if (menu.next < ac.currentTime) menu.next = ac.currentTime + 0.05;
  // En silencio el tema avanza igual, pero sin crear nodos que nadie oye.
  const audible = menuVolume() > 0;
  while (menu.next < until) {
    if (audible) for (const e of MENU_SONG.events[menuStep]) instruments[e.voice](menu.out, menu.next, e);
    menuStep = (menuStep + 1) % MENU_SONG.events.length;
    menu.next += MENU_SONG.stepTime;
  }
}

// `music` y `sfx` van de 0 a 1. Se elevan al cuadrado porque el oído percibe
// el volumen de forma logarítmica y un paso lineal apenas se nota arriba.
export function setAudio({ music: m, sfx: s, muted: off }) {
  musicLevel = m * m;
  sfxLevel = s * s;
  muted = off;
  if (track) applyTrack();
  // Cambio suavizado: saltar el valor de golpe produce chasquidos.
  menuBus?.gain.setTargetAtTime(menuVolume(), ac.currentTime, 0.03);
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
  setTension(on) {
    if (on === tense || !track) return;
    tense = on;
    track.playbackRate = on ? TENSE_RATE : 1;
  },
  stop() {
    this.setTension(false);
    if (!track) return;
    track.pause();
    track.currentTime = 0;
  },
};

// Solo Firefox expone la política; donde no se sabe se espera al primer gesto,
// porque crear el contexto antes llena la consola de avisos.
function canAutoplay() {
  try {
    return navigator.getAutoplayPolicy?.('audiocontext') === 'allowed';
  } catch {
    return false;
  }
}

const UNLOCK_EVENTS = ['keydown', 'pointerdown', 'pointerup'];

// Llama a `cb` en cuanto el navegador deja sonar audio. Escape o apoyar el dedo
// en una pantalla táctil no cuentan como gesto (el toque se activa al levantarlo),
// así que se sigue escuchando hasta recibir uno que sí valga.
export function onAudioUnlock(cb) {
  const unlock = () => {
    const activation = navigator.userActivation;
    if (activation && !activation.isActive && !canAutoplay()) return;
    for (const type of UNLOCK_EVENTS) window.removeEventListener(type, unlock, true);
    sfx.ensure();
    // Se difiere para que la propia pulsación (p. ej. elegir dificultad) cambie
    // antes de pantalla y `cb` vea el estado final.
    setTimeout(cb, 0);
  };
  for (const type of UNLOCK_EVENTS) window.addEventListener(type, unlock, true);
  if (canAutoplay()) unlock();
}

function halt() {
  const { out, timer } = menu;
  menu = null;
  clearInterval(timer);
  const t = ac.currentTime;
  out.gain.setValueAtTime(1, t);
  out.gain.linearRampToValueAtTime(0, t + MENU_FADE);
  setTimeout(() => out.disconnect(), (MENU_FADE + MENU_AHEAD) * 1000 + 100);
}

// Tema del menú. Necesita que `sfx.ensure()` haya creado el contexto tras un gesto.
// Cada arranque tiene su propio nodo de fundido conectado al bus de volumen
// común, así el volumen se aplica también a lo que aún se está desvaneciendo.
export const menuMusic = {
  start() {
    if (!ac || menu) return;
    if (!menuBus) {
      menuBus = ac.createGain();
      menuBus.gain.value = menuVolume();
      menuBus.connect(ac.destination);
    }
    const out = ac.createGain();
    out.connect(menuBus);
    menu = { out, next: ac.currentTime + 0.05, timer: 0 };
    fillMenu();
    menu.timer = setInterval(fillMenu, MENU_TICK);
  },
  // Para sin olvidar por dónde iba, para retomarlo al volver a la pestaña.
  pause() {
    if (menu) halt();
  },
  stop() {
    if (menu) halt();
    menuStep = 0;
  },
};
