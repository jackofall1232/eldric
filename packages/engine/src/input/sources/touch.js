export class TouchSource {
  #down = new Set();
  #moveX = 0;
  #moveY = 0;

  setMovement(x, y) {
    const length = Math.hypot(x, y);
    this.#moveX = length > 1 ? x / length : x;
    this.#moveY = length > 1 ? y / length : y;
  }

  setAction(action, down) {
    if (down) this.#down.add(action);
    else this.#down.delete(action);
  }

  reset() {
    this.#down.clear();
    this.#moveX = 0;
    this.#moveY = 0;
  }

  poll() { return { down: this.#down, moveX: this.#moveX, moveY: this.#moveY }; }
}
