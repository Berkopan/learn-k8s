import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {levels} from '../../src/curriculum.js';
import {guides} from '../../src/curriculum/guides/index.js';

async function openLab(page, id = 1) {
  await page.addInitScript(({id}) => localStorage.setItem('learn-k8s:progress:v1', JSON.stringify({
    version: 1, completed: {}, bookmarks: [], notes: {}, quiz: {}, active: id, days: [],
    settings: {free: true, reduced: true, speed: 2, sound: false},
  })), {id});
  await page.goto(`/#level=${id}`);
}
async function command(page, text) {
  await page.locator('#terminal-input').fill(text);
  await page.locator('#terminal-input').press('Enter');
}
const readTab = page => page.getByRole('tab', {name: 'Görevi anla', exact: true});
const practiceTab = page => page.getByRole('tab', {name: 'Şimdi uygula', exact: true});

test('lesson tabs preserve progress, hints, solution, notes, terminal draft and reading position', async ({page}) => {
  await openLab(page);
  await expect(readTab(page)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.guide-panel')).toBeVisible();
  await expect(page.locator('.practice-panel')).toBeHidden();
  await expect(page.locator('.lesson-guide h2')).toHaveText(levels[0].title);
  await expect(page.getByRole('tablist', {name: 'Ders görünümü'}).getByRole('tab')).toHaveCount(2);
  await expect(page.getByText('SAHA NOTLARI', {exact: true})).toHaveCount(0);
  const panelHeight = await page.locator('.guide-panel').evaluate(el => el.clientHeight);
  const readingPosition = await page.locator('.guide-panel').evaluate(el => {
    el.scrollTop = el.scrollHeight;
    return el.scrollTop;
  });

  await readTab(page).focus();
  await readTab(page).press('ArrowRight');
  await expect(practiceTab(page)).toBeFocused();
  await expect(practiceTab(page)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.guide-panel')).toBeHidden();
  expect(await page.locator('.practice-panel').evaluate(el => el.clientHeight)).toBe(panelHeight);
  await command(page, levels[0].steps[0].command);
  await expect(page.locator('.lesson-tab-count')).toHaveText('1/2');
  await page.getByRole('button', {name: /^İpucu/}).click();
  await page.getByRole('button', {name: 'Çözümü gör', exact: true}).click();
  const hint = await page.locator('.hint-bubble').textContent();
  await page.locator('#terminal-input').fill('docker im');
  await page.locator('.personal-notes summary').click();
  await page.getByLabel('Bu seviye için notlarım').fill('Image paket, container çalışan örnek.');

  await practiceTab(page).focus();
  await practiceTab(page).press('Home');
  await expect(readTab(page)).toHaveAttribute('aria-selected', 'true');
  expect(await page.locator('.guide-panel').evaluate(el => el.scrollTop)).toBe(readingPosition);
  await expect(page.locator('.lesson-tab-count')).toHaveText('1/2');
  await expect(page.locator('#terminal-input')).toHaveValue('docker im');
  await readTab(page).press('End');
  await expect(practiceTab(page)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.hint-bubble')).toHaveText(hint);
  await expect(page.locator('.solution-box')).toBeVisible();
  await expect(page.getByLabel('Bu seviye için notlarım')).toHaveValue('Image paket, container çalışan örnek.');
  await expect(page.locator('.image-item')).toHaveCount(1);
  await expect(page.locator('.terminal-output')).toContainText(levels[0].steps[0].command);

  await command(page, levels[0].steps[1].command);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', {name: 'Sonraki laboratuvara geç'}).click();
  await expect(readTab(page)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.lesson-guide h2')).toHaveText(levels[1].title);
  await expect(page.locator('.lesson-tab-count')).toHaveText('0/1');
  expect(await page.locator('.guide-panel').evaluate(el => el.scrollTop)).toBe(0);
});

test('guide-to-practice action and lesson tabs leave unsaved YAML intact', async ({page}) => {
  await openLab(page, 42);
  await page.getByRole('tab', {name: /Dosyalar/}).click();
  await page.getByRole('button', {name: '+ Dosya oluştur'}).click();
  const draft = 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: unsaved-learning-draft\n';
  await page.getByLabel('YAML düzenleyici').fill(draft);
  await page.getByRole('button', {name: 'Uygulamaya geç'}).click();
  await expect(practiceTab(page)).toBeFocused();
  await expect(practiceTab(page)).toHaveAttribute('aria-selected', 'true');
  await readTab(page).click();
  await page.getByRole('button', {name: 'Aydınlık tema', exact: true}).click();
  await expect(page.getByLabel('YAML düzenleyici')).toHaveValue(draft);
  await expect(page.locator('.pod-card')).toHaveCount(2);
  const editorFont = await page.getByLabel('YAML düzenleyici').evaluate(el => getComputedStyle(el).fontFamily);
  expect(editorFont).not.toContain('VT323');
});

test('all 128 levels render their own three-part explanation and original source', async ({page}, info) => {
  test.skip(info.project.name !== 'desktop', 'All guide content is checked once; interaction checks run on both sizes.');
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openLab(page);
  for (const level of levels) {
    if (level.id > 1) await page.evaluate(id => { location.hash = `level=${id}`; }, level.id);
    await expect(page.locator('.lesson-guide h2')).toHaveText(level.title);
    await expect(readTab(page)).toHaveAttribute('aria-selected', 'true');
    for (const part of ['why', 'how', 'practice']) {
      await expect(page.locator(`[data-guide-section="${part}"] > p`)).toHaveText(guides[level.id][part].replaceAll('`', ''));
    }
    await expect(page.locator('.lesson-guide .source-link')).toHaveAttribute('href', level.source);
    await practiceTab(page).click();
    await expect(page.locator('.task-list li')).toHaveCount(level.steps.length);
  }
  expect(errors).toEqual([]);
});

test('terminal loads a local fixed-width pixel font including Turkish and stays black/green in both themes', async ({page}) => {
  const fontRequests = [];
  page.on('request', request => { if (/\.woff2?(?:\?|$)/.test(request.url())) fontRequests.push(request.url()); });
  await openLab(page, 42);
  const font = await page.evaluate(async () => {
    const loaded = await document.fonts.load('20px "VT323"', 'ÇĞİÖŞÜ çğıöşü 0123456789');
    await document.fonts.ready;
    const context = document.createElement('canvas').getContext('2d');
    context.font = '20px VT323';
    return {
      count: loaded.length,
      ready: loaded.every(face => face.status === 'loaded'),
      narrow: context.measureText('iiiiiiii').width,
      wide: context.measureText('MMMMMMMM').width,
      turkish: context.measureText('çğıöşüİĞ').width,
    };
  });
  expect(font.count).toBeGreaterThan(0);
  expect(font.ready).toBe(true);
  expect(font.narrow).toBeCloseTo(font.wide, 3);
  expect(font.turkish).toBeCloseTo(font.wide, 3);
  expect(fontRequests.length).toBeGreaterThan(0);
  expect(fontRequests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);

  await command(page, 'kubectl get pods -o wide');
  for (const label of ['Aydınlık tema', 'Karanlık tema']) {
    await page.getByRole('button', {name: label, exact: true}).click();
    const colors = await page.evaluate(() => {
      const style = selector => getComputedStyle(document.querySelector(selector));
      return {
        background: style('.terminal').backgroundColor,
        outputBackground: style('.terminal-output').backgroundColor,
        color: style('.terminal-entry pre').color,
        inputColor: style('#terminal-input').color,
        font: style('.terminal-entry pre').fontFamily,
        inputFont: style('#terminal-input').fontFamily,
        outputWhiteSpace: style('.terminal-entry pre').whiteSpace,
      };
    });
    expect(colors.background).toBe('rgb(0, 0, 0)');
    expect(colors.outputBackground).toBe('rgb(0, 0, 0)');
    expect(colors.color).toBe('rgb(101, 255, 136)');
    expect(colors.inputColor).toBe(colors.color);
    expect(colors.font).toContain('VT323');
    expect(colors.inputFont).toContain('VT323');
    expect(colors.outputWhiteSpace).toBe('pre');
  }
  await command(page, 'kubectl not-a-command');
  await expect(page.locator('.terminal-error')).toBeVisible();
  const marker = await page.locator('.terminal-error pre').evaluate(el => getComputedStyle(el, '::before').content);
  expect(marker).toContain('[HATA]');
  await expect(page.locator('.terminal [role="status"]')).toContainText('Komut hatası');
});

for (const [theme, label] of [['dark', 'Karanlık tema'], ['light', 'Aydınlık tema']]) {
  test(`${theme}: both learning views are accessible and captured`, async ({page}, info) => {
    await openLab(page);
    await page.getByRole('button', {name: label, exact: true}).click();
    await page.getByRole('button', {name: 'Üst bölümü daralt', exact: true}).click();
    await page.evaluate(() => document.fonts.ready);
    for (const view of ['guide', 'practice']) {
      if (view === 'practice') await practiceTab(page).click();
      const results = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      await test.info().attach(`${theme}-${view}-axe.json`, {body: JSON.stringify(results.violations, null, 2), contentType: 'application/json'});
      expect(results.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.screenshot({path: `test-results/${info.project.name}-learning-${view}-${theme}.png`, fullPage: true});
    }
  });
}

test('final six-step lesson remains reachable on a 320px phone', async ({page}, info) => {
  await page.setViewportSize({width: 320, height: 740});
  await openLab(page, 128);
  await page.getByRole('button', {name: 'Üst bölümü daralt', exact: true}).click();
  await practiceTab(page).click();
  await expect(page.locator('.task-list li')).toHaveCount(6);
  await page.locator('.task-list li').last().scrollIntoViewIfNeeded();
  await expect(page.locator('.task-list li').last()).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await readTab(page).click();
  await expect(page.locator('.guide-panel')).toBeVisible();
  // The terminal shortcut belongs to the collapsible context, so reopen it first.
  await page.getByRole('button', {name: 'Üst bölümü genişlet', exact: true}).click();
  await page.getByRole('link', {name: 'Terminale geç', exact: true}).click();
  await expect(page.locator('#terminal-input')).toBeFocused();
  await command(page, levels[127].steps[0].command);
  await command(page, levels[127].steps[1].command);
  await practiceTab(page).click();
  await expect(page.locator('.lesson-tab-count')).toHaveText('2/6');
  await page.screenshot({path: `test-results/${info.project.name}-learning-final-phone.png`, fullPage: true});
});
