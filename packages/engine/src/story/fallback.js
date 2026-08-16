export function createStoryFallback(narration = 'The old storyteller pauses, then continues from memory.') {
  return { schema_version: 1, narration, npc_dialogue: [], quest_changes: [], world_changes: [], rumors: [], chronicle_entry: '', memory_updates: [] };
}
