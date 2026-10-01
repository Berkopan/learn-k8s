import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const key='learn-k8s:theme:v1';
async function freeLab(page){
 await page.addInitScript(()=>localStorage.setItem('learn-k8s:progress:v1',JSON.stringify({version:1,completed:{},bookmarks:[],notes:{},quiz:{},active:42,days:[],settings:{free:true,reduced:true,speed:2,sound:false}})));
 await page.goto('/#level=42');
}
async function audit(page,name){
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 await test.info().attach(name,{body:JSON.stringify(results.violations,null,2),contentType:'application/json'});
 expect(results.violations).toEqual([]);
}
for(const [theme,label] of [['dark','Karanlık tema'],['light','Aydınlık tema']]){
 test(`${theme}: atlas, real module catalogue and readable dialogs`,async({page},info)=>{
  await page.goto('/');await page.getByRole('button',{name:label,exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  await expect(page.locator('.intro-copy h1')).toHaveText('Kümeyi tanı.Dümeni ele al.');
  await expect(page.locator('.module-card')).toHaveCount(16);
  await expect(page.locator('.module-card.is-current')).toHaveCount(1);
  await expect(page.locator('.mini-route button:enabled')).toHaveCount(1);
  await audit(page,`${theme}-atlas-axe`);
  await page.screenshot({path:`test-results/${info.project.name}-${theme}-atlas.png`,fullPage:true});
  await page.locator('.module-card').nth(3).click();await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.course-row')).toHaveCount(8);await audit(page,`${theme}-catalogue-axe`);
  await page.getByRole('button',{name:'Kapat',exact:true}).click();
  await page.getByRole('button',{name:'Sefere başla',exact:true}).click();
  await expect(page.locator('.lesson-title-row h1')).toBeVisible();await expect(page.locator('.atlas')).toHaveCount(0);
  const width=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,viewport:innerWidth}));expect(width.actual).toBeLessThanOrEqual(width.viewport+1);
 });
 test(`${theme}: populated laboratory, editor and inspector`,async({page},info)=>{
  await freeLab(page);await page.getByRole('button',{name:label,exact:true}).click();
  await expect(page.locator('.pod-card')).toHaveCount(2);
  await expect(page.locator('.zone-marker-briefing')).toContainText('01 · BRIEFING');
  await expect(page.locator('.zone-marker-workbench')).toContainText('02 · WORKBENCH');
  const caution=page.locator('.caution-note');
  await expect(caution).not.toHaveAttribute('open','');
  const compact=await caution.evaluate(el=>({width:el.getBoundingClientRect().width,parent:el.parentElement.getBoundingClientRect().width}));
  expect(compact.width).toBeLessThan(compact.parent*.72);
  await caution.locator('summary').click();await expect(caution).toHaveAttribute('open','');
  const expanded=await caution.evaluate(el=>{const parent=el.parentElement,style=getComputedStyle(parent);const contentWidth=parent.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);return {width:el.getBoundingClientRect().width,contentWidth};});
  expect(expanded.width).toBeGreaterThan(expanded.contentWidth*.95);
  await expect(caution.locator('p')).toContainText(/./);
  await caution.locator('summary').click();
  const zones=await page.evaluate(()=>{const left=document.querySelector('.lesson-pane'),right=document.querySelector('.workspace');return {left:getComputedStyle(left).backgroundColor,right:getComputedStyle(right).backgroundColor,leftTop:left.getBoundingClientRect().top,rightTop:right.getBoundingClientRect().top};});
  expect(zones.left).not.toBe(zones.right);
  if(info.project.name==='desktop')expect(Math.abs(zones.leftTop-zones.rightTop)).toBeLessThan(3);
  await audit(page,`${theme}-lab-axe`);
  await page.screenshot({path:`test-results/${info.project.name}-${theme}-laboratory.png`,fullPage:true});
  await page.locator('.pod-card').first().click();await audit(page,`${theme}-inspector-axe`);
  await page.getByRole('button',{name:'Kapat',exact:true}).click();
  await page.getByRole('tab',{name:/Dosyalar/}).click();await audit(page,`${theme}-editor-axe`);
 });
}
test('saved preference survives reload; system reacts to OS changes',async({page})=>{
 await page.emulateMedia({colorScheme:'light'});await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.getByRole('button',{name:'Aydınlık tema',exact:true}).click();await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.getByRole('button',{name:'Aydınlık tema',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.getByRole('button',{name:'Sistem teması',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('system');
});
test('theme and atlas navigation preserve lab state, terminal draft and unsaved YAML',async({page})=>{
 await freeLab(page);const input=page.locator('#terminal-input');await input.fill('kubectl get pods');await input.press('Enter');
 await input.fill('kubectl describe pod ');const progress=await page.evaluate(()=>localStorage.getItem('learn-k8s:progress:v1'));
 await page.getByRole('tab',{name:/Dosyalar/}).click();await page.getByRole('button',{name:'+ Dosya oluştur'}).click();
 const yaml='apiVersion: v1\nkind: Pod\nmetadata:\n  name: still-a-draft\n';await page.getByLabel('YAML düzenleyici').fill(yaml);
 for(const label of ['Aydınlık tema','Karanlık tema']){await page.getByRole('button',{name:label,exact:true}).click();await expect(page.getByLabel('YAML düzenleyici')).toHaveValue(yaml);}
 await page.locator('.global-nav').getByRole('button',{name:'Sefer haritası',exact:true}).click();
 await page.locator('.global-nav').getByRole('button',{name:'Laboratuvar',exact:true}).click();
 await expect(page.getByLabel('YAML düzenleyici')).toHaveValue(yaml);
 await page.getByRole('tab',{name:'Terminal',exact:true}).click();await expect(input).toHaveValue('kubectl describe pod ');
 await expect(page.locator('.pod-card')).toHaveCount(2);await expect(page.locator('.terminal-output')).toContainText('kubectl get pods');
 expect(await page.evaluate(()=>localStorage.getItem('learn-k8s:progress:v1'))).toBe(progress);
});
test('themes remain usable when local storage is denied',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
 await page.goto('/');await expect(page.locator('.atlas')).toBeVisible();
 await page.getByRole('button',{name:'Aydınlık tema',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.getByRole('button',{name:'Karanlık tema',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('small phones have reachable themes and no document overflow',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.goto('/');
 for(const label of ['Aydınlık tema','Karanlık tema']){
  await page.getByRole('button',{name:label,exact:true}).click();await expect(page.getByRole('button',{name:label,exact:true})).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
 }
 await page.getByRole('button',{name:'Sefere başla',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
 await page.getByRole('link',{name:'Terminale geç',exact:true}).click();await expect(page.locator('#terminal-input')).toBeFocused();
});
