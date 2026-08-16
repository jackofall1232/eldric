import assert from 'node:assert/strict';
import test from 'node:test';
import { DIALOGUE, ENEMY_SPAWNS, INTERACTABLES, OBSTACLES, RUNE_SEAL, WORLD, ZONES } from '../../../packages/game/src/content/world/millhaven.js';

test('Millhaven vertical slice contains every promised destination', () => {
  assert.deepEqual(ZONES.map((zone) => zone.id), [
    'millhaven', 'whisperwood', 'blackwater-road', 'blackwater-bridge', 'sunken-ruin', 'gloam-cave',
  ]);
  assert.ok(WORLD.width >= 1000 && WORLD.height >= 700);
  assert.ok(OBSTACLES.some((object) => object.kind === 'ruin'));
  assert.ok(INTERACTABLES.some((object) => object.type === 'secret'));
  assert.ok(INTERACTABLES.some((object) => object.type === 'campfire'));
  assert.equal(INTERACTABLES.filter((object) => object.type === 'building').length, 4);
  assert.equal(INTERACTABLES.filter((object) => object.type === 'rune').length, 3);
  assert.ok(INTERACTABLES.some((object) => object.type === 'hidden'));
  assert.ok(INTERACTABLES.some((object) => object.id === 'locked-cellar'));
  assert.ok(DIALOGUE['arguing-travelers'].length >= 2);
});

test('the river seal teaches exactly the order it accepts', () => {
  const stones = INTERACTABLES.filter((object) => object.type === 'rune');
  // Every stone the seal asks for must exist, and each must be asked for once:
  // an order naming a stone that is not in the world cannot be solved.
  assert.deepEqual([...RUNE_SEAL.order].sort(), stones.map((stone) => stone.rune).sort());
  assert.equal(new Set(RUNE_SEAL.order).size, RUNE_SEAL.order.length);
  // The hint is the player's only source for the order, so it has to name the
  // stones in the sequence the seal actually accepts.
  assert.deepEqual(
    RUNE_SEAL.hint.match(/crown|river|root/g),
    RUNE_SEAL.order.map((rune) => RUNE_SEAL.names[rune]),
  );
  // …and each of those words has to match the stone carrying that rune.
  for (const stone of stones) assert.match(stone.name.toLowerCase(), new RegExp(RUNE_SEAL.names[stone.rune]));
});

test('Millhaven ships distinct enemy encounters and both bosses', () => {
  const kinds = new Set(ENEMY_SPAWNS.map((enemy) => enemy.kind));
  for (const kind of ['wolf', 'bandit', 'skeleton', 'forest_creature', 'armored_knight', 'dungeon_creature', 'miniboss', 'boss']) assert.ok(kinds.has(kind));
});
