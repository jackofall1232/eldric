import { sanitizeStoryText } from './sanitizer.js';

export const STORY_SCHEMA_VERSION = 1;
export const MAX_STORY_BYTES = 32_768;
export const QUEST_OBJECTIVES = new Set(['GO_TO', 'TALK_TO', 'FIND', 'COLLECT', 'DELIVER', 'DEFEAT', 'PROTECT', 'EXPLORE', 'CHOOSE']);
const TOP_LEVEL = new Set(['schema_version', 'narration', 'npc_dialogue', 'quest_changes', 'world_changes', 'rumors', 'chronicle_entry', 'memory_updates']);
const QUEST_ACTIONS = new Set(['ADD', 'ADVANCE', 'COMPLETE', 'FAIL']);
const WORLD_ACTIONS = new Set(['SET_FLAG', 'DISCOVER_LOCATION', 'UNLOCK_DIALOGUE', 'ADD_RUMOR_SOURCE']);
const EMOTIONS = new Set(['neutral', 'warm', 'wary', 'angry', 'afraid', 'sorrowful', 'hopeful']);
const TRUTH = new Set(['true', 'exaggerated', 'false']);
const MEMORY_TYPES = new Set(['promise', 'insult', 'gift', 'debt', 'betrayal', 'rescue', 'conversation']);
const ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function validateStorytellerOutput(input, { maxBytes = MAX_STORY_BYTES } = {}) {
  const errors = [];
  let raw = input;
  if (typeof input === 'string') {
    if (byteLength(input) > maxBytes) return invalid('response_too_large');
    try { raw = JSON.parse(input); } catch { return invalid('malformed_json'); }
  } else if (byteLength(JSON.stringify(input ?? null)) > maxBytes) return invalid('response_too_large');
  if (!isRecord(raw)) return invalid('output_must_be_object');
  const unknown = Object.keys(raw).filter((key) => !TOP_LEVEL.has(key));
  if (unknown.length) errors.push(`unknown_fields:${unknown.join(',')}`);
  if (raw.schema_version !== STORY_SCHEMA_VERSION) errors.push('unsupported_schema_version');
  for (const key of TOP_LEVEL) if (!(key in raw)) errors.push(`missing_field:${key}`);
  if (errors.length) return { ok: false, value: null, errors };

  const value = {
    schema_version: STORY_SCHEMA_VERSION,
    narration: text(raw.narration, 2000, 'narration', errors),
    npc_dialogue: mapArray(raw.npc_dialogue, 8, 'npc_dialogue', errors, validateDialogue),
    quest_changes: mapArray(raw.quest_changes, 6, 'quest_changes', errors, validateQuest).filter(Boolean),
    world_changes: mapArray(raw.world_changes, 8, 'world_changes', errors, validateWorld).filter(Boolean),
    rumors: mapArray(raw.rumors, 8, 'rumors', errors, validateRumor),
    chronicle_entry: text(raw.chronicle_entry, 1200, 'chronicle_entry', errors),
    memory_updates: mapArray(raw.memory_updates, 12, 'memory_updates', errors, validateMemory),
  };
  return errors.length ? { ok: false, value: null, errors } : { ok: true, value, errors: [] };
}

function validateDialogue(item, index, errors) {
  if (!shape(item, ['npc_id', 'text', 'emotion'], `npc_dialogue.${index}`, errors)) return null;
  const npcId = id(item.npc_id, `npc_dialogue.${index}.npc_id`, errors);
  const dialogue = text(item.text, 800, `npc_dialogue.${index}.text`, errors);
  if (item.emotion !== undefined && !EMOTIONS.has(item.emotion)) errors.push(`invalid_emotion:${index}`);
  return { npc_id: npcId, text: dialogue, ...(item.emotion ? { emotion: item.emotion } : {}) };
}
function validateQuest(item, index, errors) {
  if (!isRecord(item) || !QUEST_ACTIONS.has(item.action)) return null;
  if (!shape(item, ['action', 'quest_id', 'objective', 'target_id', 'text'], `quest_changes.${index}`, errors)) return null;
  const result = { action: item.action, quest_id: id(item.quest_id, `quest_changes.${index}.quest_id`, errors) };
  if (item.objective !== undefined) { if (!QUEST_OBJECTIVES.has(item.objective)) return null; result.objective = item.objective; }
  if (item.target_id !== undefined) result.target_id = id(item.target_id, `quest_changes.${index}.target_id`, errors);
  if (item.text !== undefined) result.text = text(item.text, 500, `quest_changes.${index}.text`, errors);
  return result;
}
function validateWorld(item, index, errors) {
  if (!isRecord(item) || !WORLD_ACTIONS.has(item.action)) return null;
  if (!shape(item, ['action', 'target_id', 'value'], `world_changes.${index}`, errors)) return null;
  const result = { action: item.action, target_id: id(item.target_id, `world_changes.${index}.target_id`, errors) };
  if (item.value !== undefined) {
    if (typeof item.value === 'boolean') result.value = item.value;
    else result.value = text(item.value, 240, `world_changes.${index}.value`, errors);
  }
  return result;
}
function validateRumor(item, index, errors) {
  if (!shape(item, ['text', 'truth', 'source_id'], `rumors.${index}`, errors)) return null;
  if (!TRUTH.has(item.truth)) errors.push(`invalid_rumor_truth:${index}`);
  return { text: text(item.text, 400, `rumors.${index}.text`, errors), truth: item.truth,
    ...(item.source_id !== undefined ? { source_id: id(item.source_id, `rumors.${index}.source_id`, errors) } : {}) };
}
function validateMemory(item, index, errors) {
  if (!shape(item, ['npc_id', 'type', 'value', 'sentiment'], `memory_updates.${index}`, errors)) return null;
  if (!MEMORY_TYPES.has(item.type)) errors.push(`invalid_memory_type:${index}`);
  const result = { npc_id: id(item.npc_id, `memory_updates.${index}.npc_id`, errors), type: item.type,
    value: text(item.value, 240, `memory_updates.${index}.value`, errors) };
  if (item.sentiment !== undefined) {
    if (!Number.isInteger(item.sentiment) || item.sentiment < -3 || item.sentiment > 3) errors.push(`invalid_sentiment:${index}`);
    else result.sentiment = item.sentiment;
  }
  return result;
}
function mapArray(value, maximum, name, errors, mapper) {
  if (!Array.isArray(value)) { errors.push(`not_array:${name}`); return []; }
  if (value.length > maximum) { errors.push(`too_many_items:${name}`); return []; }
  return value.map((item, index) => mapper(item, index, errors)).filter(Boolean);
}
function shape(value, keys, name, errors) {
  if (!isRecord(value)) { errors.push(`not_object:${name}`); return false; }
  const unknown = Object.keys(value).filter((key) => !keys.includes(key));
  if (unknown.length) { errors.push(`unknown_fields:${name}:${unknown.join(',')}`); return false; }
  return true;
}
function id(value, name, errors) { if (typeof value !== 'string' || !ID.test(value)) { errors.push(`invalid_id:${name}`); return ''; } return value; }
function text(value, maximum, name, errors) {
  if (typeof value !== 'string' || value.length > maximum) { errors.push(`invalid_text:${name}`); return ''; }
  if (/<[^>]+>|(?:javascript|data|vbscript)\s*:|\bon\w+\s*=|```/i.test(value)) { errors.push(`dangerous_text:${name}`); return ''; }
  return sanitizeStoryText(value, maximum);
}
function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function byteLength(value) { return new TextEncoder().encode(value).byteLength; }
function invalid(error) { return { ok: false, value: null, errors: [error] }; }
