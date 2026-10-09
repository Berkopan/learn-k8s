import {createLab} from './engine.js';
import {levelsByKey} from './curriculum.js';

export const SESSION_KEY = 'learn-k8s:session:v1';
export const MAX_SESSION_BYTES = 2_000_000;
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const clean = value => JSON.parse(JSON.stringify(value));
const length = value => new TextEncoder().encode(value).byteLength;
const boundedText = (value, maximum) => typeof value === 'string' && value.length <= maximum;
const safeName = value => boundedText(value, 200) && /^[a-zA-Z0-9._-]+\.ya?ml$/.test(value);

export function freshSession(level) {
  return {
    lab: createLab(level), entries: [], history: [], done: 0, assisted: false,
    drafts: {}, selectedFile: '', previousState: null, commandDraft: '',
    taskEvidence: {events: [], lessonEvents: []}, feedback: [],
    variant: level.challenge ? {kind: level.challengeKind, seed: level.challengeSeed} : null,
  };
}

function validLab(lab) {
  return record(lab) && boundedText(lab.namespace, 200) && boundedText(lab.context, 100)
    && Number.isFinite(lab.serial) && Number.isFinite(lab.ticks)
    && Array.isArray(lab.objects) && lab.objects.length <= 2000
    && lab.objects.every(object => record(object) && boundedText(object.kind, 100) && record(object.metadata) && boundedText(object.metadata.name, 200))
    && record(lab.files) && Object.keys(lab.files).length <= 25
    && Object.entries(lab.files).every(([name, documents]) => safeName(name) && Array.isArray(documents) && documents.length <= 100 && documents.every(record))
    && Array.isArray(lab.events) && lab.events.length <= 250 && lab.events.every(record)
    && Array.isArray(lab.trace) && lab.trace.length <= 500
    && record(lab.docker) && Array.isArray(lab.docker.images) && Array.isArray(lab.docker.containers)
    && Array.isArray(lab.releases);
}

/** Last active lab only. Invalid, incompatible or oversized records are ignored. */
export function loadSession(storage) {
  try {
    const text = storage?.getItem(SESSION_KEY);
    if (!text || length(text) > MAX_SESSION_BYTES) return null;
    const value = JSON.parse(text);
    if (!record(value) || value.version !== 1 || !Object.hasOwn(levelsByKey, value.lessonKey) || !record(value.session)) return null;
    const session = value.session;
    if (!validLab(session.lab) || !Array.isArray(session.entries) || session.entries.length > 180
      || !session.entries.every(entry => record(entry) && boundedText(entry.command, 4000) && boundedText(entry.output, 200000))
      || !Array.isArray(session.history) || session.history.length > 150 || !session.history.every(command => boundedText(command, 4000))
      || !Number.isInteger(session.done) || session.done < 0 || session.done > 30) return null;
    if (session.variant && (!record(session.variant) || !boundedText(session.variant.kind, 60) || !Number.isInteger(session.variant.seed) || session.variant.seed < 0 || session.variant.seed > 2147483647)) return null;
    const drafts = {};
    if (record(session.drafts)) for (const [name, draft] of Object.entries(session.drafts)) {
      if (Object.hasOwn(session.lab.files, name) && record(draft) && boundedText(draft.text, 200000)) drafts[name] = {text: draft.text, dirty: draft.dirty === true};
    }
    const evidence = record(session.taskEvidence) ? session.taskEvidence : {};
    return {
      version: 1, lessonKey: value.lessonKey,
      session: {
        lab: session.lab, entries: session.entries, history: session.history,
        done: session.done, assisted: session.assisted === true, drafts,
        selectedFile: Object.hasOwn(session.lab.files, session.selectedFile) ? session.selectedFile : '',
        previousState: record(session.previousState) && Array.isArray(session.previousState.objects)
          ? {objects: session.previousState.objects.slice(0, 2000), docker: session.previousState.docker} : null,
        commandDraft: boundedText(session.commandDraft, 4000) ? session.commandDraft : '',
        taskEvidence: {
          events: Array.isArray(evidence.events) ? evidence.events.filter(record).slice(-250) : [],
          lessonEvents: Array.isArray(evidence.lessonEvents) ? evidence.lessonEvents.filter(record).slice(-500) : [],
        },
        feedback: [], variant: session.variant || null,
      },
    };
  } catch { return null; }
}

export function restoreSession(saved, level) {
  if (!saved || saved.lessonKey !== (level.sourceKey || level.key) || saved.session.done > level.steps.length) return null;
  if (!!saved.session.variant !== !!level.challenge) return null;
  if (level.challenge && (saved.session.variant.kind !== level.challengeKind || saved.session.variant.seed !== level.challengeSeed)) return null;
  return saved.session;
}

export function saveSession(storage, level, session, commandDraft = '') {
  try {
    if (!storage) return false;
    // Keep only the previous resources for the comparison; duplicate YAML/transcripts are unnecessary.
    const previousState = session.previousState ? {
      objects: session.previousState.objects, docker: session.previousState.docker,
    } : null;
    const payload = JSON.stringify({
      version: 1, lessonKey: level.sourceKey || level.key,
      session: {...session, previousState, feedback: [], commandDraft},
    });
    if (length(payload) > MAX_SESSION_BYTES) return false;
    storage.setItem(SESSION_KEY, payload);
    return true;
  } catch { return false; }
}
export function clearSession(storage) {
  try { storage?.removeItem(SESSION_KEY); } catch { /* In-memory reset remains available. */ }
}
export const snapshotBeforeCommand = state => clean({objects: state.objects, docker: state.docker});
