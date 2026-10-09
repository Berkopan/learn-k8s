import test from 'node:test';
import assert from 'node:assert/strict';
import {fileDraft, updateFileDraft, parseManifestDraft, pasteExceedsLimit} from '../src/workbench.js';

const pod = {apiVersion: 'v1', kind: 'Pod', metadata: {name: 'web'}, spec: {containers: [{name: 'web', image: 'nginx:1.27'}]}};

test('per-file drafts survive selecting another file and adding a manifest', () => {
  const files = {'first.yaml': [pod], 'second.yaml': [pod]};
  const draft = '# unfinished work\napiVersion: v1\nkind:';
  const first = updateFileDraft({}, 'first.yaml', draft);
  const second = updateFileDraft(first, 'second.yaml', '# a different draft');
  const expanded = {...files, 'third.yaml': [pod]};
  assert.deepEqual(fileDraft(expanded, second, 'first.yaml'), {text: draft, dirty: true});
  assert.equal(fileDraft(expanded, second, 'second.yaml').text, '# a different draft');
  assert.equal(fileDraft(expanded, second, 'third.yaml').dirty, false);
  assert.equal(first['second.yaml'], undefined, 'editing a second file does not mutate the first snapshot');
  assert.equal(files['first.yaml'][0].kind, 'Pod', 'draft text never changes an applied manifest');
});

test('saving preserves comments and formatting while producing parsed apply input', () => {
  const text = '# keep this explanation\napiVersion: v1\nkind: Pod\nmetadata:\n  name: web\nspec:\n  containers:\n    - name: web\n      image: nginx:1.27\n';
  const files = {'pod.yaml': parseManifestDraft(text)};
  const drafts = updateFileDraft({}, 'pod.yaml', text, false);
  assert.equal(fileDraft(files, drafts, 'pod.yaml').text, text);
  assert.equal(fileDraft(files, drafts, 'pod.yaml').dirty, false);
  assert.deepEqual(files['pod.yaml'], [pod]);
});

test('invalid and duplicate-key YAML cannot replace parsed manifests', () => {
  assert.throws(() => parseManifestDraft('kind: ['));
  assert.throws(() => parseManifestDraft('apiVersion: v1\nkind: Pod\nkind: Service\nmetadata:\n  name: web\n'), /unique/i);
  assert.throws(() => parseManifestDraft('apiVersion: v1\nkind: Pod\n'), /metadata.name/);
});

test('manifest and paste limits preserve existing work and permit replacing a selection', () => {
  const document = 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: web\n';
  assert.equal(parseManifestDraft(Array(100).fill(document).join('---\n')).length, 100);
  assert.throws(() => parseManifestDraft(Array(101).fill(document).join('---\n')), /100 YAML/);
  assert.throws(() => parseManifestDraft('#'.repeat(200001)), /200 KB/);
  const element = {value: 'a'.repeat(7998), selectionStart: 7998, selectionEnd: 7998};
  assert.equal(pasteExceedsLimit(element, 'abc', 8000), true);
  assert.equal(pasteExceedsLimit({...element, selectionStart: 0}, 'abc', 8000), false);
  assert.equal(pasteExceedsLimit(element, 'ab', 8000), false);
});
