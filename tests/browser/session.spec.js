import {test, expect} from '@playwright/test';
import {levels} from '../../src/curriculum.js';

test('reload and map resume retain the active lab, task, command, resources and unsaved YAML', async ({page}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('learn-k8s:progress:v2')) localStorage.setItem('learn-k8s:progress:v1', JSON.stringify({
      version:1, completed:{}, notes:{26:'my original note'}, bookmarks:[26], quiz:{}, active:26, days:[],
      settings:{free:true,reduced:true,speed:2,sound:false},
    }));
  });
  await page.goto('/#level=26');
  const input=page.locator('#terminal-input');
  await input.fill('kubectl apply -f pod.yaml');
  await input.press('Enter');
  await expect(page.locator('.lesson-tab-count')).toHaveText('1/2');
  await input.fill('kubectl describe pod ');
  await page.getByRole('tab',{name:/^Dosyalar/}).click();
  const editor=page.getByRole('textbox',{name:'YAML düzenleyici',exact:true});
  const draft=(await editor.inputValue())+'\n# unfinished note\n';
  await editor.fill(draft);
  await page.reload();
  await expect(page.locator('.lesson-tab-count')).toHaveText('1/2');
  await expect(input).toHaveValue('kubectl describe pod ');
  await expect(page.locator('.terminal-entry')).toContainText('pod/web configured');
  await page.getByRole('tab',{name:/^Dosyalar/}).click();
  await expect(editor).toHaveValue(draft);
  await expect(page.locator('.file-toolbar')).toContainText('Kaydedilmedi');
  await page.getByRole('navigation',{name:'Ana gezinti'}).getByRole('button',{name:'Sefer haritası'}).click();
  await expect(page.locator('#resume-title')).toHaveText(levels[25].title);
  await page.locator('.resume-action').click();
  await expect(page).toHaveURL(/#level=26$/);
  await expect(page.locator('.lesson-tab-count')).toHaveText('1/2');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('learn-k8s:progress:v2')));
  expect(saved.notes[levels[25].key]).toBe('my original note');
  expect(saved.bookmarks).toEqual([levels[25].key]);
  await page.getByRole('tab',{name:'Terminal',exact:true}).click();
  await input.fill(levels[25].steps[1].command);
  await input.press('Enter');
  await expect(page.locator('.lesson-tab-count')).toHaveText('2/2');
});

test('visiting another lab keeps per-lab YAML and command drafts in the open tab', async ({page}) => {
  await page.addInitScript(()=>localStorage.setItem('learn-k8s:progress:v1',JSON.stringify({version:1,completed:{},notes:{},bookmarks:[],quiz:{},active:26,days:[],settings:{free:true,reduced:true,speed:2,sound:false}})));
  await page.goto('/#level=26');
  await page.locator('#terminal-input').fill('kubectl apply ');
  await page.getByRole('tab',{name:/^Dosyalar/}).click();
  const editor=page.getByRole('textbox',{name:'YAML düzenleyici',exact:true});
  await editor.fill('# keep this draft');
  await page.evaluate(()=>{location.hash='#level=27';});
  await expect(page.locator('.lesson-title-row h1')).toHaveText(levels[26].title);
  await page.evaluate(()=>{location.hash='#level=26';});
  await expect(page.locator('#terminal-input')).toHaveValue('kubectl apply ');
  await page.getByRole('tab',{name:/^Dosyalar/}).click();
  await expect(editor).toHaveValue('# keep this draft');
});
