import assert from 'node:assert/strict';
import test from 'node:test';
import strings from '../../../packages/game/src/data/strings/en.json' with { type: 'json' };

test('canonical English title and opening line ship with the game', () => {
  assert.equal(strings.game_title, 'Eldric: The Living Chronicle');
  assert.equal(strings.opening_invitation, 'Gather close, and heed my tale.');
  assert.ok(strings.storyteller_pending.length > 10);
});
