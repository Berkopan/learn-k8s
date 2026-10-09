import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {levels} from '../../src/curriculum.js';
import {quizzes} from '../../src/reference.js';

// Video changes worker configuration, so Playwright requires file-level scope.
test.use({video: 'on'});
test.setTimeout(25000);
const progressKey = 'learn-k8s:progress:v2';
async function openLab(page, {id = 1, reduced = false, systemReduced = false, theme = 'dark', clock = false} = {}) {
  await page.emulateMedia({reducedMotion: systemReduced ? 'reduce' : 'no-preference'});
  if (clock) await page.clock.install({time: new Date('2026-10-01T20:00:00Z')});
  await page.addInitScript(({id, reduced, theme, progressKey}) => {
    // Reload tests must preserve the real completed record instead of reseeding it.
    if (!localStorage.getItem(progressKey)) localStorage.setItem(progressKey, JSON.stringify({
      version: 1, completed: {}, bookmarks: [], notes: {}, quiz: {}, active: id, days: [],
      settings: {free: true, reduced, speed: 2, sound: false},
    }));
    localStorage.setItem('learn-k8s:theme:v1', theme);
  }, {id, reduced, theme, progressKey});
  await page.goto(`/#level=${id}`);
  await expect(page.locator('.lesson-title-row h1')).toHaveText(levels[id - 1].title);
  if (clock) await page.clock.pauseAt(new Date('2026-10-01T20:01:00Z'));
}
async function command(page, text) {
  await page.locator('#terminal-input').fill(text);
  await page.locator('#terminal-input').press('Enter');
}
async function finish(page, id = 1) {
  for (const step of levels[id - 1].steps) await command(page, step.command);
  await expect(page.locator('.lesson-tab-count')).toHaveText(`${levels[id - 1].steps.length}/${levels[id - 1].steps.length}`);
}
const record = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey);

test('completion is saved immediately; the reward waits 900ms without auto-advancing', async ({page}) => {
  await openLab(page, {clock: true});
  await finish(page);
  expect(Object.keys((await record(page)).completed)).toEqual(['1']);
  await expect(page.locator('.terminal-entry').last()).toContainText('nginx');
  await expect(page.locator('.reward-dialog')).toHaveCount(0);
  await expect(page.locator('.pixel-confetti')).toHaveCount(0);
  await page.clock.runFor(899);
  await expect(page.locator('.reward-dialog')).toHaveCount(0);
  await page.clock.runFor(1);
  const dialog = page.locator('.reward-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  await expect(dialog).toHaveCSS('animation-name', 'reward-dialog-in');
  await expect(page.locator('.reward-meta strong')).toHaveText('+40 XP');
  await expect(page.locator('.pixel-confetti-piece')).toHaveCount(22);
  await expect(page.locator('.pixel-confetti')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.pixel-confetti')).toHaveCSS('pointer-events', 'none');
  await expect(dialog).toHaveCSS('z-index', '63');
  await expect(page.locator('.pixel-confetti')).toHaveCSS('z-index', '62');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#level=1$/);
  await expect(dialog).toBeVisible();
  await page.clock.runFor(4200);
  await expect(page.locator('.pixel-confetti')).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  // Radix intentionally restores focus on the next timer turn after unmount.
  await page.clock.runFor(1);
  await expect(page.locator('#terminal-input')).toBeFocused();
  await command(page, 'docker images');
  await page.clock.runFor(5000);
  await expect(dialog).toHaveCount(0);
  expect(Object.keys((await record(page)).completed)).toEqual(['1']);
});

test('using the inline next-level action cancels a pending reward', async ({page}) => {
  await openLab(page, {clock: true});
  await page.getByRole('tab', {name: /Şimdi uygula/}).click();
  await finish(page);
  await page.getByRole('button', {name: 'Sonraki seviye', exact: true}).click();
  await expect(page).toHaveURL(/#level=2$/);
  await page.clock.runFor(5000);
  await expect(page.locator('.reward-dialog')).toHaveCount(0);
  await expect(page.locator('.pixel-confetti')).toHaveCount(0);
});

test('hash navigation to the map and back cannot revive a queued reward', async ({page}) => {
  await openLab(page, {clock: true});
  await finish(page);
  await page.evaluate(() => { location.hash = '#map'; });
  await expect(page.locator('.atlas')).toBeVisible();
  await page.clock.runFor(5000);
  await expect(page.locator('.reward-dialog')).toHaveCount(0);
  await page.evaluate(() => { location.hash = '#level=1'; });
  await expect(page.locator('.lab-view')).toBeVisible();
  await page.clock.runFor(5000);
  await expect(page.locator('.reward-dialog')).toHaveCount(0);
  await expect(page.locator('.lesson-tab-count')).toHaveText('2/2');
});

test('opening another dialog cancels the pending result instead of stacking dialogs', async ({page}) => {
  await openLab(page, {clock: true});
  await finish(page);
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog', {name: 'Öğrenme yolu'})).toBeVisible();
  await page.clock.runFor(5000);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.locator('.reward-dialog')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.clock.runFor(5000);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('restart cancels a pending reveal; replay does not grant duplicate XP', async ({page}) => {
  await openLab(page, {clock: true});
  await finish(page);
  await page.getByRole('button', {name: 'Laboratuvarı sıfırla', exact: true}).click();
  await page.getByRole('dialog').getByRole('button', {name: 'Laboratuvarı sıfırla', exact: true}).click();
  await page.clock.runFor(5000);
  await expect(page.locator('.reward-dialog')).toHaveCount(0);
  await expect(page.locator('.lesson-tab-count')).toHaveText('0/2');
  await finish(page);
  await page.clock.runFor(900);
  await expect(page.locator('.reward-meta strong')).toHaveText('Tekrar tamamlandı');
  expect(Object.keys((await record(page)).completed)).toEqual(['1']);
  await page.keyboard.press('Escape');
  await expect(page.locator('.pixel-confetti')).toHaveCount(0);
});

for (const preference of ['app', 'system']) {
  test(`${preference} reduced motion skips the delay and decorative animations`, async ({page}) => {
    await openLab(page, {clock: true, reduced: preference === 'app', systemReduced: preference === 'system'});
    await finish(page);
    // No virtual time has advanced: this must not wait for the normal 900ms timer.
    await expect(page.locator('.reward-dialog')).toBeVisible();
    await expect(page.locator('.reward-dialog')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.reward-overlay')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.pixel-confetti-piece')).toHaveCount(0);
    await page.getByRole('button', {name: 'Burada denemeye devam et'}).click();
    await expect(page.locator('.reward-dialog')).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(page.locator('#terminal-input')).toBeFocused();
  });
}

test('a live OS motion preference change ends an active shower', async ({page}) => {
  await openLab(page, {clock: true});
  await finish(page);
  await page.clock.runFor(900);
  await expect(page.locator('.pixel-confetti-piece')).toHaveCount(22);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(page.locator('.pixel-confetti-piece')).toHaveCount(0);
  await expect(page.locator('.reward-dialog')).toHaveCSS('animation-name', 'none');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await expect(page.locator('.pixel-confetti-piece')).toHaveCount(0);
});

test('reload during the delay retains completion without restoring the pending celebration', async ({page}) => {
  await openLab(page, {clock: true});
  await finish(page);
  await page.reload();
  await expect(page.locator('.completed-label')).toBeVisible();
  await page.clock.runFor(5000);
  await expect(page.locator('.reward-dialog')).toHaveCount(0);
  expect(Object.keys((await record(page)).completed)).toEqual(['1']);
});

test('320px final reward keeps the optional quiz and the journey action reachable', async ({page}, info) => {
  await page.setViewportSize({width: 320, height: 740});
  await openLab(page, {id: 128, reduced: true});
  await finish(page, 128);
  const dialog = page.locator('.reward-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', {name: 'Küme kaptanı, sefer tamamlandı.'})).toBeVisible();
  await dialog.locator('.quiz-box > button').nth(quizzes[15].answer).click();
  await expect(dialog.locator('.quiz-box [role="status"]')).toContainText('Doğru.');
  expect((await record(page)).quiz['15']).toBe(true);
  const next = dialog.getByRole('button', {name: 'Yolculuğunu gör'});
  await next.scrollIntoViewIfNeeded();
  await expect(next).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({path: `test-results/${info.project.name}-reward-final-phone.png`});
  await next.click();
  await expect(page.getByRole('dialog', {name: 'Sefer rozetleri'})).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
});

test.describe('celebration visual evidence', () => {
  for (const theme of ['dark', 'light']) {
    test(`${theme}: finite top-down shower, accessible card and working next action`, async ({page}, info) => {
      await openLab(page, {theme});
      await page.getByRole('tab', {name: /Şimdi uygula/}).click();
      await finish(page);
      const dialog = page.locator('.reward-dialog');
      await expect(dialog).toBeVisible();
      await expect(page.locator('.pixel-confetti-piece')).toHaveCount(22);
      // A visual sample during the finite animation, not an assertion about timer accuracy.
      await page.waitForTimeout(1100);
      const pieces = await page.locator('.pixel-confetti-piece').evaluateAll(nodes => nodes.filter(n => getComputedStyle(n).display !== 'none').length);
      expect(pieces).toBe(page.viewportSize().width <= 600 ? 14 : 22);
      await page.screenshot({path: `test-results/${info.project.name}-${theme}-reward-celebration.png`, animations: 'allow'});
      await expect(page.locator('.pixel-confetti')).toHaveCount(0, {timeout: 6000});
      const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      await test.info().attach('reward-accessibility.json', {body: JSON.stringify(result.violations), contentType: 'application/json'});
      expect(result.violations).toEqual([]);
      await expect(dialog).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
      await dialog.getByRole('button', {name: 'Sonraki laboratuvara geç'}).click();
      await expect(page).toHaveURL(/#level=2$/);
      await expect(page.locator('.reward-dialog')).toHaveCount(0);
    });
  }
});
