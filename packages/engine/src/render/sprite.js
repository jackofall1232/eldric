export class Sprite {
  constructor({ sheet, clip = 'idle', x = 0, y = 0, anchorX = 0, anchorY = 0 } = {}) {
    this.sheet = sheet;
    this.clip = clip;
    this.x = x;
    this.y = y;
    this.anchorX = anchorX;
    this.anchorY = anchorY;
    this.flipX = false;
    this.elapsed = 0;
  }

  update(deltaSeconds) {
    this.elapsed += deltaSeconds;
  }

  frame() {
    return this.sheet.frameAt(this.clip, this.elapsed);
  }
}
