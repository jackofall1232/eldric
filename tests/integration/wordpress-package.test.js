import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const plugin = new URL('../../wordpress/living-chronicle/', import.meta.url);

test('WordPress package is self-contained, scoped, and uses stable page/profile/slot saves', async () => {
  const [bootstrap, shortcode, loader, css, bundle, opening] = await Promise.all([
    readFile(new URL('living-chronicle.php', plugin), 'utf8'),
    readFile(new URL('includes/class-lc-shortcode.php', plugin), 'utf8'),
    readFile(new URL('includes/class-lc-assets.php', plugin), 'utf8'),
    readFile(new URL('assets/build/eldric-living-chronicle.css', plugin), 'utf8'),
    stat(new URL('assets/build/eldric-living-chronicle.js', plugin)),
    stat(new URL('assets/build/opening/millhaven-book-source.png', plugin)),
  ]);
  assert.match(bootstrap, /Plugin Name: Eldric: The Living Chronicle/);
  assert.match(shortcode, /get_queried_object_id/);
  assert.match(shortcode, /%d\.%s\.%s/);
  assert.match(shortcode, /'slot'/);
  assert.match(loader, /document\.readyState/);
  assert.ok(css.split('\n').filter((line) => line.trim().endsWith('{')).every((line) => line.includes('.living-chronicle') || line.includes('eldric-dev-host') || line.startsWith('@')));
  assert.ok(bundle.size > 40_000);
  assert.ok(opening.size > 100_000);
});
