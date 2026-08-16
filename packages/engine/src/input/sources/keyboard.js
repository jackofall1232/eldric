import { mergeBindings } from '../bindings.js';

export class KeyboardSource {
  #down = new Set();
  #bindings;
  #target;
  #onKeyDown;
  #onKeyUp;

  constructor(target, bindings = {}) {
    this.#target = target;
    this.#bindings = mergeBindings(bindings);
    this.#onKeyDown = (event) => {
      const action = this.#bindings[event.code];
      if (!action) return;
      this.#down.add(action);
      event.preventDefault();
    };
    this.#onKeyUp = (event) => {
      const action = this.#bindings[event.code];
      if (!action) return;
      this.#down.delete(action);
      event.preventDefault();
    };
    target.addEventListener('keydown', this.#onKeyDown);
    target.addEventListener('keyup', this.#onKeyUp);
  }

  poll() { return { down: this.#down }; }
  dispose() {
    this.#target.removeEventListener('keydown', this.#onKeyDown);
    this.#target.removeEventListener('keyup', this.#onKeyUp);
    this.#down.clear();
  }
}
