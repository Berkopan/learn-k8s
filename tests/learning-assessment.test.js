import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from '../src/curriculum.js';
import {createLab, run} from '../src/engine.js';
import {advanceSession, evaluateTask, matchesLearningGoal} from '../src/learning.js';

function learner(id) {
  const level = levels[id - 1];
  let session = {lab: createLab(level), done: 0};
  return {
    level,
    get session() { return session; },
    replaceFiles(files) { session = {...session, lab: {...session.lab, files: {...session.lab.files, ...files}}}; },
    command(command) {
      const result = run(session.lab, command);
      session = {...session, ...advanceSession(level, session, result), lab: result.state};
      return result;
    },
  };
}

test('reader permission assessment rejects administrator and wrong-namespace observations', () => {
  const lab = learner(84);
  lab.command('kubectl auth can-i list pods');
  assert.equal(lab.session.done, 0);
  assert.equal(lab.session.feedback[0].code, 'observation-identity');
  lab.command('kubectl auth can-i list pods --as=system:serviceaccount:default:reader -n staging');
  assert.equal(lab.session.done, 0);
  lab.command('kubectl auth can-i list pods --as=system:serviceaccount:default:reader');
  assert.equal(lab.session.done, 1);
});

test('an unrelated exec cannot satisfy the client HTTP observation', () => {
  const lab = learner(116);
  lab.command('kubectl apply -f allow-client.yaml');
  lab.command('kubectl exec client -- hostname');
  assert.equal(lab.session.done, 1);
  assert.equal(lab.session.feedback[0].code, 'observation-request');
  lab.command('kubectl exec client -- curl http://web:80');
  assert.equal(lab.session.done, 2, 'equivalent curl and wget requests are both valid');
});

test('rollout observation from before the task cannot be reused after restart', () => {
  const lab = learner(56);
  lab.command('kubectl rollout status deployment/web');
  lab.command('kubectl apply -f settings.yaml');
  lab.command('kubectl rollout restart deployment/web');
  lab.command('ls');
  assert.equal(lab.session.done, 2);
  lab.command('kubectl rollout status deployment/web');
  assert.equal(lab.session.done, 3);
});

test('restoring then breaking a Service cannot produce a completed incident', () => {
  const lab = learner(122);
  lab.replaceFiles({'combined.yaml': [
    structuredClone(lab.session.lab.files['healthy.yaml'][0]),
    {apiVersion: 'v1', kind: 'Service', metadata: {name: 'web'}, spec: {selector: {app: 'web'}, ports: [{port: 80, targetPort: 80}]}},
  ]});
  lab.command('kubectl apply -f combined.yaml');
  lab.command('lab request web');
  lab.command(`kubectl patch service web --type=merge -p '{"spec":{"selector":{"app":"broken"}}}'`);
  assert.equal(lab.session.done, 2);
  assert.equal(lab.command('lab request web').error, true);
  assert.equal(lab.session.isComplete, false);
  const before = structuredClone(lab.session.lab);
  assert.equal(evaluateTask(lab.session.lab, lab.level.completionGoal).met, false);
  assert.deepEqual(lab.session.lab, before, 'final traffic checks must not add traces or mutate the lab');
  lab.command(`kubectl patch service web --type=merge -p '{"spec":{"selector":{"app":"web"}}}'`);
  assert.equal(lab.session.done, 2);
  lab.command('lab request web');
  assert.equal(lab.session.done, 3);
  assert.equal(lab.session.justCompleted, true);
});

test('a final observation cannot bypass the explicit final state', () => {
  const lab = learner(124);
  lab.command('kubectl get events');
  // This creates healthy Pods but does not implement the requested measured request.
  lab.command('kubectl set resources deployment/web --requests=cpu=100m,memory=64Mi');
  lab.command('kubectl get pods -o wide');
  assert.equal(lab.session.done, 2);
  assert.equal(lab.session.feedback[0].code, 'resource-state');
  lab.command('kubectl set resources deployment/web --requests=cpu=250m,memory=64Mi');
  assert.equal(lab.session.done, 2, 'the final observation must follow the correction');
  lab.command('kubectl get pods -o wide');
  assert.equal(lab.session.done, 3);
});

test('the intentional second apply counts both lesson actions but help grants no progress', () => {
  const lab = learner(32);
  lab.command('kubectl apply -f deployment.yaml');
  assert.equal(lab.session.done, 1);
  lab.command('help');
  lab.command('ls');
  assert.equal(lab.session.done, 1);
  lab.command('kubectl apply -f deployment.yaml');
  assert.equal(lab.session.done, 2);
});

test('assessment ignores order of named array entries and enforces deliberately empty policy rules', () => {
  assert.equal(matchesLearningGoal({env: [{name: 'TZ', value: 'UTC'}, {name: 'MODE', value: 'production'}]},
    {env: [{name: 'MODE', value: 'production'}]}), true);
  assert.equal(matchesLearningGoal({ingress: [{}]}, {ingress: []}), false);
  assert.equal(matchesLearningGoal({ingress: []}, {ingress: []}), true);
});

test('HTTP evidence includes service, port, namespace and source rather than a command string', () => {
  const goal = levels[115].steps[1].goal;
  const request = {service: 'web', namespace: 'default', port: 80, source: 'client', status: 200};
  const state = createLab(levels[115]);
  for (const changed of [{source: 'other'}, {namespace: 'staging'}, {port: 8080}, {service: 'other'}]) {
    assert.equal(evaluateTask(state, goal, {events: [{action: 'exec', request: {...request, ...changed}}]}).met, false);
  }
  assert.equal(evaluateTask(state, goal, {events: [{action: 'exec', request}]}).met, true);
});
