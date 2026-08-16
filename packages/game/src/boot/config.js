export const DEFAULT_CONFIG = Object.freeze({
  logicalWidth: 384,
  logicalHeight: 216,
  pixelRatioCap: 2,
  saveKey: 'eldric.living-chronicle.save',
  storyProvider: 'local',
  reducedMotion: false,
  openingSeen: false,
  assetBase: '.',
  // The scored music bed. Empty means the soundtrack shipped in `assets/audio`;
  // a URL points somewhere else; 'none' leaves the authored per-region chords in
  // charge, so a host that wants no soundtrack is still a complete game.
  musicUrl: '',
});

export const BUNDLED_MUSIC_PATH = 'audio/eldric-background.mp3';

export function resolveConfig(overrides = {}) {
  const config = { ...DEFAULT_CONFIG, ...overrides };
  config.logicalWidth = clampDimension(config.logicalWidth, 320, 640);
  config.logicalHeight = clampDimension(config.logicalHeight, 180, 360);
  config.pixelRatioCap = Math.max(1, Math.min(3, Number(config.pixelRatioCap) || 1));
  config.assetBase = typeof config.assetBase === 'string' && config.assetBase ? config.assetBase : '.';
  config.musicUrl = resolveMusicUrl(config.musicUrl);
  return config;
}

// The soundtrack URL can arrive from a shortcode attribute, so it is caller
// input: allow only http(s) and protocol-relative paths, never a javascript:
// or data: URL that a media element would happily accept.
export function resolveMusicUrl(value) {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url) return '';
  if (url.toLowerCase() === 'none') return 'none';
  return /^(https?:\/\/|\/\/|\/(?!\/)|\.{0,2}\/)/i.test(url) ? url : '';
}

/** The file the bed should actually load, or '' when music is switched off. */
export function musicSource(config) {
  if (config.musicUrl === 'none') return '';
  if (config.musicUrl) return config.musicUrl;
  return `${String(config.assetBase).replace(/\/$/, '')}/${BUNDLED_MUSIC_PATH}`;
}

function clampDimension(value, minimum, maximum) {
  return Math.round(Math.max(minimum, Math.min(maximum, Number(value) || minimum)));
}
