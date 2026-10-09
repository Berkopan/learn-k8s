import test from 'node:test';
import assert from 'node:assert/strict';
import {levels, LEGACY_ID_TO_KEY} from '../src/curriculum.js';
import {
  freshProgress, completeLevel, xpTotal, isUnlocked, validateProgress, loadProgress,
  saveProgress, streak, moduleDone, lessonKey, reviewQueue, needsReview, PROGRESS_KEY, LEGACY_PROGRESS_KEY,
} from '../src/progress.js';

test('first completion grants XP once; later practice still counts as an active learning day', () => {
  let progress = freshProgress();
  assert.equal(isUnlocked(progress, 2), false);
  progress = completeLevel(progress, 1, true, '2026-01-01');
  assert.equal(isUnlocked(progress, 2), true);
  assert.equal(isUnlocked(progress, 3), false);
  assert.equal(xpTotal(progress), 40);
  progress = completeLevel(progress, 1, false, '2026-01-02', {challenge: true});
  assert.equal(xpTotal(progress), 40);
  assert.deepEqual(progress.days, ['2026-01-01', '2026-01-02']);
  assert.equal(progress.completed[lessonKey(1)].assisted, true, 'preserve the first attempt');
  assert.deepEqual(progress.practice[lessonKey(1)], {
    count: 2, lastPracticed: '2026-01-02', lastIndependentSuccess: '2026-01-02', challengeSuccesses: 1,
  });
});

test('free exploration is explicit and does not grant completion', () => {
  const progress = freshProgress(); progress.settings.free = true;
  assert.equal(isUnlocked(progress, 128), true);
  assert.equal(xpTotal(progress), 0);
  assert.equal(moduleDone(progress, 0), false);
  assert.equal(isUnlocked(progress, 'missing.lesson'), false);
});

test('v2 export/import preserves stable identities, notes and practice without recalculating XP from imports', () => {
  let progress = freshProgress();
  for (let id = 1; id <= 8; id++) progress = completeLevel(progress, id, false, '2026-01-01');
  progress.notes[lessonKey(1)] = 'Image ≠ container';
  progress.bookmarks = [lessonKey(1), lessonKey(3)];
  progress.active = lessonKey(8);
  const roundtrip = validateProgress({...JSON.parse(JSON.stringify(progress)), xp: 999999});
  assert.deepEqual(roundtrip, progress);
  assert.equal(moduleDone(roundtrip, 0), true);
});

test('original v1 ordinal records migrate to fixed lesson keys, including notes/bookmarks/current lesson', () => {
  const progress = validateProgress({
    version: 1, completed: {1: {date: '2026-01-01', assisted: true}, 84: {date: '2026-01-02', assisted: false}},
    notes: {1: 'First container', 84: 'Check the subject'}, bookmarks: [84, 1], active: 84,
    quiz: {10: true}, days: ['2026-01-01', '2026-01-02'], settings: {free: true},
  });
  assert.equal(progress.version, 2);
  assert.deepEqual(Object.keys(progress.completed), [LEGACY_ID_TO_KEY[1], LEGACY_ID_TO_KEY[84]]);
  assert.equal(progress.active, LEGACY_ID_TO_KEY[84]);
  assert.equal(progress.notes[LEGACY_ID_TO_KEY[84]], 'Check the subject');
  assert.deepEqual(progress.bookmarks, [LEGACY_ID_TO_KEY[84], LEGACY_ID_TO_KEY[1]]);
  assert.equal(progress.quiz[10], true);
  assert.equal(progress.practice[LEGACY_ID_TO_KEY[1]].lastIndependentSuccess, null);
});

test('storage prefers v2, migrates v1 when necessary, and preserves the old record as a fallback', () => {
  const data = new Map([[LEGACY_PROGRESS_KEY, JSON.stringify({version: 1, notes: {1: 'keep'}, active: 1})]]);
  const storage = {getItem: key => data.get(key), setItem: (key, value) => data.set(key, value)};
  const migrated = loadProgress(storage);
  assert.equal(migrated.notes[lessonKey(1)], 'keep');
  assert.equal(saveProgress(storage, migrated), true);
  assert.ok(data.has(LEGACY_PROGRESS_KEY));
  assert.equal(JSON.parse(data.get(PROGRESS_KEY)).version, 2);
  assert.deepEqual(loadProgress(storage), migrated);
});

test('untrusted records ignore unknown IDs/fields and bound notes, duplicates, settings and practice counts', () => {
  const progress = validateProgress({
    version: 1, active: 999, completed: {999: {date: '2026-01-01'}, 1: {date: 'bad'}},
    notes: {1: 'a'.repeat(9000), 999: 'no'}, bookmarks: [1, 1, 0, 999],
    settings: {speed: 100, free: true}, arbitrary: true,
  });
  assert.equal(progress.active, lessonKey(1));
  assert.equal(progress.notes[lessonKey(1)].length, 5000);
  assert.deepEqual(progress.bookmarks, [lessonKey(1)]);
  assert.equal(progress.arbitrary, undefined);
  assert.equal(progress.settings.speed, 1);
  assert.deepEqual(progress.completed, {});
  assert.throws(() => validateProgress({version: 99}));
  const current = validateProgress({version: 2, notes: {1: 'wrong ordinal', [lessonKey(1)]: 'correct key'}});
  assert.deepEqual(current.notes, {[lessonKey(1)]: 'correct key'});
});

test('storage failures preserve the usable in-memory record', () => {
  const storage = {getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); }};
  assert.deepEqual(loadProgress(storage), freshProgress());
  assert.equal(saveProgress(storage, freshProgress()), false);
  assert.equal(saveProgress(undefined, freshProgress()), false);
});

test('review queue prioritizes assisted completions, then stale independent practice', () => {
  let progress = freshProgress();
  progress = completeLevel(progress, 1, false, '2026-01-01');
  progress = completeLevel(progress, 2, true, '2026-01-08');
  progress = completeLevel(progress, 3, false, '2026-01-08');
  assert.deepEqual(reviewQueue(progress, {date: '2026-01-09'}).map(level => level.id), [2, 1]);
  progress = completeLevel(progress, 2, false, '2026-01-09');
  assert.equal(needsReview(progress, 2, '2026-01-09'), false);
  assert.equal(needsReview(progress, 4, '2026-01-09'), false);
  assert.equal(levels.find(level => level.key === progress.active).id, 1);
});

test('daily streak tolerates today not yet completed but not a missing yesterday', () => {
  const progress = freshProgress(); progress.days = ['2026-01-01', '2026-01-02', '2026-01-03'];
  assert.equal(streak(progress, '2026-01-03'), 3);
  assert.equal(streak(progress, '2026-01-04'), 3);
  assert.equal(streak(progress, '2026-01-05'), 0);
});
