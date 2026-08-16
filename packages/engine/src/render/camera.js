export class Camera {
  constructor({ width, height, x = 0, y = 0, smoothing = 10 } = {}) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.smoothing = smoothing;
    this.bounds = null;
    this.shakeTime = 0;
    this.shakeMagnitude = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  follow(target, deltaSeconds) {
    const factor = 1 - Math.exp(-this.smoothing * deltaSeconds);
    this.x += (target.x - this.x) * factor;
    this.y += (target.y - this.y) * factor;
    this.#clamp();
  }

  setBounds(bounds) {
    this.bounds = bounds ? { ...bounds } : null;
    this.#clamp();
  }

  shake(magnitude = 2, duration = 0.12) {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  update(deltaSeconds) {
    if (this.shakeTime <= 0) {
      this.shakeX = 0;
      this.shakeY = 0;
      return;
    }
    this.shakeTime = Math.max(0, this.shakeTime - deltaSeconds);
    const phase = this.shakeTime * 137;
    this.shakeX = Math.sin(phase) * this.shakeMagnitude;
    this.shakeY = Math.cos(phase * 1.7) * this.shakeMagnitude;
  }

  worldToScreen(x, y) {
    return {
      x: Math.round(x - this.x + this.width / 2 + this.shakeX),
      y: Math.round(y - this.y + this.height / 2 + this.shakeY),
    };
  }

  screenToWorld(x, y) {
    return {
      x: x + this.x - this.width / 2 - this.shakeX,
      y: y + this.y - this.height / 2 - this.shakeY,
    };
  }

  isVisible(x, y, width = 0, height = 0, padding = 24) {
    const point = this.worldToScreen(x, y);
    return point.x + width >= -padding && point.y + height >= -padding
      && point.x - width <= this.width + padding && point.y - height <= this.height + padding;
  }

  #clamp() {
    if (!this.bounds) return;
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    this.x = Math.max(this.bounds.x + halfWidth, Math.min(this.bounds.x + this.bounds.width - halfWidth, this.x));
    this.y = Math.max(this.bounds.y + halfHeight, Math.min(this.bounds.y + this.bounds.height - halfHeight, this.y));
  }
}
