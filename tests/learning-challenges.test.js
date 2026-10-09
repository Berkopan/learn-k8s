import test from 'node:test';
import assert from 'node:assert/strict';
import {levels, levelsByKey} from '../src/curriculum.js';
import {createLab, run, objects, find} from '../src/engine.js';
import {advanceSession, evaluateTask, createChallenge, challengeKinds, predictionFor} from '../src/learning.js';

function exercise(level) {
  let session = {lab: createLab(level), done: 0};
  return {
    get session() { return session; },
    command(command) {
      const result = run(session.lab, command);
      session = {...session, ...advanceSession(level, session, result), lab: result.state};
      return result;
    },
  };
}

test('three independent incidents have repeatable seeds and identical semantics in both languages', () => {
  assert.equal(challengeKinds.length, 3);
  for (const descriptor of challengeKinds) {
    assert.ok(levelsByKey[descriptor.sourceKey]);
    const tr = createChallenge(descriptor.kind, 11, 'tr');
    const en = createChallenge(descriptor.kind, 11, 'en');
    assert.deepEqual(createLab(tr), createLab(en));
    assert.deepEqual(tr.steps[0].goal, en.steps[0].goal);
    assert.deepEqual(tr.steps[0].solutionCommands, en.steps[0].solutionCommands);
    assert.deepEqual(createLab(tr), createLab(createChallenge(descriptor.kind, 11)));
    assert.notDeepEqual(createLab(tr), createLab(createChallenge(descriptor.kind, 12)));
    assert.notEqual(tr.key, createChallenge(descriptor.kind, 12).key);
    assert.equal(createChallenge(descriptor.kind, 2147483648).challengeSeed, 1);
    assert.equal(tr.sourceKey, descriptor.sourceKey);
    assert.equal(tr.steps.length, 1);
    assert.equal(evaluateTask(createLab(tr), tr.completionGoal).met, false);
    const initialCopy = [en.title, ...Object.values(en.guide), en.steps[0].text].join(' ');
    assert.doesNotMatch(initialCopy, /bad-tag|\/broken|kubectl (?:patch|set)|app=legacy/);
    assert.doesNotMatch([...Object.values(en.guide), en.steps[0].hint, en.debrief].join(' '), /[ıİğĞşŞçÇöÖüÜ]/);
    // Callers can edit an instance without poisoning the next attempt.
    tr.seed[0].metadata.name = 'changed-by-caller';
    assert.notEqual(createChallenge(descriptor.kind, 11).seed[0].metadata.name, 'changed-by-caller');
  }
});

for (const {kind} of challengeKinds) {
  for (const seed of [0, 1, 8, 37]) {
    test(`${kind} incident seed ${seed}: optional solution restores the required outcome`, () => {
      const level = createChallenge(kind, seed, seed % 2 ? 'en' : 'tr');
      const learner = exercise(level);
      const commands = level.steps[0].solutionCommands;
      for (const [index, command] of commands.entries()) {
        const result = learner.command(command);
        assert.equal(result.error, false, `${command}\n${result.output}`);
        if (index < commands.length - 1) assert.equal(learner.session.done, 0, 'repair alone does not replace the final client observation');
      }
      assert.equal(learner.session.done, 1);
      assert.equal(learner.session.justCompleted, true);
      assert.equal(evaluateTask(learner.session.lab, level.completionGoal).met, true);
    });
  }
}

test('a successful source-less request or unrelated exec is not the requested client proof', () => {
  const level = createChallenge('traffic', 2);
  const learner = exercise(level), commands = level.steps[0].solutionCommands;
  for (const command of commands.slice(0, -1)) learner.command(command);
  const target = level.steps[0].goal.goals[1].match.request;
  assert.equal(learner.command(`lab request ${target.service}`).error, false);
  assert.equal(learner.session.done, 0);
  learner.command(`kubectl exec ${target.source} -- hostname`);
  assert.equal(learner.session.done, 0);
  learner.command(`kubectl exec ${target.source} -- curl http://${target.service}:80`);
  assert.equal(learner.session.done, 1, 'an equivalent HTTP client is accepted');
});

test('deleting configuration requirements does not count as restoring the application', () => {
  const level = createChallenge('configuration', 2);
  const learner = exercise(level);
  const target = level.steps[0].goal.goals[1].match.request;
  const spec = {spec: {template: {spec: {containers: [{name: 'web', image: 'nginx:1.27', ports: [{containerPort: 80}]}]}}}};
  const result = learner.command(`kubectl patch deployment ${target.service} --type=merge -p '${JSON.stringify(spec)}'`);
  assert.equal(result.error, false, result.output);
  assert.equal(learner.command(`kubectl exec ${target.source} -- curl http://${target.service}:80`).error, false);
  assert.equal(learner.session.done, 0);
  assert.ok(learner.session.feedback.some(item => item.code === 'resource-missing'));
});

test('the three optional predictions agree with the observed simulator consequences', () => {
  const checkpoints = levels.filter(level => predictionFor(level));
  assert.deepEqual(checkpoints.map(level => level.id), [37, 56, 66]);
  for (const level of checkpoints) {
    const tr = predictionFor(level, 'tr'), en = predictionFor(level.key, 'en');
    assert.equal(tr.key, en.key);
    assert.equal(tr.answer, en.answer);
    assert.equal(en.options.length, 3);
    assert.ok(en.answer >= 0 && en.answer < en.options.length);
    assert.doesNotMatch([en.question, ...en.options, en.explanation].join(' '), /[ıİğĞşŞçÇöÖüÜ]/);
  }
  assert.equal(predictionFor(createChallenge('traffic', 1)), null);

  const deletion = createLab(levels[36]);
  const oldIds = new Set(objects(deletion, 'Pod').map(pod => pod._sim.id));
  const replaced = run(deletion, levels[36].steps[0].command).state;
  assert.equal(objects(replaced, 'Pod').length, 2);
  assert.ok(objects(replaced, 'Pod').every(pod => !oldIds.has(pod._sim.id)));

  const configuration = createLab(levels[55]);
  const changed = run(configuration, levels[55].steps[0].command).state;
  assert.equal(find(changed, 'ConfigMap', 'settings').data.MODE, 'maintenance');
  assert.ok(objects(changed, 'Pod').every(pod => pod._sim.envSnapshot.MODE === 'production'));

  const readiness = createLab(levels[65]);
  assert.ok(objects(readiness, 'Pod').every(pod => pod.status.phase === 'Running' && !pod.status.ready));
  assert.ok(objects(readiness, 'EndpointSlice').every(slice => slice.endpoints.length === 0));
});
