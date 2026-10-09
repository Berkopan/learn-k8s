import test from 'node:test';
import assert from 'node:assert/strict';
import {levels, levelsByKey, LEGACY_ID_TO_KEY, KEY_TO_LEGACY_ID} from '../src/curriculum.js';
import {localizedCurriculum, localizedGuide} from '../src/localize.js';

test('published numeric progress maps to immutable, explicit lesson keys', () => {
  assert.ok(Object.isFrozen(LEGACY_ID_TO_KEY));
  assert.ok(Object.isFrozen(KEY_TO_LEGACY_ID));
  assert.equal(Object.keys(LEGACY_ID_TO_KEY).length, 128);
  assert.equal(new Set(levels.map(level => level.key)).size, levels.length);
  for (const level of levels) {
    assert.equal(LEGACY_ID_TO_KEY[level.legacyId], level.key);
    assert.equal(levelsByKey[level.key], level);
    assert.match(level.key, /^[a-z][a-z0-9.-]+$/);
  }
  // Reordering a presentation list must not reinterpret a saved v1 ID.
  const reordered = [...levels].reverse();
  assert.notEqual(reordered[0].key, LEGACY_ID_TO_KEY[1]);
  assert.equal(LEGACY_ID_TO_KEY[1], 'containers.one-image-many-possibilities');
  assert.equal(LEGACY_ID_TO_KEY[128], 'incidents.final-bring-a-small-platform-online');
});

test('language changes preserve identity and guide lookup also accepts a stable key', () => {
  const english = localizedCurriculum('en').levels;
  for (const level of levels) {
    assert.equal(english[level.id - 1].key, level.key);
    assert.equal(localizedGuide(level.key, 'en').title, english[level.id - 1].title);
    assert.deepEqual(localizedGuide(level.key, 'tr'), localizedGuide(level.id, 'tr'));
  }
});
