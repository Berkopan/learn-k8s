#!/usr/bin/env node
/**
 * Capture actual browser frames for the README demo, then encode them with FFmpeg.
 *
 * npm run build
 * npx playwright install chromium
 * node scripts/capture-demo.mjs
 *
 * Options: --dist /path/to/dist --output /path/to/demo.gif --keep-frames
 * Environment: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH overrides Playwright's browser;
 * FFMPEG_PATH overrides the ffmpeg executable available on PATH.
 */
import {preview} from 'vite';
import {chromium} from '@playwright/test';
import {access, copyFile, mkdir, mkdtemp, rename, rm, stat} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {parseArgs, promisify} from 'node:util';
import assert from 'node:assert/strict';

const repository = fileURLToPath(new URL('..', import.meta.url));
const {values} = parseArgs({options: {
  dist: {type: 'string', default: join(repository, 'dist')},
  output: {type: 'string', default: join(repository, 'docs/demo.gif')},
  'keep-frames': {type: 'boolean', default: false},
  help: {type: 'boolean', short: 'h'},
}});
if (values.help) {
  console.log('Usage: node scripts/capture-demo.mjs [--dist PATH] [--output PATH] [--keep-frames]\nRequires a production build, Playwright Chromium and FFmpeg.');
  process.exit(0);
}
const dist = resolve(values.dist), output = resolve(values.output);
const pendingOutput = `${output}.${process.pid}.tmp`;
await access(join(dist, 'index.html')).catch(() => {throw new Error(`Production build missing: ${dist}. Run npm run build first.`);});
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const execute = promisify(execFile);
await execute(ffmpeg, ['-version'], {timeout: 10000});
const framesDirectory = await mkdtemp(join(tmpdir(), 'learn-k8s-demo-'));
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const fps = 10;
let server, browser, recording = false, frameCapture;
let frames = 0;
try {
  server = await preview({configFile: false, root: repository, base: './', build: {outDir: dist},
    preview: {host: '127.0.0.1', port: 0}});
  const {port} = server.httpServer.address();
  browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({viewport: {width: 1280, height: 1000}, deviceScaleFactor: 1,
    locale: 'en-US', colorScheme: 'dark', reducedMotion: 'reduce'});
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('learn-k8s:language:v1', 'en');
    localStorage.setItem('learn-k8s:theme:v1', 'dark');
    // The public progress import format opens Lab 34 in a fresh free-exploration session.
    localStorage.setItem('learn-k8s:progress:v1', JSON.stringify({version: 1, active: 34,
      completed: {}, bookmarks: [], notes: {}, quiz: {}, days: [],
      settings: {free: true, reduced: true, speed: 2, sound: false}}));
  });
  await page.goto(`http://127.0.0.1:${port}/#level=34`);
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('button', {name: 'Collapse level header', exact: true}).click();
  await page.getByRole('tab', {name: 'Put it into practice', exact: true}).click();
  await page.locator('.workspace').evaluate(element => window.scrollTo({
    top: element.getBoundingClientRect().top + scrollY - 80, behavior: 'instant',
  }));
  assert.equal(await page.locator('.pod-card').count(), 2, 'Lab 34 must begin with two Pods');
  await page.mouse.move(20, 980);

  recording = true;
  const started = performance.now();
  frameCapture = (async () => {
    while (recording) {
      await page.screenshot({path: join(framesDirectory, `${String(frames).padStart(4, '0')}.png`)});
      frames++;
      await wait(Math.max(0, started + frames * 1000 / fps - performance.now()));
    }
  })();
  // The recording includes the real completion dialog and its normal dismiss action.
  await wait(1000);
  const input = page.getByRole('textbox', {name: 'Terminal command', exact: true});
  await input.click();
  await input.pressSequentially('kubectl scale deployment/web --replicas=3', {delay: 42});
  await wait(500);
  await input.press('Enter');
  await page.locator('.reward-dialog').waitFor();
  await wait(550);
  await page.getByRole('button', {name: 'Keep experimenting here', exact: true}).click();
  assert.equal(await page.locator('.pod-card').count(), 3, 'The command must produce three actual Pods');
  await page.locator('.workspace').evaluate(element => window.scrollTo({
    top: element.getBoundingClientRect().top + scrollY - 80, behavior: 'instant',
  }));
  await wait(1400);
  const changes = page.locator('.command-diff');
  await changes.locator(':scope > summary').click();
  await changes.locator('.resource-change > summary').filter({hasText: 'Deployment/web'}).click();
  const replicas = changes.getByRole('row').filter({hasText: 'spec.replicas'});
  assert.deepEqual(await replicas.getByRole('cell').allTextContents(), ['2', '3'], 'The diff must show the observed before/after values');
  await replicas.scrollIntoViewIfNeeded();
  await page.mouse.move(20, 980);
  await wait(3000);
  recording = false;
  await frameCapture;

  await mkdir(dirname(output), {recursive: true});
  const encoded = join(framesDirectory, 'demo.gif');
  await execute(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(fps),
    '-i', join(framesDirectory, '%04d.png'), '-filter_complex',
    '[0:v]split[frames][stats];[stats]palettegen=max_colors=256:stats_mode=full[palette];[frames][palette]paletteuse=dither=none:diff_mode=rectangle',
    '-loop', '0', encoded], {timeout: 60000, maxBuffer: 2_000_000});
  // Copy across filesystems first; replace the checked-in artifact only after encoding succeeds.
  await copyFile(encoded, pendingOutput);
  await rename(pendingOutput, output);
  console.log(JSON.stringify({output, width: 1280, height: 1000, frames, fps,
    seconds: frames / fps, bytes: (await stat(output)).size,
    ...(values['keep-frames'] ? {framesDirectory} : {})}, null, 2));
} finally {
  recording = false;
  await frameCapture?.catch(() => {});
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
  await rm(pendingOutput, {force: true});
  if (!values['keep-frames']) await rm(framesDirectory, {recursive: true, force: true});
}
