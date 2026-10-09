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

for (const [seed, initialMode, initialPassword] of [[2, 'development', 'demo-only'], [1, 'production', 'wrong']]) {
  test(`configuration incident seed ${seed}: correcting objects cannot replace refreshing process environments`, () => {
    const level = createChallenge('configuration', seed);
    const learner = exercise(level);
    const request = level.steps[0].goal.goals[1].match.request;
    const app = request.service, namespace = request.namespace;
    const ns = ` -n ${namespace}`;
    learner.command(`kubectl create configmap ${app}-settings --from-literal=MODE=${initialMode}${ns}`);
    learner.command(`kubectl create secret generic ${app}-credentials --from-literal=PASSWORD=${initialPassword}${ns}`);
    learner.command(`kubectl patch configmap ${app}-settings -p '{"data":{"MODE":"production"}}'${ns}`);
    learner.command(`kubectl patch secret ${app}-credentials -p '{"data":{"PASSWORD":"ZGVtby1vbmx5"}}'${ns}`);
    learner.command(`kubectl exec ${request.source}${ns} -- wget -qO- http://${app}:80`);
    assert.equal(learner.session.done, 0, 'HTTP success and correct source objects do not prove process configuration');
    assert.ok(learner.session.feedback.some(item => item.code === 'runtime-env'));
    const pods = objects(learner.session.lab, 'Pod', namespace).filter(pod => pod._sim.owner === `Deployment/${app}`);
    assert.equal(pods.length, 2);
    assert.ok(pods.every(pod => pod._sim.environments.web.MODE === initialMode
      && pod._sim.environments.web.PASSWORD === initialPassword));

    learner.command(`kubectl rollout restart deployment/${app}${ns}`);
    assert.equal(learner.session.done, 0, 'the corrected state still needs a new client request');
    learner.command(`kubectl exec ${request.source}${ns} -- curl http://${app}:80`);
    assert.equal(learner.session.done, 1);
    assert.equal(evaluateTask(learner.session.lab, level.completionGoal).met, true);
  });
}

test('runtime environment evidence is pure, requires actual ready Pods, and belongs to one controller and namespace', () => {
  const level = createChallenge('configuration', 1);
  const learner = exercise(level);
  for (const command of level.steps[0].solutionCommands.slice(0, -1)) learner.command(command);
  const goal = level.completionGoal.goals.find(item => item.type === 'runtimeEnv');
  const solved = learner.session.lab;
  const before = structuredClone(solved);
  assert.equal(evaluateTask(solved, goal).met, true);
  assert.deepEqual(solved, before);
  const owned = state => objects(state, 'Pod', goal.namespace).filter(pod => pod._sim.owner === `${goal.kind}/${goal.name}`);

  const mixed = structuredClone(solved);
  owned(mixed)[1]._sim.environments.web.MODE = 'development';
  assert.equal(evaluateTask(mixed, goal).met, false, 'one correct replica does not cover a stale sibling');

  const wrongContainer = structuredClone(solved);
  owned(wrongContainer)[0].spec.containers[0].name = 'sidecar';
  assert.equal(evaluateTask(wrongContainer, goal).met, false, 'evidence must belong to the named application container');

  const noReady = structuredClone(solved);
  for (const pod of owned(noReady)) pod.status.ready = false;
  assert.equal(evaluateTask(noReady, goal).met, false, 'no ready instance cannot be a vacuous success');

  const unrelated = structuredClone(solved);
  const candidate = structuredClone(owned(unrelated)[0]);
  unrelated.objects = unrelated.objects.filter(item => item.kind !== 'Pod');
  unrelated.objects.push(
    {...structuredClone(candidate), metadata: {...candidate.metadata, namespace: 'default'}},
    {...structuredClone(candidate), metadata: {...candidate.metadata, name: 'other-pod'}, _sim: {...candidate._sim, owner: 'Deployment/other'}},
  );
  assert.equal(evaluateTask(unrelated, goal).met, false, 'another namespace or controller cannot supply the required application evidence');
});

test('Lab 56 cannot restart or verify an identically named Deployment in another namespace', () => {
  const learner = exercise(levels[55]);
  learner.command('kubectl apply -f settings.yaml');
  learner.command('kubectl create deployment web --image=nginx:1.27 -n staging');
  learner.command('kubectl rollout restart deployment/web -n staging');
  learner.command('kubectl rollout status deployment/web -n staging');
  assert.equal(learner.session.done, 1);
  assert.ok(objects(learner.session.lab, 'Pod', 'default').every(pod => pod._sim.environments.web.MODE === 'production'));
  learner.command('kubectl rollout restart deployment/web');
  assert.equal(learner.session.done, 2);
  learner.command('kubectl rollout status deployment/web -n staging');
  assert.equal(learner.session.done, 2);
  learner.command('kubectl rollout status deployment/web');
  assert.equal(learner.session.done, 3);
});

test('Lab 56 final verification checks consumed maintenance values after a later configuration regression', () => {
  const level = levels[55], learner = exercise(level);
  learner.command('kubectl apply -f settings.yaml');
  learner.command('kubectl rollout restart deployment/web');
  learner.command(`kubectl patch configmap settings -p '{"data":{"MODE":"production"}}'`);
  learner.command('kubectl rollout status deployment/web');
  assert.equal(learner.session.done, 2, 'correct process values do not excuse regressing the source configuration');
  learner.command('kubectl rollout restart deployment/web');
  learner.command('kubectl rollout status deployment/web');
  assert.equal(learner.session.done, 2);
  assert.ok(learner.session.feedback.some(item => item.code === 'runtime-env'));
  learner.command('kubectl apply -f settings.yaml');
  learner.command('kubectl rollout restart deployment/web');
  learner.command('kubectl rollout status deployment/web');
  assert.equal(learner.session.done, 3);
});

test('the guided missing-dependencies incident also requires the running values', () => {
  const learner = exercise(levels[122]);
  learner.command('kubectl create configmap settings --from-literal=MODE=development');
  learner.command('kubectl create secret generic credentials --from-literal=PASSWORD=wrong');
  learner.command(`kubectl patch configmap settings -p '{"data":{"MODE":"production"}}'`);
  learner.command(`kubectl patch secret credentials -p '{"data":{"PASSWORD":"ZGVtby1vbmx5"}}'`);
  learner.command('kubectl rollout status deployment/web');
  assert.equal(learner.session.done, 2);
  learner.command('kubectl rollout restart deployment/web');
  learner.command('kubectl rollout status deployment/web');
  assert.equal(learner.session.done, 3);
});

test('Pod inspection and DNS exec observations retain the requested namespace', () => {
  const inspect = exercise(levels[23]);
  inspect.command('kubectl run web --image=nginx:1.27 -n staging');
  inspect.command('kubectl describe pod web -n staging');
  assert.equal(inspect.session.done, 0);
  inspect.command('kubectl describe pod web');
  assert.equal(inspect.session.done, 1);

  const dns = exercise(levels[45]);
  dns.command('kubectl run client --image=busybox:1.37 -n staging');
  dns.command('kubectl exec client -n staging -- nslookup web.default');
  assert.equal(dns.session.done, 0, 'resolving the right Service from the wrong Pod is not the requested observation');
  dns.command('kubectl exec client -- nslookup web.default');
  assert.equal(dns.session.done, 1);
});

test('waiting for a Job in another namespace cannot verify the completed lesson Job', () => {
  const learner = exercise(levels[89]);
  learner.command('lab tick');
  assert.equal(learner.session.done, 1);
  learner.command('kubectl create job report --image=busybox:1.37 -n staging -- echo done');
  learner.command('lab tick');
  learner.command('kubectl wait --for=condition=Complete job/report -n staging');
  assert.equal(learner.session.done, 1);
  learner.command('kubectl wait --for=condition=Complete job/report');
  assert.equal(learner.session.done, 2);
});
