import {advanceSession,applyReferenceEdits} from '../src/learning.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {levels as original, modules} from '../src/curriculum.js';
import {glossary, quizzes} from '../src/reference.js';
import {commandClue, syntaxClue} from '../src/curriculum/core.js';
import {createLab, run, goalMet} from '../src/engine.js';
import {LANGUAGE_KEY, resolveLanguage, translate, getLanguage, setLanguage, subscribeLanguage, searchText} from '../src/i18n.js';
import {englishLessons, localizedCurriculum, localizedGuide, localizedReference} from '../src/localize.js';
import {runtimeText, terminalOutput} from '../src/runtime-text.js';

const english = localizedCurriculum('en');
const noTurkish = text => assert.doesNotMatch(text, /[ıİğĞşŞçÇöÖüÜ]/, text);

test('language negotiation honors saved choices and supported regional browser preferences', () => {
  assert.equal(LANGUAGE_KEY, 'learn-k8s:language:v1');
  assert.equal(resolveLanguage('tr', ['en-US']), 'tr');
  assert.equal(resolveLanguage('en', ['tr-TR']), 'en');
  assert.equal(resolveLanguage(null, ['tr-TR']), 'tr');
  assert.equal(resolveLanguage(null, ['de-DE', 'en-GB']), 'en');
  assert.equal(resolveLanguage('invalid', ['tr_TR']), 'tr');
  assert.equal(resolveLanguage(null, ['ja-JP']), 'en');
  assert.equal(resolveLanguage(null, []), 'en');
});
test('locale subscription changes once, rejects invalid values, and can unsubscribe', () => {
  setLanguage('tr', {persist:false});
  let calls = 0;
  const stop = subscribeLanguage(() => calls++);
  try {
    assert.equal(setLanguage('fr', {persist:false}), false);
    assert.equal(getLanguage(), 'tr');
    setLanguage('en', {persist:false});
    setLanguage('en', {persist:false});
    assert.equal(calls, 1);
    stop();
    setLanguage('tr', {persist:false});
    assert.equal(calls, 1);
  } finally { stop(); setLanguage('tr', {persist:false}); }
});
test('text interpolation is single-pass and search normalizes English/Turkish spelling', () => {
  const value = '<b>{1}</b> $& "Türkçe"';
  assert.equal(translate('Kaynak türü bulunamadı: {0}', [value], 'en'), `Unknown resource kind: ${value}`);
  assert.equal(translate('Unknown {0} {1}', [value], 'en'), `Unknown ${value} {1}`);
  assert.equal(translate('{0} seviye', [1], 'en'), '1 level');
  assert.equal(translate('{0} seviye', [2], 'en'), '2 levels');
  assert.equal(searchText('İSTENEN ŞİFRE ı'), 'istenen sifre i');
});
test('English catalogs exactly cover all lessons, modules, glossary entries and quizzes', () => {
  assert.deepEqual(Object.keys(englishLessons).map(Number).sort((a,b)=>a-b), original.map(l=>l.id));
  assert.equal(english.levels.length, 128);
  assert.equal(english.modules.length, modules.length);
  const reference = localizedReference('en');
  assert.equal(reference.glossary.length, glossary.length);
  assert.equal(reference.quizzes.length, quizzes.length);
  reference.glossary.forEach((entry, i) => {
    assert.ok(entry.definition.length > 40);
    assert.notEqual(entry.definition, glossary[i].definition);
    noTurkish(entry.definition);
  });
  reference.quizzes.forEach((entry, i) => {
    assert.equal(entry.id, quizzes[i].id);
    assert.equal(entry.answer, quizzes[i].answer);
    assert.equal(entry.options.length, quizzes[i].options.length);
    noTurkish([entry.question, ...entry.options, entry.explanation].join(' '));
  });
  assert.equal(localizedCurriculum('tr').levels, original);
  assert.match(reference.cheats[0][0], /Docker/);
  assert.match(localizedReference('tr').cheats[0][1], /docker inspect web/);
});

for (const source of original) {
  test(`English lab ${String(source.id).padStart(3,'0')}: complete copy and identical executable scenario`, () => {
    const level = english.levels[source.id-1];
    const guide = localizedGuide(source.id, 'en');
    for (const key of ['why','how','practice']) {
      assert.ok(guide[key]?.length > 180, `${source.id}.${key} must be substantive`);
      noTurkish(guide[key]);
    }
    assert.ok(guide.caution.length > 50);
    noTurkish(level.title);
    assert.notEqual(level.title, source.title);
    for (const key of ['id','module','xp','minutes','source']) assert.equal(level[key], source[key]);
    for (const key of ['seed','files','state']) assert.equal(level[key], source[key], `${key} must not be replaced`);
    assert.equal(level.steps.length, source.steps.length);
    let state = createLab(level), session = {done:0};
    level.steps.forEach((step, i) => {
      assert.equal(step.command, source.steps[i].command);
      assert.equal(step.goal, source.steps[i].goal);
      assert.ok(step.text.length > 10);
      noTurkish(step.text + ' ' + step.hint + ' ' + step.syntaxHint);
      assert.doesNotMatch(step.syntaxHint, /undefined/);
      const clue = commandClue(step.command);
      assert.notEqual(translate(clue, [], 'en'), clue, `Missing hint translation: ${clue}`);
      state = applyReferenceEdits(state, step);
      const result = run(state, step.command);
      assert.equal(result.error, false, `${step.command}: ${result.output}`);
      session = {...session,...advanceSession(level,session,result)};
      assert.equal(session.done, i + 1, `${step.command}: ${JSON.stringify(session.feedback)}`);
      state = result.state;
      noTurkish(terminalOutput({output:result.output,event:result.event,error:result.error}, 'en'));
      state.trace.forEach(event => noTurkish(runtimeText(event.text, 'en')));
    });
  });
}

test('command-specific syntax hints split words rather than producing undefined', () => {
  for (const verb of ['inspect','logs','stop','rm']) assert.equal(syntaxClue(`docker ${verb} web`), `docker ${verb} CONTAINER`);
  for (const verb of ['status','history','undo','restart']) assert.equal(syntaxClue(`kubectl rollout ${verb} deployment/web`), `kubectl rollout ${verb} TYPE/NAME`);
  assert.equal(syntaxClue('kubectl explain pod.spec.containers'), 'kubectl explain [ARGS]');
  assert.match(syntaxClue('docker ps -a'), /-a/);
});
test('raw files, JSON/YAML, environments, logs, names and history are not translated as interface text', () => {
  const raw = 'Kaynak türü bulunamadı: <x>{0}</x>\nManifest boş.\nTürkçe notum';
  for (const event of [undefined,{action:'cat'},{action:'exec'},{action:'docker inspect'},{action:'dry-run'},{action:'get',output:'yaml'},{action:'get',output:'json'},{action:'docker stop'},{action:'docker rm'},{action:'docker images'}]) {
    assert.equal(terminalOutput({output:raw,event}, 'en'), raw);
  }
  const configYaml = 'kind: ConfigMap\nEvents: Manifest boş.\ndata:\n  text: Türkçe\n';
  assert.equal(terminalOutput({output:configYaml,event:{action:'describe',kind:'ConfigMap'}}, 'en'), configYaml);
  const name = '{1} <custom> $&';
  assert.equal(runtimeText(`Container bulunamadı: ${name}`, 'en'), `Container not found: ${name}`);
  assert.equal(terminalOutput({output:'Server listening on port 80\nGET / 200',event:{action:'logs'}}, 'en'), 'Server listening on port 80\nGET / 200');
});
test('help history renders in either language without changing its canonical entry', () => {
  const result = run(createLab(original[0]), 'docker run --help');
  const entry = {output:result.output, event:result.event};
  const snapshot = JSON.stringify(entry);
  assert.match(terminalOutput(entry, 'en'), /Start a container/);
  assert.match(terminalOutput(entry, 'tr'), /container başlatır/);
  assert.equal(JSON.stringify(entry), snapshot);
});
