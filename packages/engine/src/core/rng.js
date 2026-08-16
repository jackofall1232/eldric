export class SeededRng {
  #state;

  constructor(seed = 0x454c4452) {
    this.#state = normalizeSeed(seed);
  }

  nextUint32() {
    let state = this.#state;
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    this.#state = state >>> 0;
    return this.#state;
  }

  next() {
    return this.nextUint32() / 0x100000000;
  }

  int(minimum, maximum) {
    const min = Math.ceil(minimum);
    const max = Math.floor(maximum);
    if (max < min) throw new RangeError('RNG maximum must be greater than or equal to minimum.');
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick(values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new RangeError('RNG pick requires a non-empty array.');
    }
    return values[this.int(0, values.length - 1)];
  }

  chance(probability) {
    return this.next() < Math.max(0, Math.min(1, probability));
  }

  snapshot() {
    return this.#state;
  }

  restore(state) {
    this.#state = normalizeSeed(state);
  }
}

function normalizeSeed(seed) {
  if (typeof seed === 'string') {
    let hash = 2166136261;
    for (let index = 0; index < seed.length; index += 1) {
      hash ^= seed.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0 || 1;
  }
  return Number(seed) >>> 0 || 1;
}
