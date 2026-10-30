import { DIFFICULTY_ORDER, VOLUME_MAX, SYNERGIES, HEARTBEAT } from './data/config.js';
import { MAPS, mapIndex } from './data/maps.js';
import { Game } from './core/game.js';
import { isPickup } from './core/zombie.js';
import { createDemo, updateDemo, setDemoMood } from './core/demo.js';
import { clamp } from './core/utils.js';
import { view } from './core/view.js';
import { Renderer } from './render/renderer.js';
import { createUI, keyName } from './platform/ui.js';
import { bindKeyboard } from './platform/input.js';
import { createKeyboardGate } from './platform/keyboard-gate.js';
import { sfx, music, menuMusic, setAudio, onAudioUnlock } from './platform/audio.js';
import {
  loadRecord, saveRecord, clearRecord, loadSettings, saveSettings, loadProgress, saveProgress,
} from './platform/storage.js';
import { sanitizeSettings } from './core/settings.js';
import { EMPTY_PROGRESS, recordProgress, weakKeys } from './core/progress.js';

// Raíz de composición: une lógica, render y navegador, y gestiona los estados.
const renderer = new Renderer(document.getElementById('canvas'));
renderer.resize();

let state = 'menu'; // menu | playing | paused | upgrade | over | options | practice
let optionsFrom = 'menu'; // estado al que vuelve la pantalla de opciones
let pausedFrom = 'playing';
let game = null;
let settings = loadSettings();
let diffKey = settings.difficulty;
let record = loadRecord();
let progress = loadProgress();
let previousProgress = progress;
let lastRecord = false;
let hudTimer = 0;
let lastBeat = 0;
const demo = createDemo();

// Momentos de la partida que solo suenan.
const sounds = {
  spawn: () => { if (Math.random() < 0.4) sfx.groan(); },
  lock: sfx.lock,
  shoot: sfx.shoot,
  miss: sfx.miss,
  kill: sfx.kill,
  hurt: sfx.hurt,
  grenade: sfx.grenade,
  ready: sfx.ready,
  part: sfx.part,
  shift: sfx.shift,
  loot: sfx.loot,
  perfect: sfx.perfect,
};

const ui = createUI({
  start: startGame,
  resume,
  pause,
  previewDifficulty: (key) => setDemoMood(demo, key),
  type: (c) => game.type(c),
  grenade: throwGrenade,
  retry: () => startGame(diffKey),
  upgrade: chooseUpgrade,
  menu: toMenu,
  toggleMute: () => setOption('muted', !settings.muted),
  openOptions,
  closeOptions,
  practice: () => {
    state = 'practice';
    ui.showPractice(game);
  },
  closePractice,
  setOption,
  previewSfx: () => {
    sfx.ensure();
    sfx.shoot();
  },
  resetRecord: () => {
    record = 0;
    progress = EMPTY_PROGRESS;
    clearRecord();
    ui.setRecord(record, progress);
  },
});
ui.setRecord(record, progress);
ui.setPixelSize(view.scale);
applySettings();
ui.showScreen('start');
const keyboardGate = createKeyboardGate();

function applySettings() {
  setAudio({ music: settings.music / VOLUME_MAX, sfx: settings.sfx / VOLUME_MAX, muted: settings.muted });
  ui.setOptions(settings);
}

function setOption(key, value) {
  settings = sanitizeSettings({ ...settings, [key]: value });
  saveSettings(settings);
  applySettings();
}

function openOptions() {
  if (state !== 'menu' && state !== 'paused') return;
  optionsFrom = state;
  state = 'options';
  ui.showScreen('options');
}

function closeOptions() {
  if (state !== 'options') return;
  state = optionsFrom;
  if (state === 'paused') ui.showPause(game);
  else ui.showScreen('start');
}

function closePractice() {
  state = 'over';
  ui.showGameOver(game, lastRecord, previousProgress, progress);
}

function inMenu() {
  return state === 'menu' || (state === 'options' && optionsFrom === 'menu');
}

onAudioUnlock(() => {
  if (inMenu() && !document.hidden) menuMusic.start();
});

function startGame(key) {
  if (!keyboardGate.requireKeyboard()) return;
  sfx.ensure();
  menuMusic.stop();
  diffKey = key;
  if (settings.difficulty !== key) setOption('difficulty', key);
  ui.setHudVisible(true);
  const seen = new Set();
  let synergy = null;
  game = new Game(key, {
    ...sounds,
    // Presenta cada especial la primera vez que sale para que se aprenda su color.
    spawn: (z) => {
      if (!isPickup(z)) sounds.spawn();
      if (game?.guided || !z.type.hint || seen.has(z.kind)) return;
      seen.add(z.kind);
      ui.banner(z.type.name.toUpperCase(), z.type.hint);
    },
    change: (_, g) => ui.updateHud(g),
    wave: ({ wave, total, bonus, boss }, g) => {
      const changed = renderer.setMap(mapIndex(wave)) && wave > 1;
      let sub = `${total} zombis se acercan`;
      if (wave === 1) {
        // La primera partida enseña la regla central; después, lo que se entrena.
        if (progress.games === 0 && !g.guided) sub = 'La primera letra fija el objetivo. Acaba su palabra';
        else sub = g.weak.length ? `Entrenas: ${g.weak.map(keyName).join(', ')}` : 'Escribe para disparar';
      }
      else if (boss) sub = 'Se acerca una abominación';
      else if (bonus) sub = `Superada +${bonus} · ${total} zombis`;
      if (changed) sub = `${MAPS[renderer.map].name} · ${sub}`;
      // La sinergia recién activada ocupa el subtítulo: es lo que hay que celebrar.
      if (synergy) sub = `Sinergia ${SYNERGIES[synergy].name}. ${SYNERGIES[synergy].desc}`;
      synergy = null;
      ui.banner(boss ? `JEFE · OLEADA ${wave}` : `OLEADA ${wave}`, sub);
      ui.updateHud(g);
      sfx.wave();
    },
    upgrade: (choices, g) => {
      state = 'upgrade';
      ui.clearBanner();
      ui.showUpgrades(g, choices);
    },
    synergy: (id) => {
      synergy = id;
      sfx.ready();
    },
    revive: () => {
      ui.banner('SEGUNDA OPORTUNIDAD', 'La barricada aguanta');
      sfx.wave();
    },
    over: endGame,
  }, { guided: settings.guided, weak: weakKeys(progress) });
  state = 'playing';
  ui.setGuided(game.guided);
  ui.showScreen(null);
  game.start();
  music.play(true);
}

function chooseUpgrade(id) {
  if (state !== 'upgrade' || !ui.upgradeReady()) return;
  state = 'playing';
  ui.showScreen(null);
  game.choose(id);
}

function pause() {
  if (state !== 'playing' && state !== 'upgrade') return;
  pausedFrom = state;
  state = 'paused';
  music.pause();
  ui.showPause(game);
}

function resume() {
  if (state !== 'paused') return;
  state = pausedFrom;
  music.play();
  if (state === 'upgrade') ui.showUpgrades(game, game.offer);
  else ui.showScreen(null);
}

function endGame(_, g) {
  state = 'over';
  music.stop();
  sfx.gameOver();
  const isRecord = !g.guided && g.score > record;
  lastRecord = isRecord;
  if (isRecord) {
    record = g.score;
    saveRecord(record);
  }
  const prev = progress;
  previousProgress = prev;
  progress = recordProgress(prev, g);
  if (progress !== prev) saveProgress(progress);
  ui.setRecord(record, progress);
  setTimeout(() => {
    if (state === 'over' && game === g) ui.showGameOver(g, isRecord, prev, progress);
  }, 900);
}

function toMenu() {
  state = 'menu';
  game = null;
  renderer.setMap(0);
  music.stop();
  menuMusic.start();
  ui.setHudVisible(false);
  ui.setGuided(false);
  ui.clearBanner();
  ui.showScreen('start');
}

function throwGrenade() {
  if (state !== 'playing') return;
  if (!game.throwGrenade()) ui.banner('GRANADA SIN CARGA', 'Abate zombis para recargarla');
}

bindKeyboard({
  getState: () => state,
  onChar: (c) => game.type(c),
  onGrenade: throwGrenade,
  onEscape: (s) => {
    if (s === 'playing' || s === 'upgrade') pause();
    else if (s === 'paused') resume();
    else if (s === 'over') toMenu();
    else if (s === 'options') closeOptions();
    else if (s === 'practice') closePractice();
  },
  onOptions: openOptions,
  onDigit: (s, i) => {
    if (s === 'menu') {
      if (DIFFICULTY_ORDER[i]) startGame(DIFFICULTY_ORDER[i]);
    } else if (game.offer?.[i]) chooseUpgrade(game.offer[i]);
  },
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') pause();
  // En segundo plano los temporizadores se ralentizan y el secuenciador tartamudearía.
  if (document.hidden) menuMusic.pause();
  else if (inMenu()) menuMusic.start();
});
window.addEventListener('resize', () => {
  renderer.resize();
  ui.setPixelSize(view.scale);
});

let last = performance.now();
function frame(now) {
  // El primer timestamp de rAF puede ser anterior a `last`.
  const dt = clamp((now - last) / 1000, 0, 0.05);
  last = now;

  // Las opciones abiertas desde la pausa también congelan la partida.
  if (!game) updateDemo(demo, dt, { still: renderer.reducedMotion });
  else if (state !== 'paused' && state !== 'options') game.update(dt);

  const tense = state === 'playing' && game.lives === 1;
  music.setTension(tense);
  const beat = Math.floor(now / 1000 / HEARTBEAT);
  if (tense && beat !== lastBeat) sfx.heartbeat();
  lastBeat = beat;

  if (state === 'playing') {
    if (game.guided) ui.updateGuided(game);
    hudTimer -= dt;
    if (hudTimer <= 0) {
      hudTimer = 0.5;
      ui.updateHud(game);
    }
  }

  renderer.render(state === 'menu' || !game ? demo : game, now / 1000, {
    labels: state === 'playing',
    shake: settings.shake,
  });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
