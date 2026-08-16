export class TouchSource {
  #down = new Set();
  #tapped = new Set();
  #moveX = 0;
  #moveY = 0;

  setMovement(x, y) {
    const length = Math.hypot(x, y);
    this.#moveX = length > 1 ? x / length : x;
    this.#moveY = length > 1 ? y / length : y;
  }

  setAction(action, down) {
    if (down) {
      this.#down.add(action);
      this.#tapped.add(action);
    } else this.#down.delete(action);
  }

  reset() {
    this.#down.clear();
    this.#tapped.clear();
    this.#moveX = 0;
    this.#moveY = 0;
  }

  poll() {
    // A tap shorter than one frame must still register for one poll.
    const down = new Set([...this.#down, ...this.#tapped]);
    this.#tapped.clear();
    return { down, moveX: this.#moveX, moveY: this.#moveY };
  }
}
