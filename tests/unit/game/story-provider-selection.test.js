import assert from 'node:assert/strict';
import test from 'node:test';
import { LocalStoryProvider, RemoteStoryProvider } from '../../../packages/engine/src/index.js';
import { createStoryProvider } from '../../../packages/game/src/story/create-provider.js';

test('the local provider is the default and the fallback for misconfigured remotes', () => {
  assert.ok(createStoryProvider() instanceof LocalStoryProvider);
  assert.ok(createStoryProvider({ storyProvider: 'local' }) instanceof LocalStoryProvider);
  assert.ok(createStoryProvider({ storyProvider: 'remote' }) instanceof LocalStoryProvider);
  assert.ok(createStoryProvider({ storyProvider: 'remote', storyEndpoint: '' }) instanceof LocalStoryProvider);
  assert.ok(createStoryProvider({ storyProvider: 'unknown', storyEndpoint: 'https://example.test/wp-json/lc/v1/story' }) instanceof LocalStoryProvider);
});

test('a configured remote provider targets the REST proxy with the page nonce', async () => {
  const provider = createStoryProvider({
    storyProvider: 'remote',
    storyEndpoint: 'https://example.test/wp-json/lc/v1/story',
    storyNonce: 'nonce-123',
  }, async () => { throw new Error('offline'); });
  assert.ok(provider instanceof RemoteStoryProvider);
  assert.equal(provider.endpoint, 'https://example.test/wp-json/lc/v1/story');
  assert.equal(provider.nonce, 'nonce-123');
  await assert.rejects(() => provider.generate({ beat: 'REGION_ENTERED' }));
});
