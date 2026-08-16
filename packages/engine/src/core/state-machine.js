export class StateMachine {
  #states;
  #context;
  #current = null;
  #elapsed = 0;

  constructor(states, context = {}) {
    this.#states = new Map(Object.entries(states ?? {}));
    this.#context = context;
  }

  transition(name, payload) {
    if (!this.#states.has(name)) throw new RangeError(`Unknown state: ${name}`);
    if (name === this.#current) return false;
    this.#states.get(this.#current)?.exit?.(this.#context, name);
    const previous = this.#current;
    this.#current = name;
    this.#elapsed = 0;
    this.#states.get(name)?.enter?.(this.#context, payload, previous);
    return true;
  }

  update(deltaSeconds) {
    if (this.#current === null) return;
    this.#elapsed += deltaSeconds;
    this.#states.get(this.#current)?.update?.(this.#context, deltaSeconds, this.#elapsed, this);
  }

  get current() {
    return this.#current;
  }

  get elapsed() {
    return this.#elapsed;
  }
}
