export class GameTime {
  #elapsed = 0;
  #scale = 1;
  #paused = false;

  advance(deltaSeconds) {
    const delta = this.#paused ? 0 : Math.max(0, Number(deltaSeconds) || 0) * this.#scale;
    this.#elapsed += delta;
    return delta;
  }

  pause() {
    this.#paused = true;
  }

  resume() {
    this.#paused = false;
  }

  reset() {
    this.#elapsed = 0;
  }

  get elapsed() {
    return this.#elapsed;
  }

  get paused() {
    return this.#paused;
  }

  get scale() {
    return this.#scale;
  }

  set scale(value) {
    const scale = Number(value);
    if (!Number.isFinite(scale) || scale < 0 || scale > 4) {
      throw new RangeError('Time scale must be between 0 and 4.');
    }
    this.#scale = scale;
  }
}
