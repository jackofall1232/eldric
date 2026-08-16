let nextEntityId = 1;

export class Entity {
  #components = new Map();

  constructor({ id, tags = [] } = {}) {
    this.id = id ?? `entity-${nextEntityId++}`;
    this.tags = new Set(tags);
    this.active = true;
  }

  add(type, component) {
    if (!type) throw new TypeError('A component type is required.');
    this.#components.set(type, component);
    return this;
  }

  get(type) {
    return this.#components.get(type);
  }

  has(type) {
    return this.#components.has(type);
  }

  remove(type) {
    return this.#components.delete(type);
  }

  components() {
    return this.#components.entries();
  }
}

export function resetEntityIds(value = 1) {
  nextEntityId = Math.max(1, Math.floor(value));
}
