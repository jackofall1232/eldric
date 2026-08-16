export class NullAudioBackend { async init() { return true; } play() { return null; } stop() {} setBusVolume() {} async dispose() {} }
