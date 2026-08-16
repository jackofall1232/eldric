import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ATTACKS, BossPhases, Chronicle, CombatSystem, Inventory, LocalStoryProvider,
  MemoryStorageBackend, NpcMemory, QuestSystem, Reputation, StorySystem,
  buildStoryContext, circleHitbox, createNarrativeState, createSave,
} from '../../packages/engine/src/index.js';
import { CHRONICLE_ENTRIES } from '../../packages/game/src/content/chronicle/entries.js';
import { DROWNED_OATH_PHASES } from '../../packages/game/src/content/enemies/boss-blackwater.js';
import { BROKEN_KING_MEDALLION } from '../../packages/game/src/content/items/artifacts.js';
import { RIVER_KEY } from '../../packages/game/src/content/items/keys.js';
import { IRON_SWORD, OATHKEEPER } from '../../packages/game/src/content/items/weapons.js';
import { BLACKWATER_QUEST } from '../../packages/game/src/content/quests/index.js';
import { LOCAL_STORY_CORPUS } from '../../packages/game/src/content/story/local-corpus.js';

test('the complete Blackwater adventure remains playable and persistent with no AI key', async () => {
  const questSystem = new QuestSystem();
  const quest = questSystem.add(BLACKWATER_QUEST);
  const inventory = new Inventory();
  const chronicle = new Chronicle();
  const reputation = new Reputation();
  const memories = new NpcMemory();
  const narrative = createNarrativeState();
  const story = new StorySystem({
    provider: new LocalStoryProvider({ corpus: LOCAL_STORY_CORPUS, seed: 'offline-playthrough' }),
    state: narrative,
  });

  inventory.add(IRON_SWORD);
  chronicle.append(CHRONICLE_ENTRIES.millhaven_arrived);
  memories.remember('elara', { type: 'promise', value: 'find Corven and return with the truth', sentiment: 2 });
  reputation.adjust({ honor: 2, loyalty: 3, mystery: 1 });

  const arrival = await story.request(buildStoryContext({
    beat: 'REGION_ENTERED', region: 'millhaven',
    chronicle: [...chronicle.events], reputation: reputation.snapshot(),
    npcMemories: memories.compact('elara'),
  }));
  assert.equal(arrival.status, 'applied');
  assert.match(narrative.narration, /Millhaven|forest/i);

  progress(questSystem, 'TALK', 'elara');
  progress(questSystem, 'ENTER', 'blackwater-road');
  progress(questSystem, 'FIND', 'wagon_marks');
  chronicle.append(CHRONICLE_ENTRIES.wagon_truth);
  progress(questSystem, 'EXPLORE', 'sunken-ruin');
  inventory.add(RIVER_KEY);
  inventory.add(BROKEN_KING_MEDALLION);
  progress(questSystem, 'COLLECT', 'river_key');

  const combat = new CombatSystem();
  const thornhart = { health: 80, blocking: false, invulnerable: 0, guard: 0 };
  while (thornhart.health > 0) {
    combat.resolve({ attack: ATTACKS.heavy, hitbox: circleHitbox(0, 0, 24), target: thornhart, hurtbox: circleHitbox(10, 0, 12), direction: { x: 1, y: 0 } });
  }
  assert.equal(thornhart.health, 0);
  progress(questSystem, 'DEFEAT', 'thornhart');
  chronicle.append(CHRONICLE_ENTRIES.thornhart_defeated);

  const phases = new BossPhases(DROWNED_OATH_PHASES);
  assert.equal(phases.pattern(0), 'chain_sweep');
  assert.equal(phases.update(.5), true);
  assert.equal(phases.pattern(1), 'rising_water');
  assert.equal(phases.update(.2), true);
  assert.equal(phases.pattern(2), 'double_lunge');
  progress(questSystem, 'DEFEAT', 'drowned_oath');

  progress(questSystem, 'CHOOSE', 'river_oath');
  chronicle.append(CHRONICLE_ENTRIES.river_released);
  reputation.adjust({ mercy: 8, courage: 4, loyalty: -2, mystery: 3 });
  memories.remember('elara', { type: 'rescue', value: 'freed Corven from the river oath', sentiment: 3 });
  inventory.add(OATHKEEPER('the_river_was_freed'));

  const decision = await story.request(buildStoryContext({
    beat: 'MAJOR_DECISION', region: 'blackwater-bridge',
    recentActions: ['drowned_oath_defeated', 'river_released'],
    chronicle: [...chronicle.events], reputation: reputation.snapshot(),
    npcMemories: memories.compact('elara'),
  }));
  assert.equal(decision.status, 'applied');
  assert.equal(narrative.rumors[0].truth, 'exaggerated');
  assert.equal(quest.status, 'completed');
  assert.equal(quest.activeIndex, quest.objectives.length);
  assert.match(inventory.get('oathkeeper').item.description, /river was freed/i);
  assert.equal(memories.recall('elara').length, 2);

  const storage = new MemoryStorageBackend();
  storage.save(createSave({
    quest: { id: quest.id, status: quest.status, activeIndex: quest.activeIndex },
    inventory: inventory.entries.map(({ item, quantity }) => ({ id: item.id, quantity, history: item.history })),
    chronicle: chronicle.serialize(),
    reputation: reputation.snapshot(),
    npc_memories: memories.compact('elara'),
    rumors: narrative.rumors,
    outcome: 'river_released',
  }));
  const restored = storage.load();
  assert.equal(restored.schema_version, 1);
  assert.equal(restored.quest.status, 'completed');
  assert.ok(restored.chronicle.events.includes('river_released'));
  assert.equal(restored.inventory.find((entry) => entry.id === 'oathkeeper').history.name, 'Oathkeeper');
  assert.equal(restored.outcome, 'river_released');
});

function progress(system, type, target) {
  const changed = system.handle({ type, target });
  assert.equal(changed.length, 1, `${type}:${target} should advance the authored quest`);
}
