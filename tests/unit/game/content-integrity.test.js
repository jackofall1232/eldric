import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('asset manifest records dimensions and original provenance', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../../assets/manifest.json', import.meta.url)));
  const opening = manifest.assets['opening.millhaven_book'];
  assert.equal(manifest.schema_version, 1);
  assert.ok(opening.width > 1000);
  assert.match(opening.provenance, /Original image generated for Eldric/);
});
