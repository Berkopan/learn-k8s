import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from '../src/curriculum.js';
import {createLab, run} from '../src/engine.js';
import {advanceSession, applyReferenceEdits, evaluateTask} from '../src/learning.js';

test('the three YAML exercises require an explicit source edit before the reference command', () => {
  const edited = levels.filter(level => level.steps.some(step => step.referenceFiles));
  assert.deepEqual(edited.map(level => level.id), [27, 30, 67]);
  for (const level of edited) {
    const initial = createLab(level);
    const step = level.steps[0];
    const before = structuredClone(initial);
    const unchanged = run(initial, step.command);
    assert.equal(advanceSession(level, {done: 0}, unchanged).done, 0, `lab ${level.id} must not accept its unrepaired file`);
    const repaired = applyReferenceEdits(initial, step);
    assert.deepEqual(initial, before, 'reference edits must not mutate the initial scenario');
    const applied = run(repaired, step.command);
    assert.equal(applied.error, false, applied.output);
    assert.equal(advanceSession(level, {done: 0}, applied).done, 1);
  }
});

test('scaling only the live object leaves an actionable saved-file failure', () => {
  const level = levels[29], initial = createLab(level);
  const scaled = run(initial, 'kubectl scale deployment/web --replicas=3');
  const assessment = advanceSession(level, {done: 0}, scaled);
  assert.equal(assessment.done, 0);
  assert.equal(assessment.feedback[0].code, 'file-state');
  assert.ok(assessment.feedback[0].values.includes('deployment.yaml'));
  const savedOnly = applyReferenceEdits(initial, level.steps[0]);
  assert.equal(evaluateTask(savedOnly, level.steps[0].goal).met, false, 'saving alone must not change the live cluster');
  const savedAndScaled = applyReferenceEdits(scaled.state, level.steps[0]);
  assert.equal(evaluateTask(savedAndScaled, level.steps[0].goal).met, true, 'equivalent final states are accepted without exact command matching');
});

test('a malformed or wrong-kind saved definition cannot satisfy a YAML goal', () => {
  const level = levels[29], initial = createLab(level);
  const scaled = run(initial, 'kubectl scale deployment/web --replicas=3').state;
  for (const file of ['kind: [', [{apiVersion:'v1',kind:'Pod',metadata:{name:'web'},spec:{replicas:3}}]]) {
    const state = {...scaled, files: {...scaled.files, 'deployment.yaml': file}};
    assert.equal(evaluateTask(state, level.steps[0].goal).met, false);
  }
});
