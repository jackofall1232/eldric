import { AudioMixer } from './mixer.js';
import { MusicDirector } from './music.js';
import { MusicTrack } from './music-track.js';
import { NullAudioBackend } from './backends/null-backend.js';

export class AudioSystem {
  constructor(backend = new NullAudioBackend(), { createMediaElement = null } = {}) {
    this.backend = backend;
    this.mixer = new AudioMixer(backend);
    this.music = new MusicDirector(this);
    this.track = new MusicTrack({ mixer: this.mixer, createElement: createMediaElement });
    this.ready = false;
  }

  async init() {
    try {
      this.ready = await this.backend.init() !== false;
    } catch {
      this.backend = new NullAudioBackend();
      await this.backend.init();
      this.mixer = new AudioMixer(this.backend);
      this.track.mixer = this.mixer;
      this.ready = true;
    }
    this.mixer.sync();
    return this.ready;
  }

  play(cue, options = {}) {
    try { return this.backend.play(cue, options); } catch { return null; }
  }

  setMusic(state) { return this.music.set(state); }
  setVolume(bus, volume) { this.mixer.set(bus, volume); }
  setMasterVolume(volume) { this.mixer.setMaster(volume); }
  setMuted(muted) { this.mixer.setMuted(muted); }
  toggleMuted() { return this.mixer.toggleMuted(); }
  volumes() { return this.mixer.snapshot(); }
  restoreVolumes(settings) { return this.mixer.restore(settings); }

  /**
   * Play a scored soundtrack file as the music bed. While it holds, the authored
   * per-region chords stand down — one bed, not two. Returns false if the file
   * cannot play, leaving the chords in charge.
   */
  async useMusicTrack(url) {
    const started = await this.track.play(url);
    if (started) this.music.stop();
    return started;
  }

  async dispose() {
    this.music.stop();
    this.track.stop();
    await this.backend.dispose?.();
  }
}
