import test from 'node:test';
import assert from 'node:assert/strict';
import {createLab, run} from '../src/engine.js';
import {deployment, pod, service} from '../src/model.js';
import {stateChanges, resourceDiagnostics} from '../src/workbench.js';

test('a scale diff includes replica fields and created Pods but ignores teaching traces', () => {
  const before = createLab({seed: [deployment('web', 1)]});
  const result = run(before, 'kubectl scale deployment/web --replicas=3');
  assert.equal(result.error, false);
  const changes = stateChanges(before, result.state);
  assert.equal(changes.resources.filter(item => item.kind === 'Pod' && item.change === 'added').length, 2);
  const change = changes.resources.find(item => item.kind === 'Deployment');
  assert.ok(change.fields.some(field => field.path === 'spec.replicas' && field.before === 1 && field.after === 3));
  assert.ok(changes.resources.every(item => item.fields.every(field => !field.path.startsWith('_sim'))));
  const observed = run(result.state, 'kubectl get pods');
  assert.deepEqual(stateChanges(result.state, observed.state).resources, []);
  assert.deepEqual(stateChanges(result.state, observed.state).context, []);
});

test('Docker, removed resources and namespace changes are included without mutating snapshots', () => {
  const before = createLab();
  const pulled = run(before, 'docker pull nginx:1.27').state;
  assert.equal(stateChanges(before, pulled).resources.find(item => item.kind === 'DockerImage').change, 'added');
  const created = run(before, 'kubectl run disposable --image=nginx:1.27').state;
  const removed = run(created, 'kubectl delete pod disposable').state;
  assert.equal(stateChanges(created, removed).resources.find(item => item.kind === 'Pod').change, 'removed');
  const switched = run(before, 'kubectl config set-context --current --namespace=staging').state;
  assert.deepEqual(stateChanges(before, switched).context, [{path: 'namespace', before: 'default', after: 'staging'}]);
  assert.equal(before.namespace, 'default');
  assert.equal(stateChanges(null, before), null);
  const oldSnapshot = {objects: before.objects, docker: before.docker};
  assert.deepEqual(stateChanges(oldSnapshot, {...before, releases: [{name: 'existing', revisions: [1]}]}).resources, []);
  assert.deepEqual(stateChanges(oldSnapshot, switched).context, [], 'an absent snapshot field is unknown, not a fabricated change');
});

test('Pending diagnostics use actual scheduler blockers, not a guess from the status label', () => {
  const blocked = pod('north-only', {nodeSelector: {zone: 'north'}});
  const state = createLab({seed: [blocked]});
  const observed = state.objects.find(item => item.kind === 'Pod');
  assert.equal(observed.status.phase, 'Pending');
  const diagnostics = resourceDiagnostics(state, observed);
  assert.equal(diagnostics.type, 'scheduling');
  assert.equal(diagnostics.nodes.length, 2);
  assert.ok(diagnostics.nodes.every(node => !node.selectorMatches && !node.eligible && node.fitsResources));
  assert.equal(resourceDiagnostics(state, {...observed, spec: {...observed.spec, nodeName: 'worker-1'}}), null);
});

test('Service diagnostics distinguish selector membership, readiness, endpoints and named port declarations', () => {
  const ready = pod('ready', {containers: [{name: 'web', image: 'nginx:1.27', ports: [{name: 'http', containerPort: 8080}]}]}, {app: 'shop'});
  const notReady = pod('not-ready', {containers: [{name: 'web', image: 'nginx:1.27', readinessProbe: {httpGet: {path: '/broken', port: 80}}, ports: [{containerPort: 80}]}]}, {app: 'shop'});
  const otherNamespace = pod('elsewhere', {}, {app: 'shop'});
  otherNamespace.metadata.namespace = 'staging';
  const state = createLab({seed: [ready, notReady, otherNamespace, service('shop', {app: 'shop'}, 80, 'http')]});
  const target = state.objects.find(item => item.kind === 'Service');
  const diagnostics = resourceDiagnostics(state, target);
  assert.deepEqual(diagnostics.pods.map(item => [item.name, item.ready, item.endpoint]), [['ready', true, true], ['not-ready', false, false]]);
  assert.deepEqual(diagnostics.ports[0].declarations.map(item => [item.pod, item.known, item.matches]), [['ready', true, true], ['not-ready', true, false]]);
  assert.equal(resourceDiagnostics(state, {...target, spec: {...target.spec, selector: undefined}}).pods.length, 0);
});
