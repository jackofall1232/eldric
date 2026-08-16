export class Equipment {
  constructor(slots = ['weapon', 'armor', 'charm']) { this.slots = new Map(slots.map((slot) => [slot, null])); }
  equip(item) { if (!item.slot || !this.slots.has(item.slot)) throw new RangeError('Item cannot be equipped.'); const previous = this.slots.get(item.slot); this.slots.set(item.slot, item); return previous; }
  unequip(slot) { const item = this.slots.get(slot); this.slots.set(slot, null); return item; }
  stats() { const totals = {}; for (const item of this.slots.values()) for (const [key, value] of Object.entries(item?.stats ?? {})) totals[key] = (totals[key] ?? 0) + value; return totals; }
}
