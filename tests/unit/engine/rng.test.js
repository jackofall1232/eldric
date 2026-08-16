import assert from 'node:assert/strict';
import test from 'node:test';
import { SeededRng } from '../../../packages/engine/src/core/rng.js';

test('seeded RNG produces repeatable sequences', () => {
  const first = new SeededRng('millhaven');
  const second = new SeededRng('millhaven');
  assert.deepEqual(
    Array.from({ length: 12 }, () => first.nextUint32()),
    Array.from({ length: 12 }, () => second.nextUint32()),
  );
});

test('seeded RNG can snapshot and restore state', () => {
  const rng = new SeededRng(42);
  rng.next();
  const snapshot = rng.snapshot();
  const expected = rng.pick(['wolf', 'bandit', 'skeleton']);
  rng.restore(snapshot);
  assert.equal(rng.pick(['wolf', 'bandit', 'skeleton']), expected);
});
