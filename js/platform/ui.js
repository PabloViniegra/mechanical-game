import { UPGRADES, RARITY, WORDS, ZOMBIE_TYPES, GUIDED, SYNERGIES } from '../data/config.js';
import { fold } from '../core/utils.js';
import { practiceFeedback } from '../core/practice.js';
import { trainingReport, weakKeys } from '../core/progress.js';

const $ = (sel) => document.querySelector(sel);

// Capa DOM: HUD, cartel de oleada y pantallas superpuestas.
const UPGRADE_GUARD_MS = 400;

// Compara el PPM con la partida anterior: la mejora es el motivo para volver.
function progressText(wpm, prev) {
  if (!wpm) return '';
  if (!prev.games) return `Sin partidas recientes comparables. Marca actual: ${wpm} PPM.`;
  const delta = wpm - prev.lastWpm;
  const vs = delta === 0 ? 'Igual que la anterior'
    : `${Math.abs(delta)} ${delta > 0 ? 'más' : 'menos'} que la anterior`;
  if (wpm > prev.bestWpm) return `¡Mejor velocidad de tus partidas recientes en esta dificultad! ${vs}.`;
  return `Mejor velocidad reciente: ${prev.bestWpm} PPM · ${vs}.`;
}

// Convierte el fallo más repetido en algo que practicar la próxima vez.
function adviceText(game) {
  if (game.hits && !game.misses) return 'Ni un fallo. Los zombis no se lo explican.';
  const worst = game.worstKey;
  if (!worst) return '';
  const space = worst.key === ' ';
  const key = space ? 'El espacio' : `La «${worst.key.toUpperCase()}»`;
  const times = worst.count === 1 ? 'vez' : 'veces';
  return `${key} te mordió ${worst.count} ${times}. Practíca${space ? 'lo' : 'la'} antes de volver.`;
}

export const keyName = (key) => key.toUpperCase();

// Cómo han ido las letras entrenadas o, si no había, cuáles se entrenarán.
// `prev` es el progreso anterior a la partida y `next` el ya guardado.
function weakText(game, prev, next) {
  if (game.guided) return '';
  const report = trainingReport(prev, game);
  if (report.length) {
    return `Entrenamiento: ${report.map(({ key, before, now }) => `«${keyName(key)}» ${before} % → ${now} %`).join(' · ')}.`;
  }
  const keys = weakKeys(next);
  return keys.length ? `Tus teclas débiles: ${keys.map(keyName).join(', ')}. La próxima partida las entrenará.` : '';
}

export function createUI(actions) {
  const el = {
    hud: $('#hud'),
    lives: $('#lives'),
    score: $('#score'),
    wave: $('#wave'),
    waveBar: $('#wave-bar'),
    waveMeter: $('#wave-meter'),
    boss: $('#boss'),
    bossBar: $('#boss-bar'),
    bossMeter: $('#boss-meter'),
    combo: $('#combo'),
    comboMeter: $('#combo-meter'),
    mult: $('#mult'),
    grenadeBlock: $('#grenade-block'),
    grenadeText: $('#grenade-text'),
    grenadeBar: $('#grenade-bar'),
    grenadeMeter: $('#grenade-meter'),
    grenadeKey: $('#grenade-key'),
    pausePerks: $('#pause-perks'),
    overPerks: $('#over-perks'),
    accuracy: $('#accuracy'),
    wpm: $('#wpm'),
    mute: $('#mute'),
    banner: $('#banner'),
    record: $('#record'),
    newRecord: $('#new-record'),
    advice: $('#final-advice'),
    progress: $('#final-progress'),
    weak: $('#final-weak'),
    bestWpm: $('#best-wpm'),
    bestWpmWrap: $('#best-wpm-wrap'),
    crt: $('.crt'),
    resetRecord: $('#reset-record'),
    optionControls: document.querySelectorAll('[data-option]'),
    screens: {
      start: $('#screen-start'),
      pause: $('#screen-pause'),
      upgrade: $('#screen-upgrade'),
      options: $('#screen-options'),
      over: $('#screen-over'),
      practice: $('#screen-practice'),
    },
    upgradeBonus: $('#upgrade-bonus'),
    upgradeChoices: $('#upgrade-choices'),
    final: {
      score: $('#final-score'),
      wave: $('#final-wave'),
      kills: $('#final-kills'),
      accuracy: $('#final-accuracy'),
      wpm: $('#final-wpm'),
      combo: $('#final-combo'),
    },
  };

  document.querySelectorAll('[data-diff]').forEach((btn) => {
    btn.addEventListener('click', () => actions.start(btn.dataset.diff));
  });
  $('#resume').addEventListener('click', actions.resume);
  let quitArmed = false;
  const quit = $('#quit');
  const disarmQuit = () => {
    quitArmed = false;
    quit.querySelector('.item-name').textContent = 'Abandonar';
  };
  quit.addEventListener('click', () => {
    if (!quitArmed) {
      quitArmed = true;
      quit.querySelector('.item-name').textContent = '¿Abandonar? Se perderá esta partida';
      return;
    }
    disarmQuit();
    actions.menu();
  });
  quit.addEventListener('blur', disarmQuit);
  $('#upgrade-pause').addEventListener('click', actions.pause);
  $('#guided-pause').addEventListener('click', actions.pause);
  $('#guided-grenade').addEventListener('click', actions.grenade);
  const guidedInput = $('#guided-input');
  guidedInput.addEventListener('input', (e) => {
    if (e.isComposing) return;
    const value = fold(guidedInput.value);
    guidedInput.value = '';
    for (const letter of value) {
      if (/^[a-zñ ]$/.test(letter)) actions.type(letter);
    }
  });
  guidedInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!e.repeat) actions.grenade();
    }
  });
  $('#retry').addEventListener('click', actions.retry);
  $('#menu').addEventListener('click', actions.menu);
  $('#practice-start').addEventListener('click', actions.practice);
  $('#practice-back').addEventListener('click', actions.closePractice);
  const practiceInput = $('#practice-input');
  practiceInput.addEventListener('input', () => {
    const expected = $('#practice-words').textContent;
    const feedback = practiceFeedback(expected, practiceInput.value);
    const status = $('#practice-status');
    practiceInput.setAttribute('aria-invalid', String(feedback.invalid));
    status.textContent = feedback.message;
  });
  document.querySelectorAll('[data-open-options]').forEach((btn) => {
    btn.addEventListener('click', actions.openOptions);
  });
  $('#options-back').addEventListener('click', actions.closeOptions);

  for (const control of el.optionControls) {
    const key = control.dataset.option;
    if (control.type === 'range') {
      control.addEventListener('input', () => actions.setOption(key, Number(control.value)));
      // Al soltar el control de efectos suena uno para oír el nuevo volumen.
      if (key === 'sfx') control.addEventListener('change', actions.previewSfx);
    } else {
      control.addEventListener('click', () => {
        actions.setOption(key, control.getAttribute('aria-pressed') !== 'true');
      });
    }
  }

  // Borrar el récord no se puede deshacer, así que pide un segundo clic.
  let resetArmed = false;
  const resetName = el.resetRecord.querySelector('.item-name');
  const resetStatus = $('#reset-status');
  const describeReset = () => {
    resetStatus.classList.toggle('armed', resetArmed);
    resetStatus.textContent = resetArmed
      ? 'Pulsa otra vez para borrarlo. Cualquier otra tecla cancela.'
      : el.resetRecord.disabled
        ? 'No hay nada que borrar.'
        : 'Se borran el récord, el PPM máx. y las últimas partidas.';
  };
  const disarmReset = () => {
    resetArmed = false;
    resetName.textContent = 'Borrar récord y progreso';
    describeReset();
  };
  el.resetRecord.addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      resetName.textContent = '¿Seguro? Otra vez';
      describeReset();
      return;
    }
    disarmReset();
    actions.resetRecord();
    $('#options-back').focus();
  });
  el.resetRecord.addEventListener('blur', disarmReset);
  el.resetRecord.addEventListener('keydown', (e) => {
    if (resetArmed && e.key !== 'Enter' && e.key !== ' ') disarmReset();
  });
  describeReset();

  // Las listas de [data-menu] se recorren con las flechas, como en un menú de
  // consola, y el ratón mueve el foco para que solo haya un cursor visible.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    // En Opciones las flechas recorren todas las filas; ←→ queda para los deslizadores.
    const menu = document.activeElement?.closest('#screen-options') ?? document.activeElement?.closest('[data-menu]');
    if (!menu) return;
    e.preventDefault();
    const items = [...menu.querySelectorAll('button:not(:disabled), input')].filter((item) => item.getClientRects().length);
    if (!items.length) return;
    const step = e.key === 'ArrowDown' ? 1 : -1;
    const i = items.indexOf(document.activeElement);
    items[(i + step + items.length) % items.length].focus();
  });
  // El título reacciona a la dificultad que tiene el cursor.
  document.addEventListener('focusin', (e) => {
    const diff = e.target.closest?.('[data-diff]')?.dataset.diff;
    if (diff) actions.previewDifficulty(diff);
  });
  // Un cambio de pantalla bajo el ratón inmóvil no debe robar el foco de escritura.
  document.addEventListener('pointermove', (e) => {
    const item = e.target.closest?.('[data-menu] button:not(:disabled)');
    if (item && item !== document.activeElement) item.focus({ preventScroll: true });
  });

  el.mute.addEventListener('click', () => {
    actions.toggleMute();
    el.mute.blur();
  });

  let hearts = [];

  function renderHearts(lives, max) {
    if (hearts.length !== max) {
      el.lives.replaceChildren();
      hearts = Array.from({ length: max }, () => {
        const h = document.createElement('i');
        h.className = 'heart';
        el.lives.append(h);
        return h;
      });
    }
    hearts.forEach((h, i) => {
      const empty = i >= lives;
      if (empty && !h.classList.contains('empty')) {
        h.classList.add('lost');
        h.addEventListener('animationend', () => h.classList.remove('lost'), { once: true });
      }
      h.classList.toggle('empty', empty);
    });
    el.lives.setAttribute('aria-label', `${Math.max(0, lives)} de ${max} vidas`);
  }

  const pct = (v) => `${Math.round(v * 100)}%`;

  const span = (className, text) => {
    const s = document.createElement('span');
    s.className = className;
    s.textContent = text;
    return s;
  };

  function renderPerks(list, game, describe = false) {
    const items = Object.entries(game.perks).map(([id, level]) => {
      const up = UPGRADES[id];
      const li = document.createElement('li');
      li.className = `perk ${up.rarity ?? 'common'}`;
      li.append(span('perk-name', up.name));
      if (Number.isFinite(up.max) && up.max > 1) li.append(span('perk-level', `${level}/${up.max}`));
      else if (level > 1) li.append(span('perk-level', `x${level}`));
      if (describe) li.append(span('perk-desc', up.desc));
      return li;
    });
    for (const id of game.synergies) {
      const li = document.createElement('li');
      li.className = 'perk synergy';
      li.append(span('perk-name', SYNERGIES[id].name), span('perk-level', 'Sinergia'));
      if (describe) li.append(span('perk-desc', SYNERGIES[id].desc));
      items.push(li);
    }
    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'perk empty';
      li.textContent = 'Ninguna todavía';
      items.push(li);
    }
    list.replaceChildren(...items);
  }

  let upgradeArmedAt = 0;
  let guided = false;
  let lastGuidedState = '';
  let lastGuidedTarget = null;
  let lastGuidedWord = '';
  let lastGuidedMisses = 0;
  const enemyHelp = $('#enemy-help');
  for (const type of Object.values(ZOMBIE_TYPES)) {
    if (!type.hint) continue;
    const item = document.createElement('li');
    item.textContent = `${type.name}: ${type.hint}.`;
    enemyHelp.append(item);
  }
  return {
    setGuided(enabled) {
      guided = enabled;
      lastGuidedState = '';
      lastGuidedTarget = null;
      lastGuidedWord = '';
      lastGuidedMisses = 0;
      guidedInput.value = '';
      $('#guided-target').textContent = '';
      $('#guided-status').textContent = '';
      $('#guided-play').classList.toggle('hidden', !enabled);
    },
    updateGuided(game) {
      const target = game.target;
      const word = target?.word ?? '';
      const typed = target?.typed ?? 0;
      const signature = `${game.wave}|${word}|${typed}|${game.misses}|${game.lives}|${game.kills}|${game.grenade}`;
      if (signature === lastGuidedState) return;
      lastGuidedState = signature;
      const expected = target?.folded[typed];
      const next = expected === ' ' ? 'espacio' : expected;
      $('#guided-target').textContent = target
        ? `Objetivo: ${word}. Completado: ${typed} de ${target.folded.length} caracteres.`
        : 'Preparando el siguiente objetivo…';
      const changed = target !== lastGuidedTarget || word !== lastGuidedWord;
      const missed = game.misses > lastGuidedMisses;
      const intro = changed && target ? `Oleada ${game.wave}. Objetivo: ${word}. ` : '';
      const error = missed ? `Fallo. Quedan ${GUIDED.missesPerLife - game.guidedMisses} fallos para perder una vida. ` : '';
      const ready = game.grenade >= 1 ? 'Granada lista.' : `Granada al ${Math.round(game.grenade * 100)} por ciento.`;
      $('#guided-status').textContent = `${intro}${error}${next ? `Siguiente: ${next}. ` : ''}${game.lives} vidas. ${ready}`;
      lastGuidedTarget = target;
      lastGuidedWord = word;
      lastGuidedMisses = game.misses;
    },
    upgradeReady() { return performance.now() >= upgradeArmedAt; },
    showPractice(game) {
      const key = game.worstKey?.key;
      const words = Object.values(WORDS).flat().filter((word) => key && fold(word).includes(key)).slice(0, 5);
      $('#practice-words').textContent = words.length ? words.join(' ') : 'cadáver podrido mano hambrienta';
      practiceInput.value = '';
      practiceInput.setAttribute('aria-invalid', 'false');
      $('#practice-status').textContent = '';
      this.showScreen('practice');
    },
    showScreen(name) {
      for (const [key, screen] of Object.entries(el.screens)) screen.classList.toggle('hidden', key !== name);
      el.hud.inert = Boolean(name) || guided;
      $('#guided-play').classList.toggle('hidden', !guided || Boolean(name));
      const screen = el.screens[name];
      if (screen) screen.querySelector('[data-autofocus]')?.focus();
      else if (guided) guidedInput.focus();
      else document.activeElement?.blur();
    },

    // Toda la interfaz se mide en píxeles de arte para compartir rejilla con el canvas.
    setPixelSize(px) {
      document.documentElement.style.setProperty('--u', `${px}px`);
    },

    setHudVisible(visible) {
      el.hud.classList.toggle('hidden', !visible);
      if (!visible) hearts = [];
    },

    updateHud(game) {
      el.score.textContent = String(game.score).padStart(6, '0');
      el.wave.textContent = game.wave;
      el.waveMeter.style.width = pct(game.waveProgress);
      el.waveBar.setAttribute('aria-valuenow', Math.round(game.waveProgress * 100));
      el.combo.textContent = game.combo;
      el.comboMeter.style.width = pct(game.comboProgress);
      el.mult.textContent = `x${game.multiplier}`;
      el.mult.classList.toggle('hot', game.multiplier > 1);
      el.accuracy.textContent = `${game.accuracy}%`;
      el.wpm.textContent = game.wpm;
      const ready = game.grenade >= 1;
      el.grenadeMeter.style.width = pct(game.grenade);
      el.grenadeBar.setAttribute('aria-valuenow', Math.round(game.grenade * 100));
      el.grenadeBar.setAttribute('aria-label', ready ? 'Granada lista: pulsa Enter' : 'Carga de la granada');
      el.grenadeKey.classList.toggle('hidden', !ready);
      el.grenadeBlock.classList.toggle('ready', ready);
      el.grenadeText.textContent = ready ? '¡Lista!' : 'Granada';
      renderHearts(game.lives, game.maxLives);
      const boss = game.bossHealth;
      el.boss.classList.toggle('hidden', boss === null);
      if (boss !== null) {
        el.bossMeter.style.width = pct(boss);
        el.bossBar.setAttribute('aria-valuenow', Math.round(boss * 100));
      }
    },

    banner(title, sub) {
      if (guided) {
        $('#guided-status').textContent = `${title}. ${sub}`;
        return;
      }
      const t = document.createElement('span');
      t.className = 'banner-title';
      t.textContent = title;
      const s = document.createElement('span');
      s.className = 'banner-sub';
      s.textContent = sub;
      el.banner.replaceChildren(t, s);
      el.banner.classList.remove('show');
      void el.banner.offsetWidth; // reinicia la animación
      el.banner.classList.add('show');
    },

    clearBanner() {
      el.banner.classList.remove('show');
      el.banner.replaceChildren();
    },

    setRecord(value, progress) {
      el.record.textContent = String(value).padStart(6, '0');
      el.bestWpm.textContent = progress.bestWpm;
      el.bestWpmWrap.classList.toggle('hidden', !progress.games);
      el.resetRecord.disabled = value === 0 && !progress.games;
      describeReset();
    },

    // Refleja las opciones en sus controles y en lo que dependen de ellas.
    setOptions(settings) {
      for (const control of el.optionControls) {
        const value = settings[control.dataset.option];
        if (control.type === 'range') {
          control.value = value;
          control.setAttribute('aria-valuetext', `${value} de ${control.max}`);
          $(`#${control.id}-value`).textContent = value;
        } else {
          control.setAttribute('aria-pressed', String(value));
          control.querySelector('.option-value').textContent = value ? 'Sí' : 'No';
        }
      }
      this.setMuted(settings.muted);
      el.crt.classList.toggle('hidden', !settings.crt);
      el.hud.classList.toggle('no-stats', !settings.stats);
      $('#mode-description').textContent = settings.guided
        ? 'Modo guiado activado: objetivos en texto, sin límite de tiempo ni récords arcade. Elige una dificultad para empezar.'
        : 'Para jugar sin presión de tiempo y con objetivos en texto, activa el modo guiado en Opciones.';
      // El menú enfoca la dificultad elegida para empezar con Enter.
      document.querySelectorAll('[data-diff]').forEach((card) => {
        card.toggleAttribute('data-autofocus', card.dataset.diff === settings.difficulty);
      });
    },

    setMuted(muted) {
      el.mute.setAttribute('aria-pressed', String(muted));
      el.mute.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar sonido');
    },

    // `choices` son ids de UPGRADES; el clic llama a actions.upgrade(id).
    showUpgrades(game, choices) {
      // La pantalla aparece mientras se teclea: un Enter (granada) o un clic que
      // ya venía en camino no debe gastar la elección sin haberla leído.
      upgradeArmedAt = performance.now() + UPGRADE_GUARD_MS;
      $('#upgrade-title').textContent = game.perfect ? 'Oleada perfecta' : 'Oleada superada';
      el.upgradeBonus.textContent = game.perfect
        ? `Bonus doble · +${game.bonus} puntos`
        : `Oleada ${game.wave} · +${game.bonus} puntos`;
      const cards = choices.map((id, i) => {
        const up = UPGRADES[id];
        const rarity = up.rarity ?? 'common';
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `item ${rarity}`;
        if (i === 0) item.dataset.autofocus = '';
        const key = span('item-key', String(i + 1));
        key.setAttribute('aria-hidden', 'true');
        const level = Number.isFinite(up.max) ? `Nivel ${game.level(id) + 1}/${up.max}` : 'Inmediata';
        const label = RARITY[rarity].label;
        const meta = span('item-meta', label ? `${label} · ${level}` : level);
        const synergies = game.completes(id).map((s) => SYNERGIES[s].name);
        if (synergies.length) meta.append(span('item-synergy', `· Sinergia: ${synergies.join(', ')}`));
        item.append(key, span('item-name', up.name), meta, span('item-desc', up.desc));
        item.addEventListener('click', () => {
          actions.upgrade(id);
        });
        return item;
      });
      el.upgradeChoices.replaceChildren(...cards);
      this.showScreen('upgrade');
    },

    showPause(game) {
      $('#pause-guided-help').classList.toggle('hidden', !game.guided);
      $('#pause-arcade-help').classList.toggle('hidden', game.guided);
      renderPerks(el.pausePerks, game, true);
      this.showScreen('pause');
    },

    showGameOver(game, isRecord, prev, next) {
      $('#guided-result').classList.toggle('hidden', !game.guided);
      $('#history-details').classList.toggle('hidden', game.guided);
      el.newRecord.classList.toggle('hidden', !isRecord);
      el.final.score.textContent = game.score;
      el.final.wave.textContent = game.wave;
      el.final.kills.textContent = game.kills;
      el.final.accuracy.textContent = `${game.accuracy}%`;
      el.final.wpm.textContent = game.wpm;
      el.final.combo.textContent = game.maxCombo;
      const comparable = prev.history.filter((entry) => entry.difficulty === game.diffKey);
      const line = game.guided ? '' : progressText(game.wpm, {
        games: comparable.length,
        lastWpm: comparable.at(-1)?.wpm ?? 0,
        bestWpm: Math.max(0, ...comparable.map((entry) => entry.wpm)),
      });
      el.progress.textContent = line;
      el.progress.classList.toggle('hidden', !line);
      const weak = weakText(game, prev, next);
      el.weak.textContent = weak;
      el.weak.classList.toggle('hidden', !weak);
      const advice = adviceText(game);
      el.advice.textContent = advice;
      el.advice.classList.toggle('hidden', !advice);
      $('#practice-start').classList.toggle('hidden', !game.worstKey);
      const history = [...comparable.slice(-4), ...(game.wpm ? [{ wpm: game.wpm, accuracy: game.accuracy, duration: Math.round(game.time) }] : [])];
      const difficulty = { facil: 'Fácil', normal: 'Normal', pesadilla: 'Pesadilla' }[game.diffKey];
      $('#history-title').textContent = `Últimas partidas en ${difficulty}`;
      $('#final-history').replaceChildren(...history.map((entry) => {
        const item = document.createElement('li');
        item.textContent = `${entry.wpm} PPM · ${entry.accuracy} % de precisión · ${entry.duration} s`;
        return item;
      }));
      renderPerks(el.overPerks, game);
      this.showScreen('over');
    },
  };
}
