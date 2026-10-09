import {levels, LEGACY_ID_TO_KEY} from './curriculum.js';

export const PROGRESS_VERSION = 2;
export const PROGRESS_KEY = 'learn-k8s:progress:v2';
export const LEGACY_PROGRESS_KEY = 'learn-k8s:progress:v1';
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const knownKeys = new Set(levels.map(level => level.key));
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T12:00:00Z'));
export const lessonKey = value => knownKeys.has(value) ? value : levels.find(level => level.id === Number(value))?.key;
export const lessonId = value => levels.find(level => level.key === lessonKey(value))?.id;
export const today = () => new Date().toLocaleDateString('sv-SE');

export const freshProgress = () => ({
  version: PROGRESS_VERSION, completed: {}, bookmarks: [], notes: {}, quiz: {},
  practice: {}, active: levels[0].key, days: [],
  settings: {sound: false, free: false, reduced: false, speed: 1},
});

/** Migrate the original ordinal records once; all new records use immutable keys. */
export function validateProgress(input) {
  if (!record(input) || ![1, PROGRESS_VERSION].includes(input.version)) {
    throw new Error('Bu dosya desteklenen learn-k8s ilerleme biçiminde değil.');
  }
  const keyFor = input.version === 1
    ? value => LEGACY_ID_TO_KEY[Number(value)]
    : value => knownKeys.has(value) ? value : undefined;
  const progress = freshProgress();
  if (record(input.completed)) for (const [value, item] of Object.entries(input.completed)) {
    const key = keyFor(value), date = typeof item?.date === 'string' ? item.date.slice(0, 10) : '';
    if (key && record(item) && validDate(date)) progress.completed[key] = {date, assisted: !!item.assisted};
  }
  if (Array.isArray(input.bookmarks)) progress.bookmarks = [...new Set(input.bookmarks.map(keyFor).filter(Boolean))];
  if (record(input.notes)) for (const [value, note] of Object.entries(input.notes)) {
    const key = keyFor(value);
    if (key && typeof note === 'string') progress.notes[key] = note.slice(0, 5000);
  }
  if (record(input.quiz)) for (const [value, passed] of Object.entries(input.quiz)) {
    if (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) < 16 && passed === true) progress.quiz[value] = true;
  }
  progress.active = keyFor(input.active) || progress.active;
  if (Array.isArray(input.days)) progress.days = [...new Set(input.days.filter(validDate))].sort().slice(-366);
  if (record(input.settings)) {
    for (const key of ['sound', 'free', 'reduced']) progress.settings[key] = input.settings[key] === true;
    if ([0.5, 1, 2].includes(input.settings.speed)) progress.settings.speed = input.settings.speed;
  }
  if (input.version === PROGRESS_VERSION && record(input.practice)) {
    for (const [key, item] of Object.entries(input.practice)) {
      if (!knownKeys.has(key) || !record(item) || !validDate(item.lastPracticed)) continue;
      progress.practice[key] = {
        count: Math.min(100000, Math.max(1, Number.isInteger(item.count) ? item.count : 1)),
        lastPracticed: item.lastPracticed,
        lastIndependentSuccess: validDate(item.lastIndependentSuccess) ? item.lastIndependentSuccess : null,
        challengeSuccesses: Math.min(100000, Math.max(0, Number.isInteger(item.challengeSuccesses) ? item.challengeSuccesses : 0)),
      };
    }
  }
  for (const [key, item] of Object.entries(progress.completed)) {
    progress.practice[key] ||= {count: 1, lastPracticed: item.date, lastIndependentSuccess: item.assisted ? null : item.date, challengeSuccesses: 0};
  }
  return progress;
}

export function loadProgress(storage) {
  try {
    const current = storage?.getItem(PROGRESS_KEY);
    if (current) return validateProgress(JSON.parse(current));
    const legacy = storage?.getItem(LEGACY_PROGRESS_KEY);
    return legacy ? validateProgress(JSON.parse(legacy)) : freshProgress();
  } catch { return freshProgress(); }
}
export function saveProgress(storage, progress) {
  try { if (!storage) return false; storage.setItem(PROGRESS_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
}

/** XP comes only from the first completion; every successful practice gets a record. */
export function completeLevel(progress, value, assisted = false, date = today(), {challenge = false} = {}) {
  const key = lessonKey(value);
  if (!key || !validDate(date)) throw new Error('Geçersiz seviye veya çalışma tarihi.');
  const previous = progress.practice[key];
  return {
    ...progress,
    completed: progress.completed[key] ? progress.completed : {...progress.completed, [key]: {date, assisted}},
    practice: {...progress.practice, [key]: {
      count: (previous?.count || 0) + 1,
      lastPracticed: date,
      lastIndependentSuccess: assisted ? previous?.lastIndependentSuccess || null : date,
      challengeSuccesses: (previous?.challengeSuccesses || 0) + Number(challenge),
    }},
    days: [...new Set([...progress.days, date])].sort().slice(-366),
  };
}
export const xpTotal = progress => levels.reduce((sum, level) => sum + (progress.completed[level.key] ? level.xp : 0), 0);
export const isUnlocked = (progress, value) => {
  const id = lessonId(value), level = levels[id - 1];
  return !!level && (id === 1 || progress.settings.free || !!progress.completed[level.key] || !!progress.completed[levels[id - 2]?.key]);
};
export const moduleDone = (progress, id) => levels.filter(level => level.module === id).every(level => progress.completed[level.key]);
export const needsReview = (progress, value, date = today()) => {
  const key = lessonKey(value), practice = progress.practice[key];
  if (!progress.completed[key]) return false;
  return !practice?.lastIndependentSuccess || Date.parse(date) - Date.parse(practice.lastPracticed) >= 7 * 86400000;
};
export function reviewQueue(progress, {date = today(), limit = 3} = {}) {
  return levels.filter(level => needsReview(progress, level.key, date)).sort((a, b) => {
    const first = progress.practice[a.key], second = progress.practice[b.key];
    return Number(!!first?.lastIndependentSuccess) - Number(!!second?.lastIndependentSuccess)
      || String(first?.lastPracticed || '').localeCompare(String(second?.lastPracticed || '')) || a.id - b.id;
  }).slice(0, limit);
}
export function streak(progress, date = today()) {
  const days = new Set(progress.days), day = new Date(date + 'T12:00:00');
  if (!days.has(date)) day.setDate(day.getDate() - 1);
  let count = 0;
  while (days.has(day.toLocaleDateString('sv-SE'))) { count++; day.setDate(day.getDate() - 1); }
  return count;
}
