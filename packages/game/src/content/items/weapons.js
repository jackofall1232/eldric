import { ItemType, createItem } from '@eldric/engine';
export const IRON_SWORD = createItem({ id: 'iron_sword', type: ItemType.WEAPON, name: 'Millhaven Sword', description: 'A plain blade kept sharp by need.', slot: 'weapon', stats: { attack: 6 } });
export const OATHKEEPER = (event = 'blackwater_oath') => createItem({ id: 'oathkeeper', type: ItemType.WEAPON, name: 'River-forged Sword', slot: 'weapon', stats: { attack: 12 } }, { name: 'Oathkeeper', description: `Recovered beneath Blackwater Bridge after ${event.replaceAll('_', ' ')}.` });
