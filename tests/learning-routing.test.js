import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from '../src/curriculum.js';
import {createLab, run, objects} from '../src/engine.js';
import {advanceSession, createChallenge, evaluateTask} from '../src/learning.js';

function exercise(level) {
  let session = {lab: createLab(level), done: 0};
  return {
    get session() { return session; },
    command(command) {
      const result = run(session.lab, command);
      assert.equal(result.error, false, `${command}\n${result.output}`);
      session = {...session, ...advanceSession(level, session, result), lab: result.state};
      return result;
    },
  };
}

function repairedChallenge(kind, seed) {
  const level = createChallenge(kind, seed);
  const learner = exercise(level);
  for (const command of level.steps[0].solutionCommands.slice(0, -1)) learner.command(command);
  return {level, learner, request: level.steps[0].goal.goals[1].match.request};
}

for (const [kind, seed] of [['traffic', 2], ['release', 3], ['configuration', 4]]) {
  test(`${kind} incident: a request routed back to the client is not application recovery`, () => {
    const {learner, request} = repairedChallenge(kind, seed);
    const {service, source, namespace} = request, ns = ` -n ${namespace}`;
    learner.command(`kubectl patch service ${service} -p '{"spec":{"selector":{"app":"${source}"}}}'${ns}`);
    const wrong = learner.command(`kubectl exec ${source}${ns} -- wget -qO- http://${service}:80`);
    assert.match(wrong.output, new RegExp(`Pod: ${source}\\n`), 'the synthetic response really came from the client');
    assert.equal(learner.session.done, 0);
    assert.ok(learner.session.feedback.some(item => item.code === 'service-backends'));

    learner.command(`kubectl patch service ${service} -p '{"spec":{"selector":{"app":"${service}"}}}'${ns}`);
    assert.equal(learner.session.done, 0, 'repair does not replace a fresh client observation');
    learner.command(`kubectl exec ${source}${ns} -- curl http://${service}:80`);
    assert.equal(learner.session.done, 1);
  });
}

test('a valid alternate template label and Service selector can restore the intended application', () => {
  const {level, learner, request} = repairedChallenge('traffic', 7);
  const {service, source, namespace} = request, ns = ` -n ${namespace}`;
  learner.command(`kubectl patch deployment ${service} -p '{"spec":{"template":{"metadata":{"labels":{"component":"backend"}}}}}'${ns}`);
  learner.command(`kubectl patch service ${service} -p '{"spec":{"selector":{"app":null,"component":"backend"}}}'${ns}`);
  learner.command(`kubectl exec ${source}${ns} -- wget -qO- http://${service}:80`);
  assert.equal(learner.session.done, 1);
  assert.equal(evaluateTask(learner.session.lab, level.completionGoal).met, true);
});

test('backend evidence is pure and cannot be supplied by ready Pods in another namespace or an empty target set', () => {
  const {level, learner} = repairedChallenge('traffic', 1);
  const goal = level.completionGoal.goals.find(item => item.type === 'serviceBackends');
  const state = learner.session.lab, before = structuredClone(state);
  assert.equal(evaluateTask(state, goal).met, true);
  assert.deepEqual(state, before);

  const foreign = structuredClone(state);
  const targetPods = objects(foreign, 'Pod', goal.namespace).filter(pod => pod._sim.owner === `${goal.kind}/${goal.name}`);
  for (const pod of targetPods) pod.metadata.namespace = 'default';
  assert.equal(evaluateTask(foreign, goal).met, false, 'an identically named controller in another namespace cannot supply Service backends');

  const unready = structuredClone(state);
  for (const pod of objects(unready, 'Pod', goal.namespace)) pod.status.ready = false;
  assert.equal(evaluateTask(unready, goal).met, false, 'an empty ready backend set is not successful routing');
});

test('a guided traffic incident rejects a mixture of intended and unrelated ready backends', () => {
  const level = levels[121], learner = exercise(level);
  learner.command(level.steps[0].command);
  learner.command(level.steps[1].command);
  learner.command('kubectl run unrelated --image=nginx:1.27');
  learner.command('kubectl label pod unrelated app=web');
  learner.command('lab request web');
  assert.equal(learner.session.done, 2, 'one successful sample cannot hide an unrelated selected backend');
  assert.ok(learner.session.feedback.some(item => item.code === 'service-backends'));
  learner.command('kubectl delete pod unrelated');
  learner.command('lab request web');
  assert.equal(learner.session.done, 3);
});
