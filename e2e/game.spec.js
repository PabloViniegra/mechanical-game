import { test as base, expect } from '@playwright/test';

const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
    });
    await page.addInitScript(() => {
      globalThis.document.addEventListener('securitypolicyviolation', (event) => {
        console.error(`CSP: ${event.violatedDirective} ${event.blockedURI}`);
      });
    });
    await use(page);
    expect(errors, 'Consola sin errores, avisos ni violaciones de CSP').toEqual([]);
  },
});

test('menú, partida arcade, pausa y regreso con teclado', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Apocalipsis QWERTY' })).toBeVisible();
  await expect(page.locator('[data-diff="normal"]')).toBeFocused();

  await page.keyboard.press('2');
  await expect(page.locator('#screen-start')).toBeHidden();
  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#lives')).toHaveAttribute('aria-label', '3 de 3 vidas');

  await page.keyboard.press('Escape');
  const pause = page.getByRole('region', { name: 'Pausa', exact: true });
  await expect(pause).toBeVisible();
  await expect(pause.getByRole('button', { name: 'Continuar' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(pause).toBeHidden();

  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Opciones', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(pause).toBeVisible();

  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(pause.getByRole('button', { name: '¿Abandonar? Se perderá esta partida' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#screen-start')).toBeVisible();
  await expect(page.locator('#hud')).toBeHidden();
});

test('modo guiado: disparo, game over y reintento', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('o');
  const guided = page.getByRole('button', { name: 'Modo guiado en la próxima partida' });
  await guided.click();
  await expect(guided).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');

  // La recarga comprueba que la opción persiste sin escribir directamente en storage.
  await page.reload();
  await expect(page.locator('[data-diff="normal"]')).toBeFocused();
  await page.keyboard.press('2');
  const input = page.getByRole('textbox', { name: 'Escribe la siguiente letra' });
  await expect(input).toBeFocused();
  const target = page.locator('#guided-target');
  await expect(target).toContainText('Objetivo:');
  const word = (await target.textContent()).match(/^Objetivo: (.+)\. Completado:/)[1];
  await input.fill(word);
  await expect(page.locator('#score')).not.toHaveText('000000');
  await expect(page.locator('#guided-status')).not.toContainText('Granada al 0 por ciento.');
  await expect(target).toContainText('Objetivo:');

  // Se falla la letra anunciada: la derrota usa las reglas reales, sin hooks en el juego.
  const next = (await target.textContent()).match(/^Objetivo: (.+)\. Completado:/)[1];
  const wrong = next.toLowerCase().startsWith('a') ? 'b' : 'a';
  await input.fill(wrong.repeat(9));
  await expect(page.getByRole('heading', { name: 'Te han devorado' })).toBeVisible();
  await expect(page.locator('#final-kills')).toHaveText('1');
  await expect(page.getByRole('button', { name: 'Reintentar', exact: true })).toBeFocused();
  const statsHelp = page.locator('#stats-help');
  await expect(statsHelp).not.toHaveAttribute('open', '');
  await statsHelp.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(statsHelp).toHaveAttribute('open', '');
  await expect(statsHelp).toContainText('PPM significa palabras por minuto');
  await expect(page.locator('#history-help')).toBeHidden();
  await page.getByRole('button', { name: 'Reintentar', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#screen-over')).toBeHidden();
  await expect(input).toBeFocused();
  await expect(page.locator('#lives')).toHaveAttribute('aria-label', '3 de 3 vidas');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Pausa', exact: true })).toBeVisible();
});

for (const width of [1440, 390]) {
  test(`logo, volumen y atajos de mejoras a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => globalThis.document.fonts.ready);
    const logoFits = await page.locator('.logo-main').evaluate((logo) => {
      const last = logo.querySelector('i:last-child').getBoundingClientRect();
      const cursor = globalThis.getComputedStyle(logo, '::after');
      return last.right + Number.parseFloat(cursor.marginLeft) + Number.parseFloat(cursor.width)
        <= logo.getBoundingClientRect().right;
    });
    expect(logoFits, 'El cursor cabe junto a QWERTY').toBe(true);
    expect(await page.locator('.logo-top').evaluate((title) => title.scrollWidth <= title.clientWidth),
      'Apocalipsis cabe sin recortarse').toBe(true);

    await page.keyboard.press('o');
    for (const id of ['opt-music', 'opt-sfx']) {
      const label = await page.locator(`label[for="${id}"] > span`).boundingBox();
      const slider = await page.locator(`#${id}`).boundingBox();
      expect(slider.y >= label.y + label.height || slider.x >= label.x + label.width,
        'El deslizador no se superpone a la etiqueta').toBe(true);
    }
    await page.locator('#opt-music').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#opt-music-value')).toHaveText('8');
    await page.getByRole('button', { name: 'Modo guiado en la próxima partida' }).click();
    await page.keyboard.press('Escape');
    await page.keyboard.press('2');
    const target = page.locator('#guided-target');
    for (let i = 0; i < 6; i++) {
      await expect(target).toContainText('Objetivo:');
      const word = (await target.textContent()).match(/^Objetivo: (.+)\. Completado:/)[1];
      const score = await page.locator('#score').textContent();
      await page.locator('#guided-input').fill(word);
      await expect(page.locator('#score')).not.toHaveText(score);
    }
    await expect(page.locator('#screen-upgrade')).toBeVisible();
    const keys = page.locator('#upgrade-choices .item-key');
    for (let i = 0; i < await keys.count(); i++) {
      await expect(keys.nth(i)).toBeVisible();
      await expect(keys.nth(i)).toHaveText(String(i + 1));
    }
    // La protección de entrada deja leer la oferta antes de aceptar una tecla.
    await page.waitForTimeout(450);
    await page.keyboard.press('1');
    await expect(page.locator('#screen-upgrade')).toBeHidden();
    await expect(page.locator('#guided-input')).toBeFocused();
  });
}
