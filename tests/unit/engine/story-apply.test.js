import assert from 'node:assert/strict';
import test from 'node:test';
import { applyStorytellerOutput, createNarrativeState } from '../../../packages/engine/src/story/apply.js';

test('apply boundary mutates narrative state only', () => {
  const realtime = Object.freeze({ health: 50, position: Object.freeze({ x: 2, y: 3 }), stamina: 20 });
  const state = createNarrativeState();
  applyStorytellerOutput({ narration: 'Remembered.', npc_dialogue: [], quest_changes: [{ action: 'ADD', quest_id: 'river_oath', objective: 'CHOOSE' }], world_changes: [{ action: 'SET_FLAG', target_id: 'bridge_known', value: true }], rumors: [{ text: 'A knight came.', truth: 'exaggerated' }], chronicle_entry: 'The bridge was found.', memory_updates: [{ npc_id: 'elara', type: 'promise', value: 'Find Corven.' }] }, state);
  assert.equal(state.flags.get('bridge_known'), true); assert.equal(state.quests.get('river_oath').status, 'active');
  assert.deepEqual(realtime, { health: 50, position: { x: 2, y: 3 }, stamina: 20 });
});
