import {test,expect} from '@playwright/test';
async function freeLab(page){
 await page.addInitScript(()=>localStorage.setItem('learn-k8s:progress:v1',JSON.stringify({version:1,completed:{},bookmarks:[],notes:{},quiz:{},active:42,days:[],settings:{free:true,reduced:true,speed:2,sound:false}})));
 await page.goto('/#level=42');
}
async function tabTo(page,locator){
 for(let i=0;i<80;i++){
  await page.keyboard.press('Tab');
  if(await locator.evaluate(el=>el===document.activeElement))return;
 }
 throw new Error('selected level button never received keyboard focus');
}
const outlineOf=el=>{const s=getComputedStyle(el);return {style:s.outlineStyle,width:s.outlineWidth,color:s.outlineColor,offset:s.outlineOffset};};
for(const [theme,label] of [['light','Aydınlık tema'],['dark','Karanlık tema']]){
 test(`${theme}: keyboard focus on the selected lesson level has a distinct focus ring`,async({page},info)=>{
  await freeLab(page);await page.getByRole('button',{name:label,exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  const selected=page.locator('.level-path>button.selected');await expect(selected).toHaveCount(1);
  const rest=await selected.evaluate(outlineOf);
  await tabTo(page,selected);
  await expect(selected).toBeFocused();
  expect(await selected.evaluate(el=>el.matches(':focus-visible'))).toBe(true);
  const focus=await selected.evaluate(outlineOf);
  const accent=await selected.evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(focus.style).toBe('solid');expect(focus.width).toBe('3px');expect(focus.offset).toBe('3px');
  expect(focus.color).toBe(accent);
  expect(focus).not.toEqual(rest);
  await selected.scrollIntoViewIfNeeded();
  await page.screenshot({path:`.hermes-artifacts/level-focus-${info.project.name}-${theme}-viewport.png`});
  await page.locator('.level-path').screenshot({path:`.hermes-artifacts/level-focus-${info.project.name}-${theme}.png`});
 });
}
test('existing skip link moves keyboard focus to the lesson target',async({page},info)=>{
 await freeLab(page);
 await page.keyboard.press('Tab');
 const skip=page.locator('.skip-link');await expect(skip).toBeFocused();
 await page.screenshot({path:`.hermes-artifacts/skip-link-${info.project.name}.png`});
 await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/#lesson$/);
 await expect(page.locator('#lesson')).toBeFocused();
 expect(await page.evaluate(()=>location.hash)).toBe('#lesson');
 await page.keyboard.press('Tab');
 expect(await page.evaluate(()=>{const t=document.getElementById('lesson');return !!t&&t.contains(document.activeElement)||document.activeElement===t;})).toBe(true);
});
