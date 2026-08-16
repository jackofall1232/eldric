export const DEFAULT_CONFIG = Object.freeze({
  logicalWidth: 384,
  logicalHeight: 216,
  pixelRatioCap: 2,
  saveKey: 'eldric.living-chronicle.save',
  storyProvider: 'local',
  reducedMotion: false,
  openingSeen: false,
  assetBase: '.',
});

export function resolveConfig(overrides = {}) {
  const config = { ...DEFAULT_CONFIG, ...overrides };
  config.logicalWidth = clampDimension(config.logicalWidth, 320, 640);
  config.logicalHeight = clampDimension(config.logicalHeight, 180, 360);
  config.pixelRatioCap = Math.max(1, Math.min(3, Number(config.pixelRatioCap) || 1));
  config.assetBase = typeof config.assetBase === 'string' && config.assetBase ? config.assetBase : '.';
  return config;
}

function clampDimension(value, minimum, maximum) {
  return Math.round(Math.max(minimum, Math.min(maximum, Number(value) || minimum)));
}
