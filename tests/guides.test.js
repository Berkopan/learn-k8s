import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from '../src/curriculum.js';
import {guides, guideGroups} from '../src/curriculum/guides/index.js';

const parts = ['why', 'how', 'practice'];

test('guide registry has exactly one entry per stable curriculum ID, without overwritten duplicates', () => {
  const entries = guideGroups.flatMap(Object.entries);
  assert.equal(levels.length, 128);
  assert.equal(entries.length, levels.length);
  assert.equal(new Set(entries.map(([id]) => id)).size, entries.length);
  assert.deepEqual(Object.keys(guides).map(Number).sort((a,b) => a-b), levels.map(level => level.id));
  for (const part of parts) {
    assert.equal(new Set(Object.values(guides).map(guide => guide[part])).size, levels.length,
      `${part} must be written for each lesson, not repeated module boilerplate`);
  }
});

for (const level of levels) {
  test(`guide ${String(level.id).padStart(3,'0')}: ${level.title}`, () => {
    const guide = guides[level.id];
    assert.deepEqual(Object.keys(guide).sort(), [...parts].sort());
    for (const part of parts) {
      const text = guide[part];
      assert.equal(typeof text, 'string');
      assert.ok(text.length >= 160, `${part} needs an explanation, not a short label`);
      assert.ok(text.length <= 1200, `${part} must stay readable in a focused lesson`);
      assert.equal((text.match(/`/g) || []).length % 2, 0, 'inline code markers must be paired');
      assert.doesNotMatch(text, /\b(?:TODO|TBD|lorem ipsum)\b|<\/?(?:script|iframe)\b/i);
      assert.notEqual(text, level.concept, 'do not merely redisplay the old summary');
      assert.notEqual(text, level.mechanism, 'practice must also be rewritten');
    }
    const words = parts.map(part => guide[part]).join(' ').trim().split(/\s+/).length;
    assert.ok(words >= 80 && words <= 330, `unexpected reading length: ${words}`);
    assert.ok(level.source.startsWith('https://'), 'retain a primary documentation link');
  });
}
