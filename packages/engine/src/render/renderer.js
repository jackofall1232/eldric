import { RenderLayer } from './layer.js';

export class Renderer {
  #backend;
  #commands = [];
  #sequence = 0;

  constructor(backend) {
    if (!backend?.execute) throw new TypeError('Renderer requires a drawing backend.');
    this.#backend = backend;
  }

  begin(clear = '#111817') {
    this.#commands.length = 0;
    this.#sequence = 0;
    this.#backend.begin?.(clear);
  }

  draw(type, props = {}, layer = RenderLayer.ENTITY, order = 0) {
    this.#commands.push({ type, props, layer, order, sequence: this.#sequence++ });
  }

  rect(props, layer, order) { this.draw('rect', props, layer, order); }
  circle(props, layer, order) { this.draw('circle', props, layer, order); }
  polygon(props, layer, order) { this.draw('polygon', props, layer, order); }
  line(props, layer, order) { this.draw('line', props, layer, order); }
  text(props, layer = RenderLayer.UI, order) { this.draw('text', props, layer, order); }
  sprite(props, layer, order) { this.draw('sprite', props, layer, order); }

  end() {
    this.#commands.sort((a, b) => a.layer - b.layer || a.order - b.order || a.sequence - b.sequence);
    for (const command of this.#commands) this.#backend.execute(command);
    this.#backend.end?.();
  }

  get width() { return this.#backend.width; }
  get height() { return this.#backend.height; }
}
