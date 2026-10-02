import {test, expect} from '@playwright/test';

async function openLab(page) {
  await page.addInitScript(() => localStorage.setItem('learn-k8s:progress:v1', JSON.stringify({
    version: 1, completed: {}, bookmarks: [], notes: {}, quiz: {}, active: 1, days: [],
    settings: {free: true, reduced: true, speed: 2, sound: false},
  })));
  await page.goto('/#level=1');
  await expect(page.getByRole('textbox', {name: 'Terminal komutu', exact: true})).toBeVisible();
}

async function expectBorderless(input) {
  await expect(input).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(input).toHaveCSS('outline-style', 'none');
  await expect(input).toHaveCSS('box-shadow', 'none');
  for (const side of ['top', 'right', 'bottom', 'left']) {
    await expect(input).toHaveCSS(`border-${side}-width`, '0px');
  }
}

for (const [theme, label] of [['dark', 'Karanlık tema'], ['light', 'Aydınlık tema']]) {
  test(`${theme}: terminal input stays subtle with pointer and keyboard focus`, async ({page}, info) => {
    await openLab(page);
    await page.getByRole('button', {name: label, exact: true}).click();
    const terminal = page.locator('.terminal');
    const input = page.getByRole('textbox', {name: 'Terminal komutu', exact: true});
    const output = page.getByLabel('Terminal çıktısı', {exact: true});
    const run = page.getByRole('button', {name: 'Komutu çalıştır', exact: true});
    await expect(terminal.locator('.terminal-tag, .prompt')).toHaveCount(0);
    await expect(terminal).not.toContainText('SIMULATED');
    await expect(terminal).toHaveCSS('background-color', 'rgb(0, 0, 0)');

    await output.focus();
    await expectBorderless(input);
    await input.click();
    await input.fill('docker ps');
    await expect(input).toBeFocused();
    await expectBorderless(input);
    await expect(input).toHaveCSS('font-size', '18px');
    await expect(input).toHaveCSS('caret-color', 'rgb(101, 255, 136)');
    await expect(run).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(run).toHaveCSS('box-shadow', 'none');
    await expect(run).toHaveCSS('border-top-width', '0px');

    const geometry = await page.evaluate(() => {
      const input = document.querySelector('#terminal-input');
      const output = document.querySelector('.terminal-output');
      const row = document.querySelector('.terminal-input-row');
      const button = row.querySelector('button');
      return {
        coarse: matchMedia('(pointer: coarse)').matches,
        rowHeight: row.getBoundingClientRect().height,
        inputHeight: input.getBoundingClientRect().height,
        buttonWidth: button.getBoundingClientRect().width,
        inputLeft: input.getBoundingClientRect().left,
        outputTextLeft: output.getBoundingClientRect().left + parseFloat(getComputedStyle(output).paddingLeft),
      };
    });
    expect(geometry.rowHeight).toBeLessThanOrEqual(geometry.coarse ? 48 : 40);
    expect(geometry.inputHeight).toBe(geometry.coarse ? 40 : 32);
    expect(geometry.buttonWidth).toBe(geometry.coarse ? 40 : 28);
    expect(geometry.inputLeft).toBeCloseTo(geometry.outputTextLeft, 1);

    await input.press('Shift+Tab');
    await expect(output).toBeFocused();
    await expect(output).toHaveCSS('outline-style', 'solid');
    await output.press('Tab');
    await expect(input).toBeFocused();
    await expectBorderless(input);
    // With no completion candidate, Tab must still reach the submit button.
    await input.fill('no-completion-for-this');
    await input.press('Tab');
    await expect(run).toBeFocused();
    await expect(run).toHaveCSS('outline-style', 'solid');
    await expect(run).toHaveCSS('outline-width', '2px');

    await input.fill('docker ps');
    await page.evaluate(() => document.fonts.ready);
    const screenshot = info.outputPath(`terminal-focused-${theme}.png`);
    await terminal.screenshot({path: screenshot});
    await info.attach(`terminal-focused-${theme}`, {path: screenshot, contentType: 'image/png'});
  });
}

test('borderless terminal preserves Enter, history, draft, completion, clear and submit button', async ({page}) => {
  await openLab(page);
  const input = page.getByRole('textbox', {name: 'Terminal komutu', exact: true});
  await input.fill('docker ps');
  await input.press('Enter');
  await expect(page.locator('.terminal-entry .echo')).toHaveText('docker ps');
  await expect(page.locator('.terminal-entry pre')).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();

  await input.fill('docker i');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('docker ps');
  await input.press('ArrowDown');
  await expect(input).toHaveValue('docker i');
  await input.fill('docker pul');
  await input.press('Tab');
  await expect(input).toHaveValue(/^docker pull .+/);
  await expect(input).toBeFocused();
  await expectBorderless(input);
  await input.press('Control+c');
  await expect(input).toHaveValue('');

  await input.fill('docker ps');
  await page.getByRole('button', {name: 'Komutu çalıştır', exact: true}).click();
  await expect(page.locator('.terminal-entry')).toHaveCount(2);
  await expect(page.locator('.terminal-entry .echo').last()).toHaveText('docker ps');
  await expect(input).toHaveValue('');
  await input.focus();
  await input.press('Control+l');
  await expect(page.locator('.terminal-entry')).toHaveCount(0);
});

test('long commands fit a 320px phone without pushing the submit button off screen', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await openLab(page);
  const input = page.getByRole('textbox', {name: 'Terminal komutu', exact: true});
  await input.fill('docker run --name a-very-long-container-name --publish 8080:80 nginx:1.27');
  await expectBorderless(input);
  const fit = await page.evaluate(() => {
    const input = document.querySelector('#terminal-input').getBoundingClientRect();
    const button = document.querySelector('.terminal-input-row > button').getBoundingClientRect();
    return {
      pageWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
      inputRight: input.right,
      buttonLeft: button.left,
      buttonRight: button.right,
    };
  });
  expect(fit.pageWidth).toBeLessThanOrEqual(fit.viewport);
  expect(fit.inputRight).toBeLessThanOrEqual(fit.buttonLeft);
  expect(fit.buttonRight).toBeLessThanOrEqual(fit.viewport);
});
