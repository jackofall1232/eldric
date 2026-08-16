import assert from 'node:assert/strict';
import test from 'node:test';
import { wrapTextLines } from '../../../packages/engine/src/render/canvas2d-backend.js';

test('storybook UI text wraps without scaling an entire sentence into one line', () => {
  const context = { measureText: (value) => ({ width: value.length * 5 }) };
  assert.deepEqual(wrapTextLines(context, 'The river remembers every promise made beneath the bridge.', 90), [
    'The river', 'remembers every', 'promise made', 'beneath the', 'bridge.',
  ]);
  assert.equal(wrapTextLines(context, 'one two three four five six', 45, 2).length, 2);
});
