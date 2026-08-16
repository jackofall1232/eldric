import { SeededRng } from '../../core/rng.js';
import { createStoryFallback } from '../fallback.js';
import { StoryProvider } from '../provider.js';

export class LocalStoryProvider extends StoryProvider {
  constructor({ corpus = {}, seed = 'eldric-local-story' } = {}) { super(); this.corpus = corpus; this.rng = new SeededRng(seed); }
  async generate(context) {
    const templates = this.corpus[context.beat] ?? this.corpus.DEFAULT ?? [];
    if (!templates.length) return createStoryFallback();
    const selected = this.rng.pick(templates);
    const output = typeof selected === 'function' ? selected(context, this.rng) : selected;
    return structuredCopy({ ...createStoryFallback(), ...output, schema_version: 1 });
  }
}
function structuredCopy(value) { return JSON.parse(JSON.stringify(value)); }
