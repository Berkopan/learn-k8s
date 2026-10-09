import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {levels} from '../../src/curriculum.js';
import {localizedCurriculum,localizedGuide,localizedReference} from '../../src/localize.js';
import {applyReferenceFiles} from './reference-steps.js';

// Legacy test files explicitly use tr-TR; this suite exercises real English negotiation.
test.use({locale:'en-US'});
const key='learn-k8s:progress:v2';
const legacyKey='learn-k8s:progress:v1';
const languageKey='learn-k8s:language:v1';
const english=localizedCurriculum('en');
const picker=page=>page.locator('.language-switch select');
const practice=page=>page.getByRole('tab',{name:'Put it into practice',exact:true});
async function command(page,text){await page.locator('#terminal-input').fill(text);await page.locator('#terminal-input').press('Enter');}
async function openLab(page,id=1){
 await page.addInitScript(({id,key,legacyKey})=>{
   if(!localStorage.getItem(key)&&!localStorage.getItem(legacyKey))localStorage.setItem(legacyKey,JSON.stringify({version:1,completed:{},bookmarks:[],notes:{},quiz:{},active:id,days:[],settings:{free:true,reduced:true,speed:2,sound:false}}));
 },{id,key,legacyKey});
 await page.goto(`/#level=${id}`);
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.locator('.lesson-title-row h1')).toHaveText(english.levels[id-1].title);
}

test('English visitors see an English atlas; the saved language wins on reload',async({page})=>{
 await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.getByRole('button',{name:'Start your expedition',exact:true})).toBeVisible();
 await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeVisible();
 await expect(page.locator('.module-card')).toHaveCount(16);
 await picker(page).selectOption('tr');
 await expect(page.getByRole('button',{name:'Sefere başla',exact:true})).toBeVisible();
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('lang','tr');
 await expect(picker(page)).toHaveValue('tr');
 await picker(page).selectOption('en');
 await page.getByRole('button',{name:'Start your expedition',exact:true}).click();
 await expect(page).toHaveTitle(/One image, many possibilities/);
});

test('Docker overview, command help, errors, reference and Tab are discoverable in English',async({page})=>{
 await openLab(page);
 await expect(page.locator('.terminal-docker-help')).toContainText('help docker');
 await practice(page).click();
 await command(page,'help');
 await expect(page.locator('.terminal-entry').last()).toContainText('docker inspect CONTAINER');
 await expect(page.locator('.terminal-entry').last()).toContainText('docker ps [-a | --all]');
 await command(page,'docker run --help');
 await expect(page.locator('.terminal-entry').last()).toContainText('Start a container');
 await expect(page.locator('.task-list .task-done')).toHaveCount(0);
 await expect(page.locator('.container-chip')).toHaveCount(0);
 await command(page,'docker build .');
 await expect(page.locator('.terminal-error').last()).toContainText('Unsupported Docker command: build');
 await page.locator('#terminal-input').fill('docker ins');
 await page.locator('#terminal-input').press('Tab');
 await expect(page.locator('#terminal-input')).toHaveValue('docker inspect web');
 await page.getByRole('button',{name:'Command reference',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Docker · images and containers'})).toBeVisible();
 await expect(page.locator('.cheat-grid')).toContainText('docker stop web');
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await command(page,'docker pull nginx:1.27');
 await expect(page.locator('.task-list .task-done')).toHaveCount(1);
 await command(page,'help docker images');
 await expect(page.locator('.task-list .task-done')).toHaveCount(1);
 await command(page,'docker images');
 await expect(page.locator('.reward-dialog')).toBeVisible();
 await expect(page.locator('.reward-meta')).toContainText('COMPLETED');
 await expect(page.locator('.reward-next')).toHaveText('Go to the next lab');
});

test('switching languages preserves drafts, unsaved YAML, notes, help visibility and exact resource state',async({page})=>{
 await openLab(page,26);
 await practice(page).click();
 await page.getByRole('button',{name:'Hint',exact:true}).click();
 await page.getByRole('button',{name:'Solution: show',exact:true}).click();
 await page.locator('.personal-notes summary').click();
 const note='Türkçe notum stays literal: {0} <script>not executable</script>';
 await page.getByRole('textbox',{name:'My notes for this level'}).fill(note);
 await command(page,'help docker');
 await page.locator('#terminal-input').fill('kubectl get po');
 await page.getByRole('tab',{name:/^Files/}).click();
 const editor=page.getByRole('textbox',{name:'YAML editor'});
 const draft=(await editor.inputValue())+'\n# Türkçe yorum: Manifest boş. {0}\n';
 await editor.fill(draft);
 const stored=await page.evaluate(key=>localStorage.getItem(key),key);
 await picker(page).selectOption('tr');
 await expect(page.locator('html')).toHaveAttribute('lang','tr');
 await expect(page.getByRole('textbox',{name:'YAML düzenleyici'})).toHaveValue(draft);
 await expect(page.getByRole('textbox',{name:'Bu seviye için notlarım'})).toHaveValue(note);
 await expect(page.locator('.hint-bubble')).toBeVisible();
 await expect(page.locator('.solution-box')).toBeVisible();
 await expect(page.locator('.lesson-title-row h1')).toHaveText(levels[25].title);
 await picker(page).selectOption('en');
 await expect(editor).toHaveValue(draft);
 expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(stored);
 await page.getByRole('tab',{name:'Terminal',exact:true}).click();
 await expect(page.locator('#terminal-input')).toHaveValue('kubectl get po');
 await expect(page.locator('.terminal-entry').last()).toContainText('DOCKER · SUPPORTED LAB COMMANDS');
 await expect(page.locator('.echo').last()).toContainText('help docker');
 await picker(page).selectOption('tr');
 await expect(page.locator('.terminal-entry').last()).toContainText('DOCKER · LABORATUVAR KOMUTLARI');
 await expect(page.locator('#terminal-input')).toHaveValue('kubectl get po');
});

test('invalid saved language falls back to the supported browser language',async({page})=>{
 await page.addInitScript(key=>localStorage.setItem(key,'unsupported-language'),languageKey);
 await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(picker(page)).toHaveValue('en');
});

test('denied storage from startup does not break language switching',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 // Use a fresh document: changing only its hash would not rerun initialization scripts.
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');},configurable:true}));
 await page.goto('/#level=1');
 await expect(page.locator('.storage-warning')).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await picker(page).selectOption('tr');
 await expect(page.locator('.lesson-title-row h1')).toHaveText(levels[0].title);
 await picker(page).selectOption('en');
 await expect(page.locator('.lesson-title-row h1')).toHaveText(english.levels[0].title);
 expect(errors).toEqual([]);
});

test('all 128 English labs show their own guide and complete with reference commands and explicit edits',async({page},info)=>{
 test.skip(info.project.name!=='desktop','Complete English progression runs once; focused mobile interactions are tested separately.');
 test.setTimeout(360000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await openLab(page);
 for(const source of levels){
   const translated=english.levels[source.id-1];
   await expect(page.locator('.lesson-title-row h1')).toHaveText(translated.title);
   await expect(page.locator('[data-guide-section="why"] p')).toHaveText(localizedGuide(source.id,'en').why.replaceAll('`',''));
   await expect(page.locator('.guide-footer .source-link')).toHaveAttribute('href',source.source);
   await practice(page).click();
   await expect(page.locator('.task-list li p')).toHaveText(translated.steps.map(step=>step.text));
   for(const step of source.steps){await applyReferenceFiles(page,step);await command(page,step.command);}
   await expect(page.locator('.reward-dialog')).toBeVisible();
   await expect(page.locator('.reward-meta>span')).toContainText(String(source.id).padStart(3,'0'));
   if(source.id<128)await page.getByRole('button',{name:'Go to the next lab',exact:true}).click();
 }
 expect(errors).toEqual([]);
 const progress=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 expect(Object.keys(progress.completed)).toHaveLength(128);
 await expect(page.getByRole('button',{name:'View your journey',exact:true})).toBeVisible();
});

test('English glossary, module quiz and final navigation use the same learning record',async({page})=>{
 await openLab(page,128);
 await page.getByRole('button',{name:'Glossary',exact:true}).click();
 await expect(page.locator('.glossary-grid article')).toHaveCount(48);
 await page.getByRole('textbox',{name:'Search the glossary'}).fill('encoding');
 await expect(page.locator('.glossary-grid')).toContainText('Base64 is encoding, not encryption');
 await page.getByRole('button',{name:'Close',exact:true}).click();
 for(const step of levels[127].steps)await command(page,step.command);
 const quiz=localizedReference('en').quizzes[15];
 await expect(page.locator('.quiz-box h3')).toHaveText(quiz.question);
 await page.locator('.quiz-box>button').nth(quiz.answer).click();
 await expect(page.locator('.quiz-box [role="status"]')).toContainText('Correct.');
 await page.getByRole('button',{name:'View your journey',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('Expedition badges');
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).quiz[15],key)).toBe(true);
});

for(const [theme,label] of [['dark','Dark theme'],['light','Light theme']]){
 test(`English ${theme}: desktop/mobile layout and accessible language controls`,async({page},info)=>{
   await openLab(page,1);
   await page.getByRole('button',{name:label,exact:true}).click();
   await command(page,'help docker run');
   await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
   const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations;
   expect(violations).toEqual([]);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.screenshot({path:`test-results/${info.project.name}-${theme}-english-lab.png`,fullPage:true});
   await page.setViewportSize({width:320,height:740});
   await expect(picker(page)).toBeInViewport();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await practice(page).click();
   await expect(page.getByRole('button',{name:'Hint',exact:true})).toBeVisible();
   await picker(page).selectOption('tr');
   await picker(page).selectOption('en');
   await expect(page.getByRole('button',{name:label,exact:true})).toBeInViewport();
   await page.screenshot({path:`test-results/${info.project.name}-${theme}-english-phone.png`,fullPage:true});
 });
}
