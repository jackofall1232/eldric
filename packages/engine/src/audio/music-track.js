// A single streamed music bed — one file, looped, under the mixer's music bus.
//
// Deliberately a media element rather than a decoded WebAudio buffer: the bed is
// minutes long and must start without waiting for a whole file to download, and
// routing a cross-origin file through an AudioContext requires CORS headers the
// host site may not send. Element volume needs neither. The cost is that the bed
// cannot carry WebAudio effects, which it does not need.
export class MusicTrack {
  #unsubscribe = null;

  constructor({ mixer, createElement, bus = 'music', trim = 1 } = {}) {
    this.mixer = mixer;
    this.createElement = createElement;
    this.bus = bus;
    this.trim = Math.max(0, Math.min(1, Number(trim) || 0));
    this.element = null;
    this.url = null;
    this.playing = false;
    this.failed = false;
  }

  /**
   * Start (or switch to) a looping bed. Resolves false when the track cannot be
   * played at all, which is a cue for the caller to fall back to authored music
   * rather than an error — a missing soundtrack must never block play.
   */
  async play(url) {
    if (!url || typeof this.createElement !== 'function') return false;
    if (this.url === url && this.playing) return true;
    this.stop();
    try {
      const element = this.createElement();
      if (!element) return false;
      element.src = url;
      element.loop = true;
      element.preload = 'auto';
      this.element = element;
      this.url = url;
      this.#follow();
      await element.play?.();
      this.playing = true;
      this.failed = false;
      return true;
    } catch {
      // Autoplay refusal, a 404, an unsupported codec — all the same to the game.
      this.failed = true;
      this.stop();
      return false;
    }
  }

  stop() {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    try { this.element?.pause?.(); } catch { /* already gone */ }
    if (this.element) this.element.src = '';
    this.element = null;
    this.url = null;
    this.playing = false;
  }

  #follow() {
    const apply = (mixer) => {
      if (!this.element) return;
      this.element.volume = Math.max(0, Math.min(1, mixer.effective(this.bus) * this.trim));
      // Muting pauses rather than zeroing: a silent stream still costs a mobile
      // radio and a decode.
      if (mixer.muted) this.element.pause?.();
      else if (this.playing) this.element.play?.()?.catch?.(() => {});
    };
    this.#unsubscribe = this.mixer?.subscribe?.(apply) ?? null;
    if (!this.#unsubscribe) apply(this.mixer);
  }
}
