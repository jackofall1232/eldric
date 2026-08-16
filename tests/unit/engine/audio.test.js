import assert from 'node:assert/strict'; import test from 'node:test'; import { AudioSystem, MusicState, NullAudioBackend } from '../../../packages/engine/src/index.js';
test('audio gracefully runs silent and changes music state', async () => { const audio = new AudioSystem(new NullAudioBackend()); assert.equal(await audio.init(), true); assert.equal(audio.setMusic(MusicState.VILLAGE), true); assert.equal(audio.setMusic(MusicState.VILLAGE), false); audio.setVolume('ambience', .4); assert.equal(audio.mixer.get('ambience'), .4); await audio.dispose(); });
test('backend failure degrades without breaking gameplay', async () => { const audio = new AudioSystem({ init() { throw new Error('blocked'); } }); assert.equal(await audio.init(), true); assert.equal(audio.play('sword'), null); });
test('music beds persist until the director changes state or disposes', async () => { const stopped = []; const backend = { async init() { return true; }, play(cue) { return { cue }; }, stop(handle) { stopped.push(handle.cue); }, setBusVolume() {}, async dispose() {} }; const audio = new AudioSystem(backend); await audio.init(); audio.setMusic(MusicState.VILLAGE); audio.setMusic(MusicState.DUNGEON); assert.deepEqual(stopped, ['music_village']); await audio.dispose(); assert.deepEqual(stopped, ['music_village', 'music_dungeon']); });

test('mute silences every bus without forgetting the levels behind it', async () => {
  const applied = [];
  const audio = new AudioSystem({ async init() { return true; }, play: () => null, stop() {},
    setBusVolume(bus, value) { applied.push([bus, value]); }, async dispose() {} });
  await audio.init();
  audio.setMasterVolume(1);
  audio.setVolume('music', .5);
  assert.equal(audio.mixer.effective('music'), .5);
  audio.setMuted(true);
  assert.equal(audio.mixer.effective('music'), 0);
  assert.deepEqual(applied.at(-3), ['music', 0]);
  audio.setMuted(false);
  assert.equal(audio.mixer.effective('music'), .5, 'unmuting restores the chosen level');
  assert.equal(audio.toggleMuted(), true);
  await audio.dispose();
});

test('saved levels are restored and unknown keys ignored', async () => {
  const audio = new AudioSystem(new NullAudioBackend());
  await audio.init();
  const restored = audio.restoreVolumes({ master: .3, music: 2, sfx: -1, muted: true, nonsense: 9 });
  assert.equal(restored.master, .3);
  assert.equal(restored.music, 1, 'out-of-range levels clamp');
  assert.equal(restored.sfx, 0);
  assert.equal(restored.muted, true);
  assert.equal('nonsense' in restored, false);
  assert.equal(audio.restoreVolumes(null).master, .3, 'garbage leaves the levels alone');
});

test('a scored bed stands the authored chords down, and a failed one does not', async () => {
  const played = [];
  const backend = { async init() { return true; }, play(cue) { played.push(cue); return { cue }; },
    stop() {}, setBusVolume() {}, async dispose() {} };
  const elements = [];
  const audio = new AudioSystem(backend, { createMediaElement: () => {
    const element = { volume: 1, paused: false, play() { this.paused = false; return Promise.resolve(); },
      pause() { this.paused = true; } };
    elements.push(element);
    return element;
  } });
  await audio.init();
  assert.equal(await audio.useMusicTrack('https://example.test/bed.mp3'), true);
  assert.equal(audio.setMusic(MusicState.DUNGEON), false, 'the bed owns the music bus');
  assert.deepEqual(played, [], 'no chord bed is started underneath the soundtrack');

  audio.setMasterVolume(1); audio.setVolume('music', .5);
  assert.equal(elements[0].volume, .5, 'the bed follows the music bus');
  audio.setMuted(true);
  assert.equal(elements[0].paused, true, 'muting stops the stream rather than zeroing it');
  audio.setMuted(false);
  assert.equal(elements[0].paused, false);

  const silent = new AudioSystem(backend, { createMediaElement: () => { throw new Error('blocked'); } });
  await silent.init();
  assert.equal(await silent.useMusicTrack('https://example.test/bed.mp3'), false);
  assert.equal(silent.setMusic(MusicState.VILLAGE), true, 'the chords still carry the game');
  await audio.dispose();
});
