import assert from 'node:assert/strict'; import test from 'node:test';
import { compileQuest } from '../../../packages/engine/src/systems/quest/quest-compiler.js';
import { BLACKWATER_QUEST } from '../../../packages/game/src/content/quests/index.js';
test('authored Blackwater quest compiles entirely to supported objectives', () => { const quest = compileQuest(BLACKWATER_QUEST); assert.equal(quest.objectives.length, 8); assert.equal(quest.objectives[0].status, 'pending'); });
test('unsupported mechanics are rejected', () => { assert.throws(() => compileQuest({ id: 'bad', title: 'Bad', objectives: [{ type: 'TELEPORT', target: 'moon' }] }), /unsupported/); });
