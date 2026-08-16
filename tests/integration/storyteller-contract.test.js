import assert from 'node:assert/strict';
import test from 'node:test';
import { createNarrativeState } from '../../packages/engine/src/story/apply.js';
import { buildStoryContext } from '../../packages/engine/src/story/context-builder.js';
import { LocalStoryProvider } from '../../packages/engine/src/story/providers/local-provider.js';
import { StorySystem } from '../../packages/engine/src/story/story.js';
import { LOCAL_STORY_CORPUS } from '../../packages/game/src/content/story/local-corpus.js';

test('offline story beat validates and applies without network', async () => {
  const state = createNarrativeState(); const provider = new LocalStoryProvider({ corpus: LOCAL_STORY_CORPUS });
  const story = new StorySystem({ provider, state });
  const result = await story.request(buildStoryContext({ beat: 'REGION_ENTERED', region: 'millhaven' }));
  assert.equal(result.status, 'applied'); assert.ok(state.narration.length > 20);
});

test('slow provider never blocks the caller and duplicate beat is coalesced', async () => {
  let resolve; const provider = { generate: () => new Promise((done) => { resolve = done; }) }; const state = createNarrativeState(); const story = new StorySystem({ provider, state });
  const pending = story.request(buildStoryContext({ beat: 'CHAPTER_BEGIN' })); assert.equal(story.pending, true);
  const duplicate = await story.request(buildStoryContext({ beat: 'CHAPTER_BEGIN' })); assert.equal(duplicate.status, 'busy');
  resolve({ schema_version: 1, narration: 'The page turned.', npc_dialogue: [], quest_changes: [], world_changes: [], rumors: [], chronicle_entry: '', memory_updates: [] });
  assert.equal((await pending).status, 'applied');
});
