export class SpriteSheet {
  constructor(image, { frames = {}, clips = {} } = {}) {
    this.image = image;
    this.frames = new Map(Object.entries(frames));
    this.clips = new Map(Object.entries(clips));
  }

  frame(name) {
    return this.frames.get(name) ?? null;
  }

  frameAt(clipName, elapsedSeconds) {
    const clip = this.clips.get(clipName);
    if (!clip?.frames?.length) return this.frame(clipName);
    const fps = clip.fps ?? 8;
    const index = Math.floor(elapsedSeconds * fps);
    const resolved = clip.loop === false ? Math.min(index, clip.frames.length - 1) : index % clip.frames.length;
    return this.frame(clip.frames[resolved]);
  }
}
