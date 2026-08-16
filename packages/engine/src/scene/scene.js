export class Scene {
  constructor({ id, opaque = true, pausesBelow = true } = {}) {
    this.id = id ?? this.constructor.name;
    this.opaque = opaque;
    this.pausesBelow = pausesBelow;
    this.manager = null;
  }

  enter() {}
  exit() {}
  pause() {}
  resume() {}
  update() {}
  render() {}
  handleAction() { return false; }
}
