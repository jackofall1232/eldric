import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { validateStorytellerOutput } from '../../../packages/engine/src/story/validator.js';

const fixture = async (name) => readFile(new URL(`../../fixtures/story/${name}`, import.meta.url), 'utf8');

test('accepts the minimal fixed storyteller contract', async () => {
  const result = validateStorytellerOutput(await fixture('valid-minimal.json'));
  assert.equal(result.ok, true); assert.equal(result.value.schema_version, 1);
});
test('rejects malformed and oversized responses', async () => {
  assert.equal(validateStorytellerOutput(await fixture('malformed-json.json')).ok, false);
  const base = JSON.parse(await fixture('invalid-oversized.json')); base.narration = 'x'.repeat(40_000);
  assert.deepEqual(validateStorytellerOutput(base).errors, ['response_too_large']);
});
test('drops unknown actions and never accepts real-time commands', async () => {
  const unknown = validateStorytellerOutput(await fixture('invalid-unknown-action.json'));
  assert.equal(unknown.ok, true); assert.deepEqual(unknown.value.quest_changes, []); assert.deepEqual(unknown.value.world_changes, []);
  const health = validateStorytellerOutput(await fixture('malicious-set-health.json'));
  assert.equal(health.ok, true); assert.deepEqual(health.value.world_changes, []);
});
test('rejects markup and executable URL schemes', async () => {
  const result = validateStorytellerOutput(await fixture('malicious-injection.json'));
  assert.equal(result.ok, false); assert.equal(result.value, null);
  assert.ok(result.errors.some((error) => error.startsWith('dangerous_text:')));
});
test('rejects unknown top-level fields', async () => {
  const value = JSON.parse(await fixture('valid-minimal.json')); value.health = 999;
  const result = validateStorytellerOutput(value); assert.equal(result.ok, false); assert.match(result.errors[0], /unknown_fields/);
});
