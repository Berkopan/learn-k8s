import {test, expect} from '@playwright/test';

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
