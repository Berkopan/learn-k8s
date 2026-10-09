import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openLab(page, id = 42) {
  await page.addInitScript(({id}) => {
    localStorage.setItem('learn-k8s:language:v1', 'tr');
    localStorage.setItem('learn-k8s:progress:v1', JSON.stringify({
      version: 1, completed: {}, bookmarks: [], notes: {}, quiz: {}, active: id, days: [],
      settings: {free: true, reduced: true, speed: 2, sound: false},
    }));
  }, {id});
  await page.goto(`/#level=${id}`);
}

test('YAML drafts survive tool tabs, file switches and new files', async ({page}) => {
  await openLab(page);
  const files = page.getByRole('tab', {name: /^Dosyalar/});
  await files.click();
  await page.getByRole('button', {name: '+ Dosya oluştur', exact: true}).click();
  const draft = '# keep my unfinished edit\napiVersion: v1\nkind: Pod\nmetadata:\n  name: never-discard-this\n';
  const editor = page.getByRole('textbox', {name: 'YAML düzenleyici', exact: true});
  await editor.fill(draft);
  await page.getByRole('tab', {name: 'Terminal', exact: true}).click();
  await expect(editor).toBeHidden();
  await files.click();
  await expect(editor).toHaveValue(draft);

  await page.getByRole('textbox', {name: 'Yeni dosya adı', exact: true}).fill('second.yaml');
  await page.getByRole('button', {name: '+ Dosya oluştur', exact: true}).click();
  await expect(page.getByLabel('Laboratuvar dosyası', {exact: true})).toHaveValue('second.yaml');
  await editor.fill('# another unfinished file');
  await page.getByLabel('Laboratuvar dosyası', {exact: true}).selectOption('custom.yaml');
  await expect(editor).toHaveValue(draft);
  await expect(page.locator('.file-toolbar')).toContainText('Kaydedilmedi');
  await page.getByLabel('Laboratuvar dosyası', {exact: true}).selectOption('second.yaml');
  await expect(editor).toHaveValue('# another unfinished file');
});

test('Tab cycles real resource names and Shift+Tab still leaves the terminal input', async ({page}) => {
  await openLab(page);
  const input = page.getByRole('textbox', {name: 'Terminal komutu', exact: true});
  for (const name of ['qa-alpha', 'qa-beta']) {
    await input.fill(`kubectl create deployment ${name} --image=nginx:1.27`);
    await input.press('Enter');
  }
  await input.fill('kubectl describe deployment qa-');
  await input.press('Tab');
  await expect(input).toHaveValue('kubectl describe deployment qa-alpha');
  await expect(page.getByRole('group', {name: 'Komut önerileri'})).toBeVisible();
  await input.press('Tab');
  await expect(input).toHaveValue('kubectl describe deployment qa-beta');
  await input.press('Tab');
  await expect(input).toHaveValue('kubectl describe deployment qa-alpha');
  await input.press('Shift+Tab');
  await expect(page.getByLabel('Terminal çıktısı', {exact: true})).toBeFocused();
  await expect(page.getByRole('group', {name: 'Komut önerileri'})).toHaveCount(0);
  await input.fill('no-completion-for-this');
  await input.press('Tab');
  await expect(page.getByRole('button', {name: 'Komutu çalıştır', exact: true})).toBeFocused();
});

test('oversized pastes are rejected visibly without truncating the command or YAML draft', async ({page}) => {
  await openLab(page);
  async function paste(locator, text) {
    return locator.evaluate((element, value) => {
      element.setSelectionRange(element.value.length, element.value.length);
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', value);
      const event = new ClipboardEvent('paste', {clipboardData, bubbles: true, cancelable: true});
      element.dispatchEvent(event);
      return event.defaultPrevented;
    }, text);
  }
  const input = page.getByRole('textbox', {name: 'Terminal komutu', exact: true});
  await expect(input).toHaveAttribute('maxlength', '8000');
  await input.fill('kubectl get pods');
  expect(await paste(input, 'x'.repeat(8001))).toBe(true);
  await expect(input).toHaveValue('kubectl get pods');
  await expect(page.locator('#terminal-completion-status')).toContainText('komut değiştirilmedi');

  await page.getByRole('tab', {name: /^Dosyalar/}).click();
  await page.getByRole('button', {name: '+ Dosya oluştur', exact: true}).click();
  const editor = page.getByRole('textbox', {name: 'YAML düzenleyici', exact: true});
  await expect(editor).toHaveAttribute('maxlength', '200000');
  await editor.fill('# keep this unfinished draft');
  expect(await paste(editor, 'x'.repeat(200001))).toBe(true);
  await expect(editor).toHaveValue('# keep this unfinished draft');
  await expect(page.locator('#file-editor-message')).toContainText('YAML değiştirilmedi');
  const name = page.getByRole('textbox', {name: 'Yeni dosya adı', exact: true});
  await expect(name).toHaveAttribute('maxlength', '200');
  expect(await paste(name, 'x'.repeat(201))).toBe(true);
  await expect(name).toHaveValue('custom.yaml');
  await expect(page.locator('#file-editor-message')).toContainText('dosya adı değiştirilmedi');
});

test('resource differences stay collapsed until requested and a read-only command reports no changes', async ({page}) => {
  await openLab(page);
  const input = page.getByRole('textbox', {name: 'Terminal komutu', exact: true});
  await input.fill('kubectl scale deployment/web --replicas=3');
  await input.press('Enter');
  const changes = page.locator('.command-diff');
  await expect(changes).toBeVisible();
  await expect(changes).not.toHaveAttribute('open', '');
  await changes.locator(':scope > summary').click();
  await changes.locator('.resource-change > summary').filter({hasText: 'Deployment/web'}).click();
  const replicas = changes.getByRole('row').filter({hasText: 'spec.replicas'});
  await expect(replicas.getByRole('cell').last()).toHaveText('3');
  await input.fill('kubectl get pods');
  await input.press('Enter');
  await expect(changes).toContainText('Bu komut gözlenen kaynak durumunu değiştirmedi.');
  await expect(changes.locator('.resource-change')).toHaveCount(0);
});

test('the Service inspector separates readiness, endpoints and port declarations', async ({page}) => {
  await openLab(page);
  await page.locator('.service-card').filter({hasText: 'web'}).click();
  const diagnostics = page.locator('.service-diagnostics');
  await diagnostics.locator('summary').click();
  await expect(diagnostics).toContainText('EndpointSlice');
  await expect(diagnostics).toContainText('Service 8080 → targetPort 80');
  await expect(diagnostics.locator('tbody tr')).toHaveCount(2);
  const accessibility = await new AxeBuilder({page}).include('.resource-diagnostics').analyze();
  expect(accessibility.violations).toEqual([]);
});

test('a Pending Pod inspector reports the scheduler checks for each node', async ({page}) => {
  await openLab(page);
  await page.getByRole('tab', {name: /^Dosyalar/}).click();
  await page.getByRole('button', {name: '+ Dosya oluştur', exact: true}).click();
  await page.getByRole('textbox', {name: 'YAML düzenleyici', exact: true}).fill('apiVersion: v1\nkind: Pod\nmetadata:\n  name: qa-pending\nspec:\n  nodeSelector:\n    zone: north\n  containers:\n    - name: web\n      image: nginx:1.27\n');
  await page.getByRole('button', {name: 'Doğrula ve kaydet', exact: true}).click();
  await page.getByRole('tab', {name: 'Terminal', exact: true}).click();
  const input = page.getByRole('textbox', {name: 'Terminal komutu', exact: true});
  await input.fill('kubectl apply -f custom.yaml');
  await input.press('Enter');
  await page.locator('.pod-card').filter({hasText: 'qa-pending'}).click();
  const diagnostics = page.locator('.resource-diagnostics');
  await diagnostics.locator('summary').click();
  await expect(diagnostics.getByText('nodeSelector eşleşmiyor.', {exact: true})).toHaveCount(2);
  await expect(diagnostics).toContainText('worker-1');
  await expect(diagnostics).toContainText('worker-2');
});

test('collapsing topology preserves input and keeps the current task beside mobile tools', async ({page}, info) => {
  await openLab(page);
  const input = page.getByRole('textbox', {name: 'Terminal komutu', exact: true});
  await input.fill('kubectl describe service ');
  await page.getByRole('button', {name: 'Topolojiyi gizle', exact: true}).click();
  await expect(page.locator('#workspace-topology')).toBeHidden();
  await expect(input).toHaveValue('kubectl describe service ');
  if (info.project.name === 'mobile') {
    const task = page.locator('.mobile-active-task');
    await expect(task).toBeVisible();
    await task.locator('summary').click();
    await expect(task.locator('p')).toContainText('Service');
  } else await expect(page.locator('.mobile-active-task')).toBeHidden();
  await page.getByRole('button', {name: 'Topolojiyi göster', exact: true}).click();
  await expect(page.locator('#workspace-topology')).toBeVisible();
  await expect(input).toHaveValue('kubectl describe service ');
  const viewport = await page.evaluate(() => ({width: innerWidth, scroll: document.documentElement.scrollWidth}));
  expect(viewport.scroll).toBeLessThanOrEqual(viewport.width);
});
