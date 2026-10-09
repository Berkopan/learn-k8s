import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {levels} from '../../src/curriculum.js';
import {createChallenge,predictionFor} from '../../src/learning.js';

test.setTimeout(30000);
const progressKey='learn-k8s:progress:v2';
async function open(page,id=122,{completed={},locale='tr'}={}){
  await page.addInitScript(({id,completed,locale,progressKey})=>{
    localStorage.setItem('learn-k8s:language:v1',locale);
    if(!localStorage.getItem(progressKey))localStorage.setItem('learn-k8s:progress:v1',JSON.stringify({version:1,completed,notes:{},bookmarks:[],quiz:{},active:id,days:[],settings:{free:true,reduced:true,speed:2,sound:false}}));
  },{id,completed,locale,progressKey});
  await page.goto(`/#level=${id}`);
}
async function command(page,text){await page.locator('#terminal-input').fill(text);await page.locator('#terminal-input').press('Enter');}
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),progressKey);

test('independent incidents expose symptoms, accept semantic repairs and create a distinct next variant',async({page})=>{
  await open(page);
  await page.getByRole('button',{name:'Alıştırmalar',exact:true}).click();
  const center=page.getByRole('dialog',{name:'Alıştırmalar'});
  await center.getByLabel('Senaryo numarası',{exact:true}).fill('42');
  await center.locator('article').filter({has:page.getByRole('heading',{name:'Erişim kesintisi',exact:true})}).getByRole('button').click();
  const challenge=createChallenge('traffic',42);
  await expect(page).toHaveURL(/#level=122&challenge=traffic&seed=42$/);
  await expect(page.locator('.lesson-title-row h1')).toHaveText(challenge.title);
  await expect(page.locator('[data-guide-section="why"] p')).toHaveText(challenge.guide.why);
  await expect(page.locator('.solution-box')).toHaveCount(0);
  await command(page,'kubectl exec client-16 -- hostname');
  await expect(page.locator('.lesson-tab-count')).toHaveText('0/1');
  const commands=challenge.steps[0].solutionCommands;
  for(const text of commands.slice(0,-1))await command(page,text);
  await expect(page.locator('.lesson-tab-count')).toHaveText('0/1');
  await command(page,commands.at(-1).replace('wget -qO-','curl'));
  await expect(page.locator('.lesson-tab-count')).toHaveText('1/1');
  await expect(page.locator('.reward-dialog .challenge-debrief')).toContainText(challenge.debrief);
  expect((await saved(page)).practice[challenge.sourceKey].challengeSuccesses).toBe(1);
  await page.getByRole('button',{name:'Burada denemeye devam et',exact:true}).click();
  await page.getByRole('button',{name:'Yeni varyant',exact:true}).click();
  await expect(page).toHaveURL(/&seed=43$/);
  await expect(page.locator('.lesson-tab-count')).toHaveText('0/1');
  await expect(page.locator('.terminal-entry')).toHaveCount(0);
  await expect(page.locator('[data-guide-section="why"] p')).toHaveText(createChallenge('traffic',43).guide.why);
});

test('a partially repaired incident resumes after reload and remains separate from its guided lab',async({page})=>{
  await open(page,121);
  await page.evaluate(()=>{location.hash='#level=121&challenge=release&seed=51';});
  const challenge=createChallenge('release',51);
  for(const text of challenge.steps[0].solutionCommands.slice(0,-1))await command(page,text);
  await page.locator('#terminal-input').fill('kubectl get pods -n staging');
  await page.reload();
  await expect(page).toHaveURL(/#level=121&challenge=release&seed=51$/);
  await expect(page.locator('.lesson-title-row h1')).toHaveText(challenge.title);
  await expect(page.locator('#terminal-input')).toHaveValue('kubectl get pods -n staging');
  await expect(page.locator('.lesson-tab-count')).toHaveText('0/1');
  await command(page,challenge.steps[0].solutionCommands.at(-1));
  await expect(page.locator('.lesson-tab-count')).toHaveText('1/1');
  await page.getByRole('button',{name:'Burada denemeye devam et',exact:true}).click();
  await page.getByRole('button',{name:'Rehberli lab’a dön',exact:true}).click();
  await expect(page).toHaveURL(/#level=121$/);
  await expect(page.locator('.lesson-title-row h1')).toHaveText(levels[120].title);
  await expect(page.locator('.lesson-tab-count')).toHaveText(`0/${levels[120].steps.length}`);
});

test('reviewing an assisted completion records independent practice without awarding XP twice',async({page})=>{
  await open(page,1,{completed:{1:{date:'2026-10-01',assisted:true}}});
  await page.getByRole('button',{name:'Alıştırmalar',exact:true}).click();
  await page.locator('.review-list button').filter({hasText:levels[0].title}).click();
  for(const step of levels[0].steps)await command(page,step.command);
  await expect(page.locator('.reward-meta strong')).toHaveText('Tekrar tamamlandı');
  const progress=await saved(page),key=levels[0].key;
  expect(progress.completed[key]).toEqual({date:'2026-10-01',assisted:true});
  expect(progress.practice[key].count).toBe(2);
  expect(progress.practice[key].lastIndependentSuccess).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(Object.keys(progress.completed)).toHaveLength(1);
});

test('optional prediction preserves its choice on reload without advancing the lab',async({page})=>{
  await open(page,56,{locale:'en'});
  await page.getByRole('tab',{name:'Put it into practice',exact:true}).click();
  await page.locator('.prediction-check summary').click();
  const prediction=predictionFor(56,'en');
  await page.locator('.prediction-options button').nth(prediction.answer).click();
  await expect(page.locator('.prediction-content [role="status"]')).toContainText(prediction.explanation);
  await expect(page.locator('.lesson-tab-count')).toHaveText(`0/${levels[55].steps.length}`);
  expect(Object.keys((await saved(page)).completed)).toHaveLength(0);
  await page.reload();
  await page.getByRole('tab',{name:'Put it into practice',exact:true}).click();
  await page.locator('.prediction-check summary').click();
  await expect(page.locator('.prediction-options button').nth(prediction.answer)).toHaveAttribute('aria-pressed','true');
});

test('practice center is accessible at 320px and all real-cluster packages download',async({page,request})=>{
  await page.setViewportSize({width:320,height:740});
  await open(page,1,{locale:'en'});
  await page.getByRole('button',{name:'Practice',exact:true}).click();
  const center=page.getByRole('dialog',{name:'Practice',exact:true});
  await expect(center).toBeVisible();
  const links=center.getByRole('link',{name:/Download package/});
  await expect(links).toHaveCount(3);
  for(const link of await links.all()){
    const response=await request.get(await link.getAttribute('href'));
    expect(response.ok()).toBe(true);
    expect((await response.body()).subarray(0,4).toString('hex')).toBe('504b0304');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
});
