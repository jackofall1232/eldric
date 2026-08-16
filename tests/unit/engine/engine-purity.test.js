import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Scene, SceneManager, StateMachine } from '../../../packages/engine/src/index.js';

test('scene manager updates and renders the visible stack', () => {
  const calls = [];
  const world = new Scene({ id: 'world' });
  world.pause = () => calls.push('pause');
  world.resume = () => calls.push('resume');
  world.update = () => calls.push('world:update');
  world.render = () => calls.push('world:render');
  const menu = new Scene({ id: 'menu', opaque: false, pausesBelow: true });
  menu.update = () => calls.push('menu:update');
  menu.render = () => calls.push('menu:render');

  const scenes = new SceneManager();
  scenes.push(world);
  scenes.push(menu);
  scenes.update(1 / 60);
  scenes.render({}, 0.5);
  scenes.pop();

  assert.deepEqual(calls, ['pause', 'menu:update', 'world:render', 'menu:render', 'resume']);
});

test('state machine runs deterministic enter, update, and exit hooks', () => {
  const calls = [];
  const machine = new StateMachine({
    idle: { enter: () => calls.push('idle:enter'), exit: () => calls.push('idle:exit') },
    walk: { enter: () => calls.push('walk:enter'), update: (_, delta) => calls.push(delta) },
  });
  machine.transition('idle');
  machine.transition('walk');
  machine.update(0.25);
  assert.deepEqual(calls, ['idle:enter', 'idle:exit', 'walk:enter', 0.25]);
});

test('engine core keeps browser globals inside declared platform seams', async () => {
  const engineRoot = fileURLToPath(new URL('../../../packages/engine/src', import.meta.url));
  const allowed = /(?:canvas2d-backend|keyboard|mouse|touch|gamepad|webaudio-backend|localstorage-backend|fetch-transport|web-platform)\.js$/;
  const offenders = [];
  for (const path of await walk(engineRoot)) {
    if (allowed.test(path)) continue;
    // Module specifier strings (e.g. re-exporting './transports/fetch-transport.js')
    // are file names, not browser-global usage — scan identifiers only.
    const source = (await readFile(path, 'utf8')).replace(/(from\s+|import\s*\(\s*)(['"])[^'"]*\2/g, '$1$2$2');
    if (/\b(window|document|localStorage|fetch)\b/.test(source)) {
      offenders.push(relative(engineRoot, path));
    }
  }
  assert.deepEqual(offenders, []);
});

async function walk(directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await walk(path));
    else if (entry.name.endsWith('.js')) results.push(path);
  }
  return results;
}
