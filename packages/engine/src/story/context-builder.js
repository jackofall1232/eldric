import { StoryBeat } from './beats.js';

const TRAITS = ['honor', 'mercy', 'greed', 'courage', 'loyalty', 'infamy', 'mystery'];

export function buildStoryContext({ beat, region = 'millhaven', recentActions = [], chronicle = [], reputation = {}, npcMemories = [] } = {}) {
  if (!Object.values(StoryBeat).includes(beat)) throw new RangeError('Unsupported story beat.');
  return {
    schema_version: 1, beat, region: safeId(region),
    recent_actions: recentActions.slice(-20).map((value) => safeText(value, 160)),
    chronicle: chronicle.slice(-30).map((value) => safeText(value, 160)),
    reputation: Object.fromEntries(TRAITS.map((trait) => [trait, clampInteger(reputation[trait] ?? 0, -100, 100)])),
    npc_memories: npcMemories.slice(-20).map((value) => safeText(value, 200)),
  };
}
function safeId(value) { const id = String(value).toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 64); return id || 'unknown'; }
function safeText(value, max) { return String(value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max); }
function clampInteger(value, min, max) { return Math.max(min, Math.min(max, Math.round(Number(value) || 0))); }
