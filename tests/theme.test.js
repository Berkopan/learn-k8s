import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {THEME_KEY,normalizeTheme,resolveTheme,readTheme,writeTheme} from '../src/theme.js';

test('appearance accepts only explicit light and dark choices',()=>{
 for(const value of [null,undefined,'','garbage',{},'LIGHT','system'])assert.equal(normalizeTheme(value),null);
 assert.equal(normalizeTheme('light'),'light');assert.equal(normalizeTheme('dark'),'dark');
});
test('missing preference follows the OS without overriding explicit palettes',()=>{
 assert.equal(resolveTheme(null,true),'dark');assert.equal(resolveTheme(null,false),'light');
 assert.equal(resolveTheme('system',true),'dark');assert.equal(resolveTheme('system',false),'light');
 assert.equal(resolveTheme('light',true),'light');assert.equal(resolveTheme('dark',false),'dark');
});
test('appearance storage never writes into the learning progress record',()=>{
 const map=new Map([['learn-k8s:progress:v1','untouched']]);const storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 assert.equal(readTheme(storage),null);assert.equal(writeTheme(storage,'light'),true);assert.equal(readTheme(storage),'light');
 assert.equal(writeTheme(storage,'system'),false);
 assert.equal(map.get('learn-k8s:progress:v1'),'untouched');assert.equal(map.get(THEME_KEY),'light');
});
test('denied or missing storage cannot prevent rendering',()=>{
 const storage={getItem(){throw Error('denied');},setItem(){throw Error('quota');}};
 assert.equal(readTheme(storage),null);assert.equal(writeTheme(storage,'light'),false);
 assert.equal(readTheme(undefined),null);assert.equal(writeTheme(undefined,'light'),false);
});
test('prepaint script agrees with runtime resolution for every preference',()=>{
 const source=readFileSync(new URL('../public/theme-init.js',import.meta.url),'utf8');
 for(const preference of ['dark','light','system',null,'invalid'])for(const dark of [false,true]){
  const root={dataset:{},style:{}};runInNewContext(source,{document:{documentElement:root},localStorage:{getItem:()=>preference},window:{matchMedia:()=>({matches:dark})}});
  assert.equal(root.dataset.theme,resolveTheme(preference,dark));assert.equal(root.style.colorScheme,root.dataset.theme);
 }
});
