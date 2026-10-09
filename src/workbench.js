import {parseAllDocuments, stringify} from 'yaml';
import {aliases} from './simulator-core.js';

/** Editor drafts are separate from the parsed manifests used by kubectl apply. */
export function manifestText(file) {
  return typeof file === 'string' ? file : (file || []).map(document => stringify(document)).join('---\n');
}

export function fileDraft(files, drafts, name) {
  const draft = drafts?.[name];
  return draft && typeof draft.text === 'string'
    ? {text: draft.text, dirty: draft.dirty === true}
    : {text: name ? manifestText(files[name]) : '', dirty: false};
}

export function updateFileDraft(drafts, name, text, dirty = true) {
  return {...drafts, [name]: {text, dirty}};
}

export function parseManifestDraft(text) {
  if (text.length > 200000) throw new Error('Manifest en fazla 200 KB olabilir.');
  const documents = parseAllDocuments(text, {uniqueKeys: true, strict: true});
  if (!documents.length) throw new Error('Manifest boş.');
  return documents.map(document => {
    if (document.errors.length) throw new Error(document.errors[0].message);
    const value = document.toJS({maxAliasCount: 50});
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || !value.apiVersion || !value.kind || !value.metadata?.name) {
      throw new Error('Her belge apiVersion, kind ve metadata.name içermeli.');
    }
    return value;
  });
}

const resourceNames = {
  Pod: ['pods', 'pod', 'po'], Deployment: ['deployments', 'deployment', 'deploy'],
  Service: ['services', 'service', 'svc'], Node: ['nodes', 'node', 'no'],
  Namespace: ['namespaces', 'namespace', 'ns'], ReplicaSet: ['replicasets', 'replicaset', 'rs'],
  StatefulSet: ['statefulsets', 'statefulset', 'sts'], DaemonSet: ['daemonsets', 'daemonset', 'ds'],
  ConfigMap: ['configmaps', 'configmap', 'cm'], Secret: ['secrets', 'secret'],
  ServiceAccount: ['serviceaccounts', 'serviceaccount', 'sa'],
  PersistentVolumeClaim: ['persistentvolumeclaims', 'persistentvolumeclaim', 'pvc'],
  PersistentVolume: ['persistentvolumes', 'persistentvolume', 'pv'],
  StorageClass: ['storageclasses', 'storageclass', 'sc'], Job: ['jobs', 'job'],
  CronJob: ['cronjobs', 'cronjob', 'cj'], HorizontalPodAutoscaler: ['horizontalpodautoscaler', 'hpa'],
  Role: ['roles', 'role'], RoleBinding: ['rolebindings', 'rolebinding'],
  NetworkPolicy: ['networkpolicies', 'networkpolicy', 'netpol'],
  Ingress: ['ingresses', 'ingress', 'ing'], PodDisruptionBudget: ['poddisruptionbudgets', 'poddisruptionbudget', 'pdb'],
  ResourceQuota: ['resourcequotas', 'resourcequota', 'quota'], LimitRange: ['limitranges', 'limitrange'],
  EndpointSlice: ['endpointslices', 'endpointslice'], Event: ['events', 'event'],
};
const clusterKinds = new Set(['Node', 'Namespace', 'PersistentVolume', 'StorageClass', 'CustomResourceDefinition', 'ClusterRole', 'ClusterRoleBinding']);
const kindFor = word => aliases[word.toLowerCase()];
const valueFlags = new Set(['-n', '--namespace', '-f', '--filename', '-o', '--output', '-l', '--selector',
  '--field-selector', '--as', '--image', '--replicas', '--port', '--target-port', '--type', '--name',
  '--from-literal', '--from', '--env', '--requests', '--limits', '--cpu-percent', '--min', '--max',
  '--schedule', '--restart', '--verb', '--resource', '--role', '--serviceaccount', '--class', '--rule',
  '-p', '--patch', '--timeout', '--for', '--set', '--to-revision']);

// A partial input is not an invocation: unfinished quotes or flags must never
// execute, throw, or erase the user's already-written arguments.
function completionInput(input) {
  const tokens = [];
  let start = -1, quote = '', value = '';
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (!quote && /\s/.test(character)) {
      if (start >= 0) {tokens.push({value, start}); start = -1; value = '';}
      continue;
    }
    if (start < 0) start = index;
    if (character === quote) {quote = ''; continue;}
    if (!quote && (character === '"' || character === "'")) {quote = character; continue;}
    if (character === '\\' && quote !== "'" && index + 1 < input.length) value += input[++index];
    else value += character;
  }
  if (quote) return null;
  if (start >= 0) tokens.push({value, start});
  const active = start >= 0 ? tokens.pop() : {value: '', start: input.length};
  return {tokens: tokens.map(token => token.value), active: active.value, prefix: input.slice(0, active.start)};
}

/** Full command candidates; only the word being completed is replaced. */
export function commandCompletions(input, state, fallback = []) {
  if (!input.trim()) return [];
  const parsed = completionInput(input);
  if (!parsed) return [];
  const {tokens, active, prefix} = parsed;
  if (tokens.includes('--')) return [];
  const finish = values => [...new Set(values)].filter(value => value !== input);
  const words = (values, partial = active, lead = prefix, suffix = '') => finish(values
    .filter(value => String(value).startsWith(partial)).map(value => `${lead}${value}${suffix}`));
  const objects = state.objects || [];
  const namespaces = [...new Set([
    state.namespace || 'default',
    ...objects.filter(resource => resource.kind === 'Namespace').map(resource => resource.metadata.name),
    ...objects.map(resource => resource.metadata?.namespace).filter(Boolean),
  ])].sort();
  const files = Object.keys(state.files || {}).sort();
  if (['-n', '--namespace'].includes(tokens.at(-1))) return words(namespaces);
  if (active.startsWith('--namespace=')) return words(namespaces, active.slice(12), prefix + '--namespace=');
  if (active.startsWith('-n=')) return words(namespaces, active.slice(3), prefix + '-n=');
  if (['-f', '--filename'].includes(tokens.at(-1))) return words(files);
  if (active.startsWith('--filename=')) return words(files, active.slice(11), prefix + '--filename=');
  if (active.startsWith('-f=')) return words(files, active.slice(3), prefix + '-f=');
  if (['-o', '--output'].includes(tokens.at(-1))) return words(['yaml', 'json', 'wide']);
  if (active.startsWith('--output=')) return words(['yaml', 'json', 'wide'], active.slice(9), prefix + '--output=');
  if (tokens[0] === 'cat' && tokens.length === 1) return words(files);
  if (!tokens.length) return words(['kubectl', 'docker', 'helm', 'lab', 'help', 'ls', 'cat', 'clear', 'history']);
  if (tokens[0] === 'docker') return finish(fallback.filter(candidate => candidate.startsWith(input)));
  if (tokens[0] === 'helm') {
    if (tokens.length === 1) return words(['list', 'install', 'upgrade', 'history', 'rollback', 'uninstall'], active, prefix, ' ');
    if (tokens.length === 2 && ['upgrade', 'history', 'rollback', 'uninstall'].includes(tokens[1])) {
      return words((state.releases || []).map(release => release.name).sort());
    }
  }
  if (tokens[0] === 'lab' && tokens[1] === 'request' && tokens.length === 2) {
    return words(objects.filter(resource => resource.kind === 'Service' && resource.metadata.namespace === state.namespace)
      .map(resource => resource.metadata.name).sort());
  }
  if (tokens[0] !== 'kubectl') return finish(fallback.filter(candidate => candidate.startsWith(input)));

  let namespace = state.namespace || 'default', allNamespaces = false;
  const positionals = [];
  for (let index = 1; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === '--') break;
    if (token === '-A' || token === '--all-namespaces') {allNamespaces = true; continue;}
    if (token.startsWith('--namespace=')) {namespace = token.slice(12); continue;}
    if (token.startsWith('-n=')) {namespace = token.slice(3); continue;}
    if (valueFlags.has(token)) {
      if (token === '-n' || token === '--namespace') namespace = tokens[index + 1] || namespace;
      index++;
    } else if (!token.startsWith('-')) positionals.push(token);
  }
  const namesFor = kind => objects.filter(resource => resource.kind === kind
    && (clusterKinds.has(kind) || allNamespaces || (resource.metadata.namespace || 'default') === namespace))
    .map(resource => resource.metadata.name).sort();
  const verb = positionals[0];
  if (!verb) return words(['get', 'describe', 'apply', 'diff', 'create', 'run', 'delete', 'scale', 'expose', 'logs',
    'exec', 'set', 'rollout', 'label', 'annotate', 'patch', 'autoscale', 'top', 'auth', 'cordon', 'uncordon',
    'drain', 'taint', 'wait', 'config', 'explain', 'port-forward', 'api-resources', 'cluster-info', 'version'], active, prefix, ' ');
  if (active.startsWith('-')) return words(['-n ', '--namespace=', '-o ', '--output=', '-f ', '--filename=', '--help']);
  if (['cordon', 'uncordon', 'drain'].includes(verb) && positionals.length === 1) return words(namesFor('Node'));
  if (['logs', 'exec'].includes(verb) && positionals.length === 1) {
    if (active.includes('/')) {
      const [type, partial] = active.split('/');
      const kind = kindFor(type);
      return ['Pod', 'Deployment'].includes(kind) ? words(namesFor(kind), partial, `${prefix}${type}/`) : [];
    }
    return words(namesFor('Pod'));
  }
  if (verb === 'config') {
    if (positionals.length === 1) return words(['current-context', 'get-contexts', 'use-context', 'set-context'], active, prefix, ' ');
    if (positionals[1] === 'use-context' && positionals.length === 2) return words(['learning', 'staging']);
  }
  if (verb === 'create' && positionals.length === 1) {
    return words(['deployment', 'namespace', 'configmap', 'secret', 'serviceaccount', 'role', 'rolebinding', 'job', 'cronjob', 'ingress'], active, prefix, ' ');
  }

  let targetIndex = 1, kinds = Object.keys(resourceNames);
  if (verb === 'rollout' || verb === 'set') {
    if (positionals.length === 1) return words(verb === 'rollout'
      ? ['status', 'history', 'restart', 'undo'] : ['image', 'env', 'resources'], active, prefix, ' ');
    targetIndex = 2;
    kinds = verb === 'rollout' ? ['Deployment'] : ['Pod', 'Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet', 'Job'];
  } else if (!['get', 'describe', 'delete', 'scale', 'expose', 'label', 'annotate', 'patch', 'autoscale', 'top', 'taint', 'wait', 'port-forward'].includes(verb)) return [];
  if (verb === 'scale') kinds = ['Deployment', 'StatefulSet'];
  if (verb === 'expose') kinds = ['Deployment', 'Pod'];
  if (verb === 'autoscale') kinds = ['Deployment'];
  if (verb === 'top') kinds = ['Pod', 'Node'];
  if (verb === 'taint') kinds = ['Node'];
  if (verb === 'port-forward') kinds = ['Service'];
  if (positionals.length === targetIndex) {
    if (active.includes('/')) {
      const [type, partial] = active.split('/'), kind = kindFor(type);
      return kinds.includes(kind) ? words(namesFor(kind), partial, `${prefix}${type}/`) : [];
    }
    // Use aliases already supported by the simulator, including kinds whose
    // current inventory is empty. A type is not a fabricated resource name.
    return words(kinds.map(kind => resourceNames[kind][0]), active, prefix, ' ');
  }
  const target = positionals[targetIndex];
  if (positionals.length === targetIndex + 1 && !target.includes('/')) {
    const kind = kindFor(target);
    return kinds.includes(kind) ? words(namesFor(kind)) : [];
  }
  return [];
}
