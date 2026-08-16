import { applyStorytellerOutput } from './apply.js';
import { createStoryFallback } from './fallback.js';
import { validateStorytellerOutput } from './validator.js';

export class StorySystem {
  #provider; #state; #fallback; #pending = false; #listeners = new Set();
  constructor({ provider, state, fallback = createStoryFallback } = {}) { this.#provider = provider; this.#state = state; this.#fallback = fallback; }
  request(context) {
    if (this.#pending) return Promise.resolve({ status: 'busy', output: null });
    this.#pending = true; this.#notify();
    return Promise.resolve().then(() => this.#provider.generate(context)).then((raw) => {
      const result = validateStorytellerOutput(raw);
      const output = result.ok ? result.value : this.#fallback();
      applyStorytellerOutput(output, this.#state);
      return { status: result.ok ? 'applied' : 'fallback', output, errors: result.errors };
    }).catch(() => {
      const output = this.#fallback(); applyStorytellerOutput(output, this.#state); return { status: 'fallback', output, errors: ['provider_failure'] };
    }).finally(() => { this.#pending = false; this.#notify(); });
  }
  subscribe(listener) { this.#listeners.add(listener); return () => this.#listeners.delete(listener); }
  #notify() { for (const listener of this.#listeners) listener(this.#pending); }
  get pending() { return this.#pending; }
}
