import assert from 'node:assert/strict';
import test from 'node:test';
import { computeDisplayScale } from '../../../packages/game/src/boot/bootstrap.js';

test('canvas uses crisp integer scaling when possible and still fits narrow phones', () => {
  assert.equal(computeDisplayScale(900, 600, 384, 216), 2);
  assert.equal(computeDisplayScale(320, 180, 384, 216), 320 / 384);
  assert.equal(computeDisplayScale(120, 60, 384, 216), 60 / 216);
});
