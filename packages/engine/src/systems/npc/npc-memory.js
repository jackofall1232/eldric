const TYPES = new Set(['promise', 'insult', 'gift', 'debt', 'betrayal', 'rescue', 'conversation']);
export class NpcMemory {
  constructor(limit = 24) { this.limit = limit; this.byNpc = new Map(); }
  remember(npcId, memory) { if (!TYPES.has(memory?.type) || typeof memory.value !== 'string') throw new TypeError('Unsupported NPC memory.'); const values = this.byNpc.get(npcId) ?? []; const entry = Object.freeze({ type: memory.type, value: memory.value.slice(0, 240), sentiment: Math.max(-3, Math.min(3, Math.round(memory.sentiment ?? 0))), at: memory.at ?? values.length }); values.push(entry); this.byNpc.set(npcId, values.slice(-this.limit)); return entry; }
  recall(npcId, type = null) { const values = this.byNpc.get(npcId) ?? []; return type ? values.filter((memory) => memory.type === type) : [...values]; }
  compact(npcId) { return this.recall(npcId).map((memory) => `${memory.type}:${memory.value}`); }
}
