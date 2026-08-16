export class SceneManager {
  #stack = [];

  push(scene, payload) {
    if (!scene || typeof scene.update !== 'function' || typeof scene.render !== 'function') {
      throw new TypeError('SceneManager can only push scene-like objects.');
    }
    const current = this.top;
    if (scene.pausesBelow) current?.pause?.();
    scene.manager = this;
    this.#stack.push(scene);
    scene.enter?.(payload);
    return scene;
  }

  pop(payload) {
    const scene = this.#stack.pop();
    if (!scene) return null;
    scene.exit?.(payload);
    scene.manager = null;
    if (scene.pausesBelow) this.top?.resume?.();
    return scene;
  }

  replace(scene, payload) {
    this.pop();
    return this.push(scene, payload);
  }

  clear() {
    while (this.#stack.length) this.pop();
  }

  update(deltaSeconds) {
    if (!this.#stack.length) return;
    let start = this.#stack.length - 1;
    while (start > 0 && !this.#stack[start].pausesBelow) start -= 1;
    for (let index = start; index < this.#stack.length; index += 1) {
      this.#stack[index].update(deltaSeconds);
    }
  }

  render(renderer, alpha) {
    if (!this.#stack.length) return;
    let start = this.#stack.length - 1;
    while (start > 0 && !this.#stack[start].opaque) start -= 1;
    for (let index = start; index < this.#stack.length; index += 1) {
      this.#stack[index].render(renderer, alpha);
    }
  }

  handleAction(action) {
    for (let index = this.#stack.length - 1; index >= 0; index -= 1) {
      if (this.#stack[index].handleAction?.(action)) return true;
      if (this.#stack[index].pausesBelow) break;
    }
    return false;
  }

  get top() {
    return this.#stack.at(-1) ?? null;
  }

  get size() {
    return this.#stack.length;
  }
}
