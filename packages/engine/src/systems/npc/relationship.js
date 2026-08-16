const IMPACT = Object.freeze({ promise: 1, insult: -2, gift: 2, debt: -1, betrayal: -5, rescue: 5, conversation: 0 });
export function relationshipScore(memories, reputationScore = 0) { return Math.max(-100, Math.min(100, Math.round(memories.reduce((sum, memory) => sum + (IMPACT[memory.type] ?? 0) + (memory.sentiment ?? 0), reputationScore * 0.25)))); }
export function relationshipBand(score) { return score <= -10 ? 'hostile' : score < 0 ? 'wary' : score >= 12 ? 'trusted' : score >= 4 ? 'warm' : 'neutral'; }
