import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

test('PHP provider selection routes to the WordPress AI Client and always falls back safely', async () => {
  const script = new URL('./php-wp-provider.php', import.meta.url);
  const { stdout } = await exec('php', [script.pathname]);
  const result = JSON.parse(stdout);
  assert.equal(result.default_chosen, 'local');
  assert.equal(result.default_active, 'local');
  assert.equal(result.wp_ai_available_before, false);
  assert.equal(result.chosen_wp_ai, 'wp-ai');
  assert.equal(result.active_without_client, 'local');
  assert.equal(result.unavailable_is_error, true);
  assert.equal(result.active_with_client, 'wp-ai');
  assert.equal(result.generate_ok_is_array, true);
  assert.equal(result.generate_ok_validates, true);
  assert.equal(result.prompt_mentions_beat, true);
  assert.equal(result.prompt_mentions_chronicle, true);
  assert.equal(result.garbage_is_error, true);
  assert.equal(result.provider_error_passthrough, true);
  assert.equal(result.sanitize_unknown_provider, 'local');
  assert.equal(result.sanitize_wp_ai, 'wp-ai');
});
