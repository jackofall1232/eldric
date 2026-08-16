export function createNarrativeState(initial = {}) {
  return {
    narration: '', dialogue: new Map(), quests: new Map(), flags: new Map(), discovered: new Set(),
    unlockedDialogue: new Set(), rumorSources: new Set(), rumors: [], chronicle: [], memories: new Map(),
    ...initial,
  };
}

export function applyStorytellerOutput(output, state) {
  state.narration = output.narration;
  for (const line of output.npc_dialogue) state.dialogue.set(line.npc_id, line);
  for (const change of output.quest_changes) {
    const current = state.quests.get(change.quest_id) ?? {};
    state.quests.set(change.quest_id, { ...current, ...change, status: statusFor(change.action) });
  }
  for (const change of output.world_changes) {
    if (change.action === 'SET_FLAG') state.flags.set(change.target_id, change.value ?? true);
    else if (change.action === 'DISCOVER_LOCATION') state.discovered.add(change.target_id);
    else if (change.action === 'UNLOCK_DIALOGUE') state.unlockedDialogue.add(change.target_id);
    else if (change.action === 'ADD_RUMOR_SOURCE') state.rumorSources.add(change.target_id);
  }
  state.rumors.push(...output.rumors);
  if (output.chronicle_entry) state.chronicle.push(output.chronicle_entry);
  for (const memory of output.memory_updates) {
    const values = state.memories.get(memory.npc_id) ?? [];
    values.push(memory); state.memories.set(memory.npc_id, values.slice(-24));
  }
  return state;
}

function statusFor(action) { return action === 'ADD' ? 'active' : action === 'ADVANCE' ? 'active' : action === 'COMPLETE' ? 'completed' : 'failed'; }
