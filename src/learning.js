import {parseAllDocuments} from 'yaml';
import {copy} from './model.js';
import {find, objects} from './engine.js';
import {apiCan, traffic} from './simulator-core.js';
export {createChallenge, challengeKinds} from './curriculum/challenges.js';
export {predictionFor} from './curriculum/predictions.js';

const missing = (code, message, ...values) => ({code, message, values});

/** Partial objects, unordered required array members, and deliberately empty arrays. */
export function matchesLearningGoal(actual, expected) {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    if (!expected.length) return actual.length === 0;
    return expected.every(wanted => actual.some(item => matchesLearningGoal(item, wanted)));
  }
  if (expected === null || typeof expected !== 'object') return actual === expected;
  return !!actual && typeof actual === 'object'
    && Object.entries(expected).every(([key, value]) => matchesLearningGoal(actual[key], value));
}

function fileDocuments(state, filename) {
  const value = state.files?.[filename];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    return parseAllDocuments(value, {uniqueKeys: true, strict: true}).map(document => {
      if (document.errors.length) throw document.errors[0];
      return document.toJS({maxAliasCount: 50});
    });
  } catch {
    return [];
  }
}

/** No writes, command execution, or real network access; returns localizable evidence. */
export function evaluateTask(state, goal, {events = [], lessonEvents = events} = {}) {
  const unmet = [];
  const check = current => {
    if (!current) return true;
    if (current.type === 'all') return current.goals.map(check).every(Boolean);
    const ns = current.namespace || 'default';
    let met = false;
    let failure;
    switch (current.type) {
      case 'event': {
        // Ordinary observations must describe the latest successful command.
        // The explicit lesson scope is reserved for intentional repeated actions.
        const candidates = current.scope === 'lesson' ? lessonEvents
          : (current.times || 1) > 1 ? events : events.slice(-1);
        met = candidates.filter(event => matchesLearningGoal(event, current.match)).length >= (current.times || 1);
        failure = current.match.identity
          ? missing('observation-identity', '{0} kimliğiyle, {1} namespace’inde yeniden doğrula.', current.match.identity, current.match.namespace || ns)
          : current.match.request
            ? missing('observation-request', '{0}:{1} için bu adımda başarılı bir istek gözlemi gerekiyor.', current.match.request.service, current.match.request.port)
            : missing('observation', 'Bu adım için yeni bir gözlem gerekiyor: {0}.', current.match.action || 'request');
        break;
      }
      case 'resource': {
        const resource = find(state, current.kind, current.name, ns);
        met = !!resource && matchesLearningGoal(resource, current.match || {});
        failure = resource
          ? missing('resource-state', '{0}/{1}, {2} namespace’inde henüz istenen durumda değil.', current.kind, current.name, ns)
          : missing('resource-missing', '{0}/{1}, {2} namespace’inde bulunamadı.', current.kind, current.name, ns);
        break;
      }
      case 'runtimeEnv': {
        const workload = find(state, current.kind, current.name, ns);
        const readyPods = objects(state, 'Pod', ns).filter(pod => pod.status?.ready === true
          && pod._sim?.owner === `${current.kind}/${current.name}`);
        // Read the process snapshot for the named container, not the current
        // ConfigMap/Secret or another workload's environment. An empty set of
        // running application instances is not evidence of correct consumption.
        met = !!workload && readyPods.length > 0 && readyPods.every(pod =>
          (pod.spec.containers || []).some(container => container.name === current.container)
          && matchesLearningGoal(pod._sim?.environments?.[current.container], current.match || {}));
        failure = missing('runtime-env', '{0}/{1}, {2} namespace’inde hazır Pod’lara sahip olmalı; her {3} container’ının çalışan ortamında {4} değerleri hedefle eşleşmeli. Ayar değiştiyse yeni süreç başlat.',
          current.kind, current.name, ns, current.container, Object.keys(current.match || {}).join(', '));
        break;
      }
      case 'fileResource': {
        const resource = fileDocuments(state, current.file).find(item => item?.kind === current.kind
          && item.metadata?.name === current.name && (item.metadata?.namespace || 'default') === ns);
        met = !!resource && matchesLearningGoal(resource, current.match || {});
        failure = missing('file-state', '{0} dosyasını düzenleyip kaydet: {1}/{2} tanımı henüz hedefle eşleşmiyor.', current.file, current.kind, current.name);
        break;
      }
      case 'absent':
        met = !find(state, current.kind, current.name, ns);
        failure = missing('resource-present', '{0}/{1} hâlâ mevcut.', current.kind, current.name);
        break;
      case 'count': {
        const count = objects(state, current.kind, ns).filter(item => matchesLearningGoal(item, current.match || {})).length;
        met = count === current.count;
        failure = missing('resource-count', 'Eşleşen {0} sayısı {1}; hedef {2}.', current.kind, count, current.count);
        break;
      }
      case 'state':
        met = matchesLearningGoal(state, current.match);
        failure = missing('state', 'Laboratuvar durumu henüz bu adımın hedefiyle eşleşmiyor.');
        break;
      case 'dockerImage':
        met = state.docker.images.includes(current.image);
        failure = missing('image', '{0} image’ı yerel depoda bulunamadı.', current.image);
        break;
      case 'dockerContainer':
        met = state.docker.containers.some(item => matchesLearningGoal(item, current.match));
        failure = missing('container', 'Container henüz istenen ad, image ve çalışma durumunda değil.');
        break;
      case 'dockerAbsent':
        met = !state.docker.containers.some(item => item.name === current.name);
        failure = missing('container-present', '{0} container kaydı hâlâ mevcut.', current.name);
        break;
      case 'permission':
        met = apiCan(state, current.verb, current.resource, current.identity, ns) === current.allowed;
        failure = missing('permission', '{0} için {1} {2} yetkisi beklenen sınırda değil.', current.identity, current.verb, current.resource);
        break;
      case 'reachable': {
        try {
          // traffic appends a visual trace, so assess a clone instead of changing the lab.
          traffic(copy(state), `${current.service}.${ns}:${current.port || 80}`, current.sourceNamespace || ns, current.source);
          met = current.allowed !== false;
        } catch (error) {
          // A missing/broken service is not evidence that isolation works.
          met = current.allowed === false && /NetworkPolicy/.test(error.message);
        }
        failure = current.allowed === false
          ? missing('traffic-isolation', '{0} istemcisi için ağ izolasyonu doğrulanamadı.', current.source || '?')
          : missing('traffic', '{0}:{1} üzerinden beklenen hizmet yanıtı alınamıyor.', current.service, current.port || 80);
        break;
      }
      default:
        failure = missing('unknown-goal', 'Bu görevin doğrulama tanımı desteklenmiyor.');
    }
    if (!met) unmet.push(failure);
    return met;
  };
  const met = check(goal);
  return {met, unmet};
}

/** Progression patch only; the caller owns transcript, history, persistence and UI. */
export function advanceSession(level, session, result) {
  const done = session.done || 0;
  const previous = session.taskEvidence || {events: [], lessonEvents: []};
  const base = {done, taskEvidence: previous, feedback: [], isComplete: done >= level.steps.length, justCompleted: false};
  if (base.isComplete || result.error || !result.event || result.event.action === 'help') return base;
  const taskEvidence = {
    events: [...(previous.events || []), copy(result.event)].slice(-250),
    lessonEvents: [...(previous.lessonEvents || []), copy(result.event)].slice(-500),
  };
  const assessment = evaluateTask(result.state, level.steps[done].goal, taskEvidence);
  if (!assessment.met) return {...base, taskEvidence, feedback: assessment.unmet};
  const last = done + 1 === level.steps.length;
  const completion = last ? evaluateTask(result.state, level.completionGoal, taskEvidence) : {met: true, unmet: []};
  if (!completion.met) return {...base, taskEvidence, feedback: completion.unmet};
  return {done: done + 1, taskEvidence: {...taskEvidence, events: []}, feedback: [], isComplete: last, justCompleted: last};
}

/** Used explicitly by reference solvers/tests; never called on the learner's behalf. */
export function applyReferenceEdits(state, step) {
  if (!step.referenceFiles) return state;
  return {...state, files: {...state.files, ...copy(step.referenceFiles)}};
}
