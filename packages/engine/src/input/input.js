import { Action } from './actions.js';

export class InputManager {
  #sources;
  #down = new Set();
  #pressed = new Set();
  #released = new Set();
  #movement = { x: 0, y: 0 };

  constructor(sources = []) {
    this.#sources = [...sources];
  }

  update() {
    const next = new Set();
    let x = 0;
    let y = 0;
    for (const source of this.#sources) {
      const state = source.poll?.() ?? {};
      for (const action of state.down ?? []) next.add(action);
      x += Number(state.moveX) || 0;
      y += Number(state.moveY) || 0;
    }

    x += (next.has(Action.MOVE_RIGHT) ? 1 : 0) - (next.has(Action.MOVE_LEFT) ? 1 : 0);
    y += (next.has(Action.MOVE_DOWN) ? 1 : 0) - (next.has(Action.MOVE_UP) ? 1 : 0);
    const length = Math.hypot(x, y);
    this.#movement = length > 1 ? { x: x / length, y: y / length } : { x, y };
    this.#pressed = new Set([...next].filter((action) => !this.#down.has(action)));
    this.#released = new Set([...this.#down].filter((action) => !next.has(action)));
    this.#down = next;
  }

  down(action) { return this.#down.has(action); }
  pressed(action) { return this.#pressed.has(action); }
  released(action) { return this.#released.has(action); }
  movement() { return { ...this.#movement }; }
  addSource(source) { this.#sources.push(source); }
  dispose() { for (const source of this.#sources) source.dispose?.(); }
}
