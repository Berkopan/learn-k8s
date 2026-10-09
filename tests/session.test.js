import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from '../src/curriculum.js';
import {run} from '../src/engine.js';
import {advanceSession} from '../src/learning.js';
import {freshSession, saveSession, loadSession, restoreSession, clearSession, SESSION_KEY, MAX_SESSION_BYTES, snapshotBeforeCommand} from '../src/session.js';

const memory = () => {
  const values = new Map();
  return {getItem:key=>values.get(key)||null, setItem:(key,value)=>values.set(key,value), removeItem:key=>values.delete(key)};
};

test('every authored lab can be persisted and resumed under its immutable key', () => {
  const storage = memory();
  for (const level of levels) {
    const session = freshSession(level);
    assert.equal(saveSession(storage, level, session), true, level.key);
    assert.deepEqual(restoreSession(loadSession(storage), level), session, level.key);
  }
});

test('reload restores resources, current evidence, history, command and unsaved YAML drafts together', () => {
  const storage = memory(), level = levels[25];
  let session = freshSession(level);
  const result = run(session.lab, level.steps[0].command);
  session = {...session, ...advanceSession(level, session, result), lab:result.state,
    entries:[{command:level.steps[0].command, output:result.output}], history:[level.steps[0].command],
    selectedFile:'pod.yaml', drafts:{'pod.yaml':{text:'kind: Deployment\n# unfinished edit',dirty:true}},
    previousState:snapshotBeforeCommand(session.lab), assisted:true};
  assert.equal(saveSession(storage, level, session, 'kubectl get '), true);
  const resumed = restoreSession(loadSession(storage), level);
  assert.equal(resumed.done, 1);
  assert.equal(resumed.commandDraft, 'kubectl get ');
  assert.deepEqual(resumed.lab, JSON.parse(JSON.stringify(session.lab)));
  assert.equal(resumed.selectedFile, 'pod.yaml');
  assert.deepEqual(resumed.drafts, session.drafts);
  assert.deepEqual(resumed.taskEvidence, JSON.parse(JSON.stringify(session.taskEvidence)));
  assert.deepEqual(resumed.previousState, session.previousState);
  assert.equal(resumed.assisted, true);
  assert.equal(restoreSession(loadSession(storage), levels[26]), null);
  clearSession(storage);
  assert.equal(loadSession(storage), null);
});

test('corrupt, foreign or oversized records cannot replace a valid session', () => {
  const storage=memory(), level=levels[0], session=freshSession(level);
  saveSession(storage,level,session);
  const valid=storage.getItem(SESSION_KEY);
  for(const bad of ['{',JSON.stringify({version:10}),JSON.stringify({version:1,lessonKey:'unknown',session}), 'x'.repeat(MAX_SESSION_BYTES+1)]) {
    storage.setItem(SESSION_KEY,bad);
    assert.equal(loadSession(storage),null);
  }
  storage.setItem(SESSION_KEY,valid);
  assert.equal(saveSession(storage,level,{...session,entries:[{command:'x',output:'x'.repeat(MAX_SESSION_BYTES)}]}),false);
  assert.equal(storage.getItem(SESSION_KEY),valid);
  assert.equal(saveSession({setItem(){throw new Error('quota');}},level,session),false);
  assert.equal(loadSession({getItem(){throw new Error('denied');}}),null);
});

test('a variant cannot resume as its guided lesson or as a different seed', () => {
  const source=levels[40];
  const level={...source,key:`challenge:test:42`,sourceKey:source.key,challenge:true,challengeKind:'test',challengeSeed:42};
  const storage=memory(), session=freshSession(level);
  saveSession(storage,level,session);
  const saved=loadSession(storage);
  assert.deepEqual(restoreSession(saved,level),session);
  assert.equal(restoreSession(saved,source),null);
  assert.equal(restoreSession(saved,{...level,challengeSeed:43}),null);
});
