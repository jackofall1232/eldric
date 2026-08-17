import assert from 'node:assert/strict';
import test from 'node:test';
import { BUNDLED_MUSIC_PATH, musicSource, resolveConfig, resolveMusicUrl } from '../../../packages/game/src/boot/config.js';

test('the soundtrack URL is treated as caller input', () => {
  // A shortcode attribute reaches this from post content, and a media element
  // will happily load a javascript: or data: URL.
  for (const hostile of ['javascript:alert(1)', 'data:audio/mp3;base64,AAAA', 'vbscript:x', 'file:///etc/passwd']) {
    assert.equal(resolveMusicUrl(hostile), '', `${hostile} must not survive`);
  }
  assert.equal(resolveMusicUrl(' https://cdn.test/bed.mp3 '), 'https://cdn.test/bed.mp3');
  assert.equal(resolveMusicUrl('//cdn.test/bed.mp3'), '//cdn.test/bed.mp3');
  assert.equal(resolveMusicUrl('/wp-content/bed.mp3'), '/wp-content/bed.mp3');
  assert.equal(resolveMusicUrl('None'), 'none');
  assert.equal(resolveMusicUrl(undefined), '');
});

test('an unset soundtrack falls back to the bundled score, and "none" to silence', () => {
  const bundled = resolveConfig({ assetBase: 'https://site.test/plugin/assets/build/' });
  assert.equal(musicSource(bundled), `https://site.test/plugin/assets/build/${BUNDLED_MUSIC_PATH}`);
  assert.equal(musicSource(resolveConfig({ musicUrl: 'none' })), '');
  assert.equal(musicSource(resolveConfig({ musicUrl: 'https://cdn.test/x.mp3' })), 'https://cdn.test/x.mp3');
  assert.equal(musicSource(resolveConfig({ musicUrl: 'javascript:alert(1)', assetBase: '.' })),
    `./${BUNDLED_MUSIC_PATH}`, 'a rejected URL falls back to the bundled score, never to the hostile one');
});
