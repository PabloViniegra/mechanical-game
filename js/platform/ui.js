import { UPGRADES, RARITY } from '../data/config.js';

const $ = (sel) => document.querySelector(sel);

// Capa DOM: HUD, cartel de oleada y pantallas superpuestas.
const UPGRADE_GUARD_MS = 400;

// Compara el PPM con la partida anterior: la mejora es el motivo para volver.
function progressText(wpm, prev) {
  if (!wpm) return '';
  if (!prev.games) return `Primera marca: ${wpm} PPM. Ya tienes algo que superar.`;
  const delta = wpm - prev.lastWpm;
  const vs = delta === 0 ? 'Igual que la anterior'
    : `${Math.abs(delta)} ${delta > 0 ? 'más' : 'menos'} que la anterior`;
  if (wpm > prev.bestWpm) return `¡Tu mejor PPM! ${vs}.`;
  return `Tu mejor marca: ${prev.bestWpm} PPM · ${vs}.`;
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
  $('#quit').addEventListener('click', actions.menu);
  $('#retry').addEventListener('click', actions.retry);
  $('#menu').addEventListener('click', actions.menu);
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
    } else if (control.dataset.value) {
      control.addEventListener('click', () => actions.setOption(key, control.dataset.value));
    } else {
      control.addEventListener('click', () => {
        actions.setOption(key, control.getAttribute('aria-pressed') !== 'true');
      });
    }
  }

  // Borrar el récord no se puede deshacer, así que pide un segundo clic.
  let resetArmed = false;
  const disarmReset = () => {
    resetArmed = false;
    el.resetRecord.textContent = 'Borrar récord';
  };
  el.resetRecord.addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      el.resetRecord.textContent = '¿Seguro? Otra vez';
      return;
    }
    disarmReset();
    actions.resetRecord();
    $('#options-back').focus();
  });
  el.resetRecord.addEventListener('blur', disarmReset);

  // Las listas de [data-menu] se recorren con las flechas, como en un menú de
  // consola, y el ratón mueve el foco para que solo haya un cursor visible.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const menu = document.activeElement?.closest('[data-menu]');
    if (!menu) return;
    e.preventDefault();
    const items = [...menu.querySelectorAll('button:not(:disabled)')];
    const step = e.key === 'ArrowDown' ? 1 : -1;
    const i = items.indexOf(document.activeElement);
    items[(i + step + items.length) % items.length].focus();
  });
  document.addEventListener('pointerover', (e) => {
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

  function renderPerks(list, game) {
    const items = Object.entries(game.perks).map(([id, level]) => {
      const up = UPGRADES[id];
      const li = document.createElement('li');
      li.className = `perk ${up.rarity ?? 'common'}`;
      li.append(span('perk-name', up.name));
      if (Number.isFinite(up.max) && up.max > 1) li.append(span('perk-level', `${level}/${up.max}`));
      else if (level > 1) li.append(span('perk-level', `x${level}`));
      return li;
    });
    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'perk empty';
      li.textContent = 'Ninguna todavía';
      items.push(li);
    }
    list.replaceChildren(...items);
  }

  return {
    showScreen(name) {
      for (const [key, screen] of Object.entries(el.screens)) screen.classList.toggle('hidden', key !== name);
      const screen = el.screens[name];
      if (screen) screen.querySelector('[data-autofocus]')?.focus();
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
    },

    // Refleja las opciones en sus controles y en lo que dependen de ellas.
    setOptions(settings) {
      for (const control of el.optionControls) {
        const value = settings[control.dataset.option];
        if (control.type === 'range') {
          control.value = value;
          control.setAttribute('aria-valuetext', `${value} de ${control.max}`);
          $(`#${control.id}-value`).textContent = value;
        } else if (control.dataset.value) {
          control.setAttribute('aria-pressed', String(control.dataset.value === value));
        } else {
          control.setAttribute('aria-pressed', String(value));
          control.querySelector('.option-value').textContent = value ? 'Sí' : 'No';
        }
      }
      this.setMuted(settings.muted);
      el.crt.classList.toggle('hidden', !settings.crt);
      el.hud.classList.toggle('no-stats', !settings.stats);
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
      const armedAt = performance.now() + UPGRADE_GUARD_MS;
      el.upgradeBonus.textContent = `Oleada ${game.wave} · +${game.bonus} puntos`;
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
        item.append(
          key,
          span('item-name', up.name),
          span('item-meta', label ? `${label} · ${level}` : level),
          span('item-desc', up.desc),
        );
        item.addEventListener('click', () => {
          if (performance.now() >= armedAt) actions.upgrade(id);
        });
        return item;
      });
      el.upgradeChoices.replaceChildren(...cards);
      this.showScreen('upgrade');
    },

    showPause(game) {
      renderPerks(el.pausePerks, game);
      this.showScreen('pause');
    },

    showGameOver(game, isRecord, prev) {
      el.newRecord.classList.toggle('hidden', !isRecord);
      el.final.score.textContent = game.score;
      el.final.wave.textContent = game.wave;
      el.final.kills.textContent = game.kills;
      el.final.accuracy.textContent = `${game.accuracy}%`;
      el.final.wpm.textContent = game.wpm;
      el.final.combo.textContent = game.maxCombo;
      const line = progressText(game.wpm, prev);
      el.progress.textContent = line;
      el.progress.classList.toggle('hidden', !line);
      const advice = adviceText(game);
      el.advice.textContent = advice;
      el.advice.classList.toggle('hidden', !advice);
      renderPerks(el.overPerks, game);
      this.showScreen('over');
    },
  };
}
