import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

test('PHP and JavaScript storyteller schemas are exactly equal', async () => {
  const [javascript, php] = await Promise.all([
    readFile(new URL('../../packages/engine/src/story/schema/storyteller-output.schema.json', import.meta.url), 'utf8'),
    readFile(new URL('../../wordpress/living-chronicle/includes/schema/storyteller-output.schema.json', import.meta.url), 'utf8'),
  ]);
  assert.deepEqual(JSON.parse(php), JSON.parse(javascript));
});

test('PHP validator matches malicious fixture behavior', async () => {
  const script = new URL('./php-story-validator.php', import.meta.url);
  const { stdout } = await exec('php', [script.pathname]);
  const result = JSON.parse(stdout);
  assert.equal(result.valid.valid, true);
  assert.equal(result.health.valid, true);
  assert.deepEqual(result.health.value.world_changes, []);
  assert.equal(result.unknown.valid, true);
  assert.deepEqual(result.unknown.value.quest_changes, []);
  assert.equal(result.injection.valid, false);
  assert.equal(result.context.valid, true);
});
