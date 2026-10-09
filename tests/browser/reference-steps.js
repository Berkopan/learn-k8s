import {expect} from '@playwright/test';
import {stringify} from 'yaml';

/** Exercise the editor explicitly; reference edits must never bypass the learner UI. */
export async function applyReferenceFiles(page, step) {
  if (!step.referenceFiles) return;
  await page.getByRole('tab', {name: /^(Files|Dosyalar)\b/}).click();
  for (const [filename, documents] of Object.entries(step.referenceFiles)) {
    await page.getByRole('combobox', {name: /^(Lab file|Laboratuvar dosyası)$/}).selectOption(filename);
    const text = typeof documents === 'string' ? documents : documents.map(document => stringify(document)).join('---\n');
    await page.getByRole('textbox', {name: /^(YAML editor|YAML düzenleyici)$/}).fill(text);
    await page.getByRole('button', {name: /^(Validate and save|Doğrula ve kaydet)$/}).click();
    await expect(page.locator('.inline-error')).toHaveCount(0);
  }
  await page.getByRole('tab', {name: 'Terminal', exact: true}).click();
}
