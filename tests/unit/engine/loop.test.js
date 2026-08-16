import assert from 'node:assert/strict';
import test from 'node:test';
import { createFixedStepLoop } from '../../../packages/engine/src/core/loop.js';
import { createFakeScheduler } from '../../helpers/fake-clock.js';

test('fixed loop runs deterministic updates and interpolated renders', () => {
  const scheduler = createFakeScheduler();
  const updates = [];
  const renders = [];
  const loop = createFixedStepLoop({
    scheduler,
    stepMs: 10,
    update: (delta) => updates.push(delta),
    render: (alpha) => renders.push(alpha),
  });

  loop.start();
  scheduler.frame(100);
  scheduler.frame(126);

  assert.deepEqual(updates, [0.01, 0.01]);
  assert.equal(renders.length, 2);
  assert.ok(Math.abs(renders[1] - 0.6) < 1e-9);
});

test('fixed loop pauses without accumulating a catch-up burst', () => {
  let updates = 0;
  const loop = createFixedStepLoop({
    stepMs: 10,
    update: () => { updates += 1; },
    render: () => {},
  });

  loop.tick(0);
  loop.pause();
  loop.tick(1000);
  loop.resume();
  loop.tick(2000);
  loop.tick(2011);
  assert.equal(updates, 1);
});

test('fixed loop caps catch-up work after a long frame', () => {
  let updates = 0;
  const loop = createFixedStepLoop({
    stepMs: 10,
    maxFrameMs: 1000,
    maxSteps: 3,
    update: () => { updates += 1; },
    render: () => {},
  });
  loop.tick(0);
  loop.tick(1000);
  assert.equal(updates, 3);
});
