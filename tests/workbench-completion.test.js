import test from 'node:test';
import assert from 'node:assert/strict';
import {commandCompletions} from '../src/workbench.js';
import {aliases} from '../src/simulator-core.js';

const resource = (kind, name, namespace) => ({kind, metadata: {name, ...(namespace ? {namespace} : {})}});
const state = {namespace: 'default', files: {'app.yaml': [], 'other.yaml': []}, releases: [{name: 'shop'}], objects: [
  resource('Namespace', 'default'), resource('Namespace', 'payments'),
  resource('Deployment', 'api', 'default'), resource('Deployment', 'worker', 'payments'),
  resource('Pod', 'api-1', 'default'), resource('Pod', 'api-2', 'default'), resource('Pod', 'bill-1', 'payments'),
  resource('Node', 'worker-1'), resource('Node', 'worker-2'),
]};

test('completion uses current resource names and namespace, including short kind aliases', () => {
  assert.deepEqual(commandCompletions('kubectl describe deployment ', state), ['kubectl describe deployment api']);
  assert.deepEqual(commandCompletions('kubectl get po api-', state), ['kubectl get po api-1', 'kubectl get po api-2']);
  assert.deepEqual(commandCompletions('kubectl scale deployment/a', state), ['kubectl scale deployment/api']);
  assert.deepEqual(commandCompletions('kubectl rollout status deployment/', state), ['kubectl rollout status deployment/api']);
  assert.deepEqual(commandCompletions('kubectl logs api-', state), ['kubectl logs api-1', 'kubectl logs api-2']);
});

test('namespace flags work before or after the resource type and preserve the command prefix', () => {
  assert.deepEqual(commandCompletions('kubectl -n payments describe deployments ', state), ['kubectl -n payments describe deployments worker']);
  assert.deepEqual(commandCompletions('kubectl get deployments --namespace=payments ', state), ['kubectl get deployments --namespace=payments worker']);
  assert.deepEqual(commandCompletions('kubectl get pods -A ', state), ['kubectl get pods -A api-1', 'kubectl get pods -A api-2', 'kubectl get pods -A bill-1']);
  assert.deepEqual(commandCompletions('kubectl get nodes -n payments ', state), ['kubectl get nodes -n payments worker-1', 'kubectl get nodes -n payments worker-2']);
});

test('flags, manifests, release names and node commands complete against state', () => {
  assert.deepEqual(commandCompletions('kubectl get pods -n pay', state), ['kubectl get pods -n payments']);
  assert.deepEqual(commandCompletions('kubectl get pods --namespace=pay', state), ['kubectl get pods --namespace=payments']);
  assert.deepEqual(commandCompletions('kubectl apply -f app', state), ['kubectl apply -f app.yaml']);
  assert.deepEqual(commandCompletions('cat oth', state), ['cat other.yaml']);
  assert.deepEqual(commandCompletions('helm history sh', state), ['helm history shop']);
  assert.deepEqual(commandCompletions('kubectl drain worker-', state), ['kubectl drain worker-1', 'kubectl drain worker-2']);
});

test('missing resources and incomplete input do not invent names or prevent keyboard navigation', () => {
  assert.deepEqual(commandCompletions('', state), []);
  assert.deepEqual(commandCompletions('no-completion-for-this', state), []);
  assert.deepEqual(commandCompletions('kubectl describe deployment missing', state), []);
  assert.deepEqual(commandCompletions('kubectl -n unknown describe deployment ', state), []);
  assert.deepEqual(commandCompletions('kubectl get pods -n "pay', state), []);
  assert.deepEqual(commandCompletions('kubectl create deployment ', state), []);
});

test('Docker keeps contextual examples while Kubernetes replaces hard-coded deployment suggestions', () => {
  assert.deepEqual(commandCompletions('docker pul', state, ['docker pull nginx:1.27']), ['docker pull nginx:1.27']);
  assert.deepEqual(commandCompletions('kubectl scale deployment/', state, ['kubectl scale deployment/web --replicas=3']), ['kubectl scale deployment/api']);
});

test('suggested Kubernetes resource types are supported by the current simulator', () => {
  for (const command of commandCompletions('kubectl get ', state)) {
    assert.ok(aliases[command.trim().split(' ').at(-1)], command);
  }
  assert.deepEqual(commandCompletions('kubectl exec api-1 -- printenv -n ', state), []);
});
