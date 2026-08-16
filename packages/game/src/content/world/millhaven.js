export const WORLD = Object.freeze({ width: 1280, height: 800 });

export const ZONES = Object.freeze([
  { id: 'millhaven', name: 'Millhaven', x: 60, y: 160, width: 390, height: 430 },
  { id: 'whisperwood', name: 'Whisperwood', x: 0, y: 0, width: 650, height: 190 },
  { id: 'blackwater-road', name: 'Blackwater Road', x: 450, y: 220, width: 430, height: 260 },
  { id: 'blackwater-bridge', name: 'Blackwater Bridge', x: 840, y: 160, width: 220, height: 400 },
  { id: 'sunken-ruin', name: 'The Sunken Ruin', x: 1040, y: 40, width: 220, height: 220 },
  { id: 'gloam-cave', name: 'Gloam Cave', x: 1040, y: 560, width: 220, height: 220 },
]);

export const OBSTACLES = Object.freeze([
  { x: 100, y: 210, width: 118, height: 82, kind: 'house', label: 'The Hearth & Thistle' },
  { x: 280, y: 195, width: 108, height: 92, kind: 'house', label: 'Apothecary' },
  { x: 92, y: 405, width: 120, height: 90, kind: 'house', label: 'Smithy' },
  { x: 290, y: 420, width: 105, height: 78, kind: 'house', label: 'Old Mill' },
  { x: 502, y: 303, width: 82, height: 52, kind: 'wagon', label: 'Abandoned Wagon' },
  { x: 1090, y: 90, width: 110, height: 92, kind: 'ruin', label: 'Broken King’s Watch' },
]);

export const INTERACTABLES = Object.freeze([
  { id: 'elara', type: 'npc', name: 'Elara Vale', x: 255, y: 330, color: '#9a5b62' },
  { id: 'rowan', type: 'npc', name: 'Warden Rowan', x: 410, y: 340, color: '#526a73' },
  { id: 'mara', type: 'npc', name: 'Mara Fen', x: 225, y: 515, color: '#6b5b81' },
  { id: 'campfire', type: 'campfire', name: 'Village Campfire', x: 258, y: 390 },
  { id: 'wagon', type: 'clue', name: 'Abandoned Wagon', x: 548, y: 365 },
  { id: 'tracks', type: 'clue', name: 'River Tracks', x: 785, y: 460 },
  { id: 'bridge', type: 'clue', name: 'Blackwater Bridge', x: 920, y: 350 },
  { id: 'statue', type: 'secret', name: 'Weathered Saint', x: 70, y: 82 },
  { id: 'ruin-key', type: 'chest', name: 'Ruined Reliquary', x: 1160, y: 210 },
  { id: 'cave-door', type: 'door', name: 'Sealed Gloam Gate', x: 1100, y: 610 },
]);

export const TREE_CLUMPS = Array.from({ length: 74 }, (_, index) => ({
  x: 24 + ((index * 83) % 1210),
  y: 22 + ((index * 47) % 145),
  size: 13 + (index % 4) * 3,
}));

export const ENEMY_SPAWNS = Object.freeze([
  { id: 'wolf-1', kind: 'wolf', x: 585, y: 250 },
  { id: 'wolf-2', kind: 'wolf', x: 645, y: 430 },
  { id: 'bandit-1', kind: 'bandit', x: 735, y: 300 },
  { id: 'skeleton-1', kind: 'skeleton', x: 1080, y: 240 },
  { id: 'thornhart', kind: 'miniboss', x: 1180, y: 145 },
  { id: 'blackwater-beast', kind: 'boss', x: 1160, y: 685 },
]);

export const DIALOGUE = Object.freeze({
  elara: [
    'My brother went to Blackwater Bridge three nights ago. Rowan calls it a beast. I heard someone singing beneath the stones.',
    'Follow the cart road east. If you find his blue scarf… bring the truth, not comfort.',
  ],
  rowan: [
    'Travelers vanish by the bridge. Claws on the wagons. Blood in the reeds. A beast is a beast.',
    'Bring me proof, Eldric. Millhaven cannot survive another frightened winter.',
  ],
  mara: [
    'The river remembers older bargains than Rowan does. Find the saint in the north wood; face where her stone eyes look.',
    'Not every monster chose its shape. Not every man wearing a badge chose mercy.',
  ],
});
