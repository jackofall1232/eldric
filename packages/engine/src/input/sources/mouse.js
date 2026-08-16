export class PointerSource {
  constructor(element) {
    this.element = element;
    this.position = { x: 0, y: 0 };
    this.down = false;
    this.onMove = (event) => {
      const bounds = element.getBoundingClientRect();
      this.position.x = (event.clientX - bounds.left) / bounds.width;
      this.position.y = (event.clientY - bounds.top) / bounds.height;
    };
    this.onDown = () => { this.down = true; };
    this.onUp = () => { this.down = false; };
    element.addEventListener('pointermove', this.onMove);
    element.addEventListener('pointerdown', this.onDown);
    element.addEventListener('pointerup', this.onUp);
    element.addEventListener('pointercancel', this.onUp);
  }
  poll() { return { pointer: { ...this.position, down: this.down } }; }
  dispose() {
    this.element.removeEventListener('pointermove', this.onMove);
    this.element.removeEventListener('pointerdown', this.onDown);
    this.element.removeEventListener('pointerup', this.onUp);
    this.element.removeEventListener('pointercancel', this.onUp);
  }
}
