export const ItemType = Object.freeze({ WEAPON: 'weapon', ARMOR: 'armor', CONSUMABLE: 'consumable', KEY: 'key', ARTIFACT: 'artifact', QUEST: 'quest' });
export function createItem(definition, history = null) {
  if (!definition?.id || !Object.values(ItemType).includes(definition.type)) throw new TypeError('Invalid item definition.');
  return Object.freeze({ id: definition.id, type: definition.type, name: history?.name ?? definition.name, description: history?.description ?? definition.description ?? '', stackable: definition.stackable ?? definition.type === ItemType.CONSUMABLE, maxStack: definition.maxStack ?? 9, slot: definition.slot ?? null, stats: Object.freeze({ ...(definition.stats ?? {}) }), history: history ? Object.freeze({ ...history }) : null });
}
