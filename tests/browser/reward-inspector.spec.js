import {test, expect} from '@playwright/test';
import {levels} from '../../src/curriculum.js';

test('a locally managed resource inspector takes priority over a pending reward', async ({page}) => {
  test.setTimeout(25000);
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.clock.install({time: new Date('2026-10-01T20:00:00Z')});
  await page.addInitScript(() => localStorage.setItem('learn-k8s:progress:v1', JSON.stringify({
    version: 1, completed: {}, bookmarks: [], notes: {}, quiz: {}, active: 17, days: [],
    settings: {free: true, reduced: false, speed: 2, sound: false},
  })));
  await page.goto('/#level=17');
  await expect(page.locator('.lesson-title-row h1')).toHaveText(levels[16].title);
  await page.clock.pauseAt(new Date('2026-10-01T20:01:00Z'));
  for (const step of levels[16].steps) {
    await page.locator('#terminal-input').fill(step.command);
    await page.locator('#terminal-input').press('Enter');
  }
  await page.locator('.pod-card').first().click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.clock.runFor(5000);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.locator('.reward-dialog')).toHaveCount(0);
  await expect(page.locator('.pixel-confetti')).toHaveCount(0);
  await page.getByRole('button', {name: 'Kapat', exact: true}).click();
  await page.clock.runFor(1000);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
