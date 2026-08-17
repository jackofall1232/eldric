const BUSES = ['music', 'sfx', 'ambience'];

function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }

// Per-bus levels behind a master level and a mute switch. Mute is a separate
// flag rather than "master = 0" so that unmuting restores the level the player
// chose instead of guessing one.
export class AudioMixer {
  constructor(backend) {
    this.backend = backend;
    this.volumes = { music: .55, sfx: .8, ambience: .65 };
    this.master = .8;
    this.muted = false;
    this.listeners = new Set();
  }

  set(bus, value) {
    if (!(bus in this.volumes)) throw new RangeError('Unknown audio bus.');
    this.volumes[bus] = clamp01(value);
    this.#apply();
  }

  get(bus) { return this.volumes[bus]; }
  setMaster(value) { this.master = clamp01(value); this.#apply(); }
  setMuted(muted) { this.muted = Boolean(muted); this.#apply(); }
  toggleMuted() { this.setMuted(!this.muted); return this.muted; }

  /** What a bus should actually sound at, after master and mute. */
  effective(bus) { return this.muted ? 0 : this.master * (this.volumes[bus] ?? 0); }

  snapshot() { return { master: this.master, muted: this.muted, ...this.volumes }; }

  /** Restore a saved snapshot, ignoring anything unrecognised. */
  restore(settings = {}) {
    if (!settings || typeof settings !== 'object') return this.snapshot();
    if ('master' in settings) this.master = clamp01(settings.master);
    if ('muted' in settings) this.muted = Boolean(settings.muted);
    for (const bus of BUSES) if (bus in settings) this.volumes[bus] = clamp01(settings[bus]);
    this.#apply();
    return this.snapshot();
  }

  /** Push current levels at the backend — the gains start at unity otherwise. */
  sync() { this.#apply(); }

  /** Anything that carries its own gain — a streamed track — follows changes here. */
  subscribe(listener) { this.listeners.add(listener); listener(this); return () => this.listeners.delete(listener); }

  #apply() {
    for (const bus of BUSES) this.backend.setBusVolume(bus, this.effective(bus));
    for (const listener of this.listeners) listener(this);
  }
}
