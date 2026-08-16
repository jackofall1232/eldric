export class LootTable {
  constructor(entries = []) { this.entries = entries.filter((entry) => entry.weight > 0); this.total = this.entries.reduce((sum, entry) => sum + entry.weight, 0); }
  roll(rng) { if (!this.total) return null; let value = rng.next() * this.total; for (const entry of this.entries) { value -= entry.weight; if (value < 0) return entry.item; } return this.entries.at(-1).item; }
}
