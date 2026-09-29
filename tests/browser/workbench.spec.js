import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {levels} from '../../src/curriculum.js';
async function command(page,text){await page.locator('#terminal-input').fill(text);await page.locator('#terminal-input').press('Enter');}
async function freeExplore(page,id=1){await page.addInitScript(({id})=>{const p={version:1,completed:{},bookmarks:[],notes:{},quiz:{},active:id,days:[],settings:{free:true,reduced:true,speed:2,sound:false}};localStorage.setItem('learn-k8s:progress:v1',JSON.stringify(p));},{id});await page.goto(`/#level=${id}`);}
test('first lesson, errors, reward, persistence and no duplicate XP',async({page},info)=>{
 await page.goto('/');await expect(page.locator('h1')).toHaveText(levels[0].title);expect(await page.evaluate(()=>scrollY)).toBe(0);
 await page.screenshot({path:`test-results/${info.project.name}-01-start.png`,fullPage:true});
 await command(page,'docker magic');await expect(page.locator('.mission-heading>b')).toHaveText('0/2');await expect(page.locator('.terminal-error')).toBeVisible();
 await command(page,'docker pull nginx:1.27');await expect(page.locator('.mission-heading>b')).toHaveText('1/2');
 await command(page,'docker images');await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.reward-meta strong')).toHaveText('+40 XP');
 await page.getByRole('button',{name:'Burada denemeye devam et'}).click();await page.reload();await expect(page.locator('.completed-label')).toBeVisible();
 await command(page,'docker pull nginx:1.27');await command(page,'docker images');
 const value=await page.evaluate(()=>JSON.parse(localStorage.getItem('learn-k8s:progress:v1')));expect(Object.keys(value.completed)).toHaveLength(1);
 await page.screenshot({path:`test-results/${info.project.name}-02-reward.png`,fullPage:true});
});
test('all 128 guided lessons can be completed through the real UI',async({page},info)=>{
 test.skip(info.project.name!=='desktop','Engine suite covers all labs on every run; full UI progression runs once.');test.setTimeout(360000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 for(const level of levels){await expect(page.locator('.lesson-title-row h1')).toHaveText(level.title);for(const step of level.steps)await command(page,step.command);await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.reward-meta>span')).toContainText(String(level.id).padStart(3,'0'));if(level.id<128)await page.getByRole('button',{name:'Sonraki laboratuvara geç'}).click();}
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('learn-k8s:progress:v1')));expect(Object.keys(data.completed)).toHaveLength(128);expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/desktop-03-final.png',fullPage:true});
});
test('populated topology, inspector, valid/invalid YAML and mobile layout',async({page},info)=>{
 await freeExplore(page,42);await expect(page.locator('.pod-card')).toHaveCount(2);await expect(page.locator('.service-card')).toHaveCount(1);
 await page.screenshot({path:`test-results/${info.project.name}-04-cluster.png`,fullPage:true});
 const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));expect(size.scroll).toBeLessThanOrEqual(size.width+1);
 await page.locator('.pod-card').first().click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Kapat',exact:true}).click();
 await page.getByRole('tab',{name:/Dosyalar/}).click();await page.getByRole('button',{name:'+ Dosya oluştur'}).click();await page.getByLabel('YAML düzenleyici').fill('bad: [');await page.getByRole('button',{name:'Doğrula ve kaydet'}).click();await expect(page.getByRole('alert')).toBeVisible();
 await page.getByLabel('YAML düzenleyici').fill('apiVersion: v1\nkind: Pod\nmetadata:\n  name: custom\nspec:\n  containers:\n    - name: web\n      image: nginx:1.27\n');await page.getByRole('button',{name:'Doğrula ve kaydet'}).click();await expect(page.locator('.inline-error')).toHaveCount(0);
 await page.getByRole('tab',{name:'Terminal',exact:true}).click();await command(page,'kubectl apply -f custom.yaml');await expect(page.locator('.pod-card')).toHaveCount(3);
});
test('keyboard search and key WCAG checks',async({page},info)=>{
 await freeExplore(page,42);
 await page.keyboard.press('Control+k');await expect(page.getByRole('dialog')).toBeVisible();await page.getByLabel('Seviye ara').fill('CronJob');await expect(page.locator('.course-row').first()).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 await test.info().attach('accessibility.json',{body:JSON.stringify(results.violations,null,2),contentType:'application/json'});
 expect(results.violations).toEqual([]);
});
