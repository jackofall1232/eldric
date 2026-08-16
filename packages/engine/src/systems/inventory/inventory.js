export class Inventory {
  constructor(capacity = 24) { this.capacity = capacity; this.entries = []; }
  add(item, quantity = 1) { const amount = Math.max(1, Math.floor(quantity)); const existing = item.stackable ? this.entries.find((entry) => entry.item.id === item.id && entry.quantity < item.maxStack) : null; if (existing) { const accepted = Math.min(amount, item.maxStack - existing.quantity); existing.quantity += accepted; return accepted; } if (this.entries.length >= this.capacity) return 0; const accepted = item.stackable ? Math.min(amount, item.maxStack) : 1; this.entries.push({ item, quantity: accepted }); return accepted; }
  remove(id, quantity = 1) { const index = this.entries.findIndex((entry) => entry.item.id === id); if (index < 0) return 0; const entry = this.entries[index]; const removed = Math.min(entry.quantity, Math.max(1, Math.floor(quantity))); entry.quantity -= removed; if (entry.quantity === 0) this.entries.splice(index, 1); return removed; }
  has(id, quantity = 1) { return (this.entries.find((entry) => entry.item.id === id)?.quantity ?? 0) >= quantity; }
  get(id) { return this.entries.find((entry) => entry.item.id === id) ?? null; }
  byType(type) { return this.entries.filter((entry) => entry.item.type === type); }
}
