import test from 'node:test';
import assert from 'node:assert/strict';
import {createLab,run,suggestionWords} from '../src/engine.js';
import {levels} from '../src/curriculum.js';
import {dockerCommands,dockerCheats,contextDockerSuggestions,helpText} from '../src/command-help.js';

const resourceSnapshot = state => JSON.stringify({objects:state.objects,docker:state.docker,serial:state.serial,ticks:state.ticks,releases:state.releases,files:state.files});
const helpCommands = ['help','help docker','docker','docker help','docker --help', ...dockerCommands.flatMap(({name})=>[`help docker ${name}`,`docker help ${name}`,`docker ${name} --help`])];
for (const command of helpCommands) {
  test(`${command} shows help without executing or mutating a workload`, () => {
    const state = createLab(levels[1]);
    const before = resourceSnapshot(state);
    const result = run(state, command);
    assert.equal(result.error, false, result.output);
    assert.equal(result.event.action, 'help');
    assert.match(result.output, /docker/);
    assert.equal(resourceSnapshot(state), before);
    assert.equal(resourceSnapshot(result.state), before);
    assert.equal(result.state.events.some(event => event.action === 'docker run'), false);
  });
}
test('overview, command reference and completion all include the implemented Docker subset', () => {
  for (const locale of ['tr','en']) {
    const overview = helpText('', locale);
    const reference = dockerCheats(locale)[1];
    for (const command of dockerCommands) {
      assert.ok(overview.includes(command.usage));
      assert.ok(reference.includes(command.example));
      assert.ok(suggestionWords.includes(command.example));
    }
    const runHelp = helpText('docker run', locale);
    assert.match(runHelp, /--name NAME/);
    assert.doesNotMatch(runHelp, /kubectl create deployment/);
  }
});
test('docker ps -a and --all both include stopped containers', () => {
  const state = createLab(levels[7]);
  const stopped = run(state, 'docker stop web').state;
  const regular = run(stopped, 'docker ps');
  const short = run(stopped, 'docker ps -a');
  const long = run(stopped, 'docker ps --all');
  assert.equal(short.error, false);
  assert.equal(long.error, false);
  assert.equal(short.output, long.output);
  assert.match(short.output, /web.*Exited/);
  assert.doesNotMatch(regular.output, /web/);
});
test('unsupported Docker verbs, arguments and flags fail before any side effect', () => {
  for (const command of ['docker build .','docker compose up','docker pull','docker run nginx:1.27 extra','docker run --replicas=3 nginx:1.27','docker ps web','docker rm web another','docker run nginx:1.27 -- sh','docker stop --all web','docker help build','help docker build','help unknown']) {
    const state = createLab(levels[0]);
    const before = resourceSnapshot(state);
    const result = run(state, command);
    assert.equal(result.error, true, command);
    assert.equal(resourceSnapshot(result.state), before, command);
    assert.equal(resourceSnapshot(state), before, command);
  }
  assert.doesNotMatch(run(createLab(), 'docker build .').output, /Container bulunamadı/);
});
test('Docker Tab suggestions incorporate current container names and images', () => {
  let state = createLab();
  state = run(state, 'docker run --name custom-web nginx:1.27').state;
  const suggestions = contextDockerSuggestions(state);
  assert.ok(suggestions.includes('docker inspect custom-web'));
  assert.ok(suggestions.includes('docker logs custom-web'));
  assert.ok(suggestions.includes('docker stop custom-web'));
  assert.ok(suggestions.includes('docker rm custom-web'));
  assert.ok(suggestions.includes('docker run --help'));
});
test('help after the container-command separator is not interpreted as kubectl help', () => {
  const state = createLab(levels[45]);
  const result = run(state, 'kubectl exec client -- printenv --help');
  assert.equal(result.event?.action, 'exec');
  assert.notEqual(result.event?.action, 'help');
  assert.doesNotMatch(result.output, /COMMAND REFERENCE|KOMUT REHBERİ/);
});
