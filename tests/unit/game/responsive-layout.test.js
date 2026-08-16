import assert from 'node:assert/strict';
import test from 'node:test';
import { computeDisplayScale, computeRenderScale } from '../../../packages/game/src/boot/bootstrap.js';

test('canvas fills the host fractionally and still fits narrow phones', () => {
  assert.equal(computeDisplayScale(900, 600, 384, 216), 900 / 384);
  assert.equal(computeDisplayScale(320, 180, 384, 216), 320 / 384);
  assert.equal(computeDisplayScale(120, 60, 384, 216), 60 / 216);
});

test('render supersampling tracks display density inside safe bounds', () => {
  assert.equal(computeRenderScale(2, 1), 2);
  assert.equal(computeRenderScale(2, 2), 4);
  assert.equal(computeRenderScale(3, 2), 4, 'caps runaway supersampling');
  assert.equal(computeRenderScale(0.8, 1), 1, 'never renders below logical resolution');
  assert.equal(computeRenderScale(1.5, 0), 1.5, 'missing devicePixelRatio treated as 1');
});
