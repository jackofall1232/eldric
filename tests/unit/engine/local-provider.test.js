import assert from 'node:assert/strict';
import test from 'node:test';
import { LocalStoryProvider } from '../../../packages/engine/src/story/providers/local-provider.js';
import { validateStorytellerOutput } from '../../../packages/engine/src/story/validator.js';
import { LOCAL_STORY_CORPUS } from '../../../packages/game/src/content/story/local-corpus.js';

test('local provider needs no network or key and always returns contract output', async () => {
  const provider = new LocalStoryProvider({ corpus: LOCAL_STORY_CORPUS, seed: 'test' });
  const output = await provider.generate({ beat: 'CAMPFIRE_REST', region: 'millhaven', chronicle: ['bridge_found'] });
  assert.equal(validateStorytellerOutput(output).ok, true); assert.match(output.narration, /fire|voice/i);
});
