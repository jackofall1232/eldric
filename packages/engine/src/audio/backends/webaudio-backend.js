export class WebAudioBackend {
  constructor(AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext) { this.AudioContextClass = AudioContextClass; this.context = null; this.buses = new Map(); }
  async init() { if (!this.AudioContextClass) return false; this.context = new this.AudioContextClass(); for (const bus of ['music','sfx','ambience']) { const gain = this.context.createGain(); gain.connect(this.context.destination); this.buses.set(bus, gain); } return true; }
  play(cue, { bus = 'sfx', volume = .3 } = {}) { if (!this.context) return null; const oscillator = this.context.createOscillator(); const gain = this.context.createGain(); const frequency = { sword: 170, treasure: 660, fire: 95, water: 130, danger: 110 }[cue] ?? 220; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(volume, this.context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, this.context.currentTime + .12); oscillator.connect(gain); gain.connect(this.buses.get(bus) ?? this.context.destination); oscillator.start(); oscillator.stop(this.context.currentTime + .13); return oscillator; }
  stop(handle) { try { handle?.stop(); } catch {} }
  setBusVolume(bus, value) { const gain = this.buses.get(bus); if (gain) gain.gain.value = Math.max(0, Math.min(1, value)); }
  async dispose() { await this.context?.close?.(); this.context = null; }
}
