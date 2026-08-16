import assert from 'node:assert/strict';
import test from 'node:test';
import { LocalStorageBackend, MemoryStorageBackend, migrateSave } from '../../../packages/engine/src/index.js';

test('legacy saves migrate without losing Chronicle entries', () => {
  const save = migrateSave({ chronicle: ['millhaven_saved'] });
  assert.equal(save.schema_version, 1); assert.deepEqual(save.chronicle, ['millhaven_saved']);
});

test('local storage failure degrades to memory', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const storage = new LocalStorageBackend(broken, 'eldric', new MemoryStorageBackend());
  assert.equal(storage.load(), null); storage.save({ quest: 3 }); assert.deepEqual(storage.load(), { quest: 3 });
});
