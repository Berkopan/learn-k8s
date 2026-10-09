import test from 'node:test';
import assert from 'node:assert/strict';
import {levels,modules} from '../src/curriculum.js';
import {createLab,run,objects} from '../src/engine.js';
import {advanceSession,applyReferenceEdits} from '../src/learning.js';
test('128 unique, substantial, sourced lessons across sixteen balanced modules',()=>{
 assert.equal(levels.length,128);assert.equal(modules.length,16);assert.equal(new Set(levels.map(l=>l.id)).size,128);assert.equal(new Set(levels.map(l=>l.title)).size,128);
 for(const m of modules)assert.equal(levels.filter(l=>l.module===m.id).length,8);
 for(const l of levels){assert.ok(l.concept.length>80,l.title);assert.ok(l.mechanism.length>75,l.title);assert.ok(l.caution.length>70,l.title);assert.ok(l.steps.length>=1);assert.match(l.source,/^https:\/\/(kubernetes.io|docs.docker.com|helm.sh)\//);}
});
for(const l of levels)test(`Lab ${l.id}: ${l.title}`,()=>{let state=createLab(l),session={done:0};assert.ok(state.objects.length>=6);for(const [index,step] of l.steps.entries()){state=applyReferenceEdits(state,step);const before=structuredClone(state);const result=run(state,step.command);assert.equal(result.error,false,`${index+1}. ${step.command}\n${result.output}`);assert.deepEqual(state,before,'run must not mutate its input');session={...session,...advanceSession(l,session,result)};state=result.state;assert.equal(session.done,index+1,`${index+1}: ${JSON.stringify(session.feedback)}`);}assert.equal(session.isComplete,true);});
test('every guided step has contextual direction and task-specific syntax help',()=>{
 const steps=levels.flatMap(l=>l.steps);
 assert.equal(steps.length,234);
 assert.ok(steps.every(s=>typeof s.hint==='string'&&s.hint.length>35));
 assert.ok(steps.every(s=>typeof s.syntaxHint==='string'&&s.syntaxHint.length>3));
 assert.ok(steps.every(s=>!s.hint.includes('Komut referansındaki kaynak türü, ad ve seçenekleri görevdeki değerlerle birleştir.')));
 assert.equal(new Set(steps.map(s=>s.hint)).size,steps.length);
 assert.ok(new Set(steps.map(s=>s.syntaxHint)).size>35,'syntax help should vary with the active command family');
});
test('labs are isolated; solved resources never leak into another scenario',()=>{const a=createLab(levels[16]);run(a,'kubectl run web --image=nginx:1.27');const b=createLab(levels[16]);assert.equal(objects(b,'Pod').length,0);});
