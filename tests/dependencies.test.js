import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from 'yaml';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));

// npm ci performs the authoritative dependency/semver validation before tests run.
// These checks guard the committed contract without pinning future upgrades to today's version.
test('committed lockfile matches the manifest and records package integrity', () => {
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.version, pkg.version);
  const root = lock.packages[''];
  assert.ok(root, 'Root package metadata must be present');
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'engines']) {
    assert.deepEqual(root[key] ?? {}, pkg[key] ?? {}, `${key} must match package.json`);
  }
  for (const name of Object.keys({...pkg.dependencies, ...pkg.devDependencies})) {
    assert.ok(lock.packages[`node_modules/${name}`], `${name} must have a locked entry`);
  }
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (!path) continue;
    assert.ok(entry.version, `${path} needs an exact version`);
    assert.equal(new URL(entry.resolved).protocol, 'https:', `${path} must use HTTPS`);
    assert.match(entry.integrity, /^sha(?:256|384|512)-[A-Za-z0-9+/=]+$/, `${path} needs integrity metadata`);
  }
});

const workflows = [
  ['.github/workflows/ci.yml', 'verify'],
  ['.github/workflows/pages.yml', 'build'],
];
const installCommand = 'npm ci --no-audit --no-fund';
const unchangedCommand = 'git diff --exit-code -- package.json package-lock.json';

for (const [path, job] of workflows) {
  test(`${path} uses a frozen install before testing and building`, () => {
    const workflow = parse(read(path));
    const steps = workflow.jobs[job].steps;
    const setup = steps.find(step => step.uses?.startsWith('actions/setup-node@'));
    assert.equal(String(setup?.with?.['node-version']), '22');
    const commands = steps.map(step => step.run?.trim());
    const installIndex = commands.indexOf(installCommand);
    const verifyIndex = commands.indexOf(unchangedCommand);
    assert.ok(installIndex >= 0, 'Install from package-lock.json with npm ci');
    assert.equal(commands.filter(command => command === installCommand).length, 1);
    assert.ok(verifyIndex > installIndex, 'Check that installation leaves tracked manifests unchanged');
    assert.ok(commands.indexOf('npm test') > verifyIndex, 'Run regression tests after dependency verification');
    assert.ok(commands.indexOf('npm run build') > commands.indexOf('npm test'), 'Build after tests');
    assert.ok(!commands.some(command => /\bnpm\s+(?:install|i|update)\b/.test(command ?? '')),
      'CI must not resolve a fresh dependency tree or fall back to npm install');
  });
}
