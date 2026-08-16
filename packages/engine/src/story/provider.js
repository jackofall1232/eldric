export class StoryProvider {
  async generate() { throw new Error('StoryProvider.generate must be implemented.'); }
}

export class StoryProviderRegistry {
  #providers = new Map();
  register(id, provider) { if (!id || typeof provider?.generate !== 'function') throw new TypeError('Provider must implement generate.'); this.#providers.set(id, provider); return this; }
  get(id) { const provider = this.#providers.get(id); if (!provider) throw new RangeError(`Unknown story provider: ${id}`); return provider; }
  has(id) { return this.#providers.has(id); }
}
