import assert from 'node:assert/strict';
import test from 'node:test';
import { ENEMY_SPAWNS, INTERACTABLES, OBSTACLES, WORLD, ZONES } from '../../../packages/game/src/content/world/millhaven.js';

test('Millhaven vertical slice contains every promised destination', () => {
  assert.deepEqual(ZONES.map((zone) => zone.id), [
    'millhaven', 'whisperwood', 'blackwater-road', 'blackwater-bridge', 'sunken-ruin', 'gloam-cave',
  ]);
  assert.ok(WORLD.width >= 1000 && WORLD.height >= 700);
  assert.ok(OBSTACLES.some((object) => object.kind === 'ruin'));
  assert.ok(INTERACTABLES.some((object) => object.type === 'secret'));
  assert.ok(INTERACTABLES.some((object) => object.type === 'campfire'));
});

test('Millhaven ships distinct enemy encounters and both bosses', () => {
  const kinds = new Set(ENEMY_SPAWNS.map((enemy) => enemy.kind));
  for (const kind of ['wolf', 'bandit', 'skeleton', 'forest_creature', 'armored_knight', 'dungeon_creature', 'miniboss', 'boss']) assert.ok(kinds.has(kind));
});
