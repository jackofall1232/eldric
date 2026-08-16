import { REPUTATION_TRAITS } from './traits.js';
export class Reputation {
  constructor(initial = {}) { this.values = Object.fromEntries(REPUTATION_TRAITS.map((trait) => [trait, clamp(initial[trait] ?? 0)])); }
  adjust(changes) { for (const [trait, amount] of Object.entries(changes)) { if (!REPUTATION_TRAITS.includes(trait)) continue; this.values[trait] = clamp(this.values[trait] + Number(amount)); } return this.snapshot(); }
  interpret(weights = {}) { return REPUTATION_TRAITS.reduce((score, trait) => score + this.values[trait] * (Number(weights[trait]) || 0), 0); }
  snapshot() { return { ...this.values }; }
}
function clamp(value) { return Math.max(-100, Math.min(100, Math.round(Number(value) || 0))); }
