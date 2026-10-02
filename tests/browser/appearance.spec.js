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
  await expect(page.locator('.caution-note')).toHaveCount(0);
  const infoButton=page.getByRole('button',{name:'Gerçek kümede aklında tut'});
  await expect(infoButton).toBeVisible();
  const triggerStyle=await infoButton.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,border:s.borderTopWidth,width:el.getBoundingClientRect().width};});
  expect(triggerStyle.background).toBe('rgba(0, 0, 0, 0)');
  expect(triggerStyle.border).toBe('0px');
  expect(triggerStyle.width).toBeLessThanOrEqual(24);
  await infoButton.click();await expect(infoButton).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#real-cluster-note')).toBeVisible();
  await expect(page.locator('#real-cluster-note')).toContainText(/Gerçek kümede/);
  if(info.project.name==='desktop')await page.locator('.workspace').screenshot({path:`test-results/${theme}-real-cluster-info.png`});
  await page.keyboard.press('Escape');await expect(page.locator('#real-cluster-note')).toHaveCount(0);
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
test('initial theme follows the OS until the user makes an explicit choice',async({page})=>{
 await page.emulateMedia({colorScheme:'light'});await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.getByRole('button',{name:'Aydınlık tema',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByRole('button',{name:'Sistem teması',exact:true})).toHaveCount(0);
 expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
 await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.getByRole('button',{name:'Aydınlık tema',exact:true}).click();await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.getByRole('button',{name:'Aydınlık tema',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('light');
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


test('retro navbar uses pixel chrome without sacrificing theme controls',async({page},info)=>{
 await freeLab(page);await page.getByRole('button',{name:'Karanlık tema',exact:true}).click();
 await expect(page.locator('.theme-switch>button')).toHaveCount(2);
 const chrome=await page.evaluate(()=>{
  const nav=document.querySelector('.global-nav button');
  const theme=document.querySelector('.theme-switch');
  const tool=document.querySelector('.masthead-tools .icon-button');
  const mast=document.querySelector('.masthead');
  return {
   navRadius:getComputedStyle(nav).borderRadius,
   navFont:getComputedStyle(nav).fontFamily,
   themeRadius:getComputedStyle(theme).borderRadius,
   themeShadow:getComputedStyle(theme).boxShadow,
   toolRadius:getComputedStyle(tool).borderRadius,
   stripe:getComputedStyle(mast,'::after').backgroundImage,
  };
 });
 expect(chrome.navRadius).toBe('0px');expect(chrome.themeRadius).toBe('0px');expect(chrome.toolRadius).toBe('0px');
 expect(chrome.navFont.toLowerCase()).toContain('mono');expect(chrome.themeShadow).not.toBe('none');expect(chrome.stripe).toContain('repeating-linear-gradient');
 if(info.project.name==='desktop')await page.screenshot({path:'test-results/desktop-06-retro-navbar.png',fullPage:false});
});


test('browser-only note and GitHub repository link live in the global footer',async({page})=>{
 await freeLab(page);
 const workspace=page.locator('.workspace');
 const footer=page.locator('.site-footer');
 await expect(workspace).not.toContainText('%100 tarayıcı içinde');
 await expect(footer).toContainText('%100 tarayıcı içinde');
 const github=footer.getByRole('link',{name:'GitHub',exact:true});
 await expect(github).toHaveAttribute('href','https://github.com/Berkopan/learn-k8s');
 await expect(github).toHaveAttribute('target','_blank');
 await expect(github).toHaveAttribute('rel',/noopener/);
});
