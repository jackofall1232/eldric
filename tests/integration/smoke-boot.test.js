import assert from 'node:assert/strict';
import test from 'node:test';
import { bootstrapGame } from '../../packages/game/src/boot/bootstrap.js';
import { resolveConfig } from '../../packages/game/src/boot/config.js';

test('boot config clamps unsafe dimensions', () => {
  const config = resolveConfig({ logicalWidth: 9999, logicalHeight: 1, pixelRatioCap: 99 });
  assert.equal(config.logicalWidth, 640);
  assert.equal(config.logicalHeight, 180);
  assert.equal(config.pixelRatioCap, 3);
});

test('bootstrap validates its host', () => {
  assert.throws(() => bootstrapGame(null), /valid mount element/);
});
