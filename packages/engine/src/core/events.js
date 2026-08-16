export class EventBus {
  #listeners = new Map();

  on(type, listener) {
    if (typeof listener !== 'function') throw new TypeError('Event listener must be a function.');
    const listeners = this.#listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.#listeners.set(type, listeners);
    return () => this.off(type, listener);
  }

  once(type, listener) {
    const unsubscribe = this.on(type, (payload) => {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  off(type, listener) {
    const listeners = this.#listeners.get(type);
    if (!listeners) return false;
    const removed = listeners.delete(listener);
    if (listeners.size === 0) this.#listeners.delete(type);
    return removed;
  }

  emit(type, payload) {
    const listeners = this.#listeners.get(type);
    if (!listeners) return 0;
    for (const listener of [...listeners]) listener(payload);
    return listeners.size;
  }

  clear() {
    this.#listeners.clear();
  }
}
