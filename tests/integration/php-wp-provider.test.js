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
  assert.equal(result.sanitize_unknown_ai_provider, '');
  assert.equal(result.sanitize_known_ai_provider, 'openai');
});

test('the AI connector is chosen explicitly rather than left to plugin load order', async () => {
  const script = new URL('./php-wp-provider.php', import.meta.url);
  const { stdout } = await exec('php', [script.pathname]);
  const result = JSON.parse(stdout);
  // Only connectors that answer a support probe are discoverable.
  assert.deepEqual(result.configured_providers, ['anthropic', 'openai']);
  assert.equal(result.configured_any, true);
  // Probes are cached, so admin screens do not re-ask on every load.
  assert.deepEqual(result.configured_providers_cached, ['anthropic', 'openai']);
  assert.equal(result.configured_none_after_flush, false);
  // Site AI with no working connector degrades to local instead of claiming to serve.
  assert.equal(result.active_without_connector, 'local');
  // The chosen connector reaches the AI Client builder.
  assert.equal(result.chosen_ai_provider, 'openai');
  assert.equal(result.active_ai_provider, 'openai');
  assert.equal(result.generate_used_provider, 'openai');
  // A chosen connector that stops answering falls back to the site default.
  assert.equal(result.chosen_unconfigured_ai_provider, 'google');
  assert.equal(result.active_unconfigured_falls_back, '');
  assert.equal(result.generate_default_names_no_provider, true);
  // An unknown id never reaches the builder.
  assert.equal(result.unknown_provider_ignored, true);
});
