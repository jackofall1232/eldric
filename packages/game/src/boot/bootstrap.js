import { resolveConfig } from './config.js';
import { createGameRuntime } from '../runtime/game-runtime.js';
import { AudioSystem, LocalStorageBackend, MusicState, WebAudioBackend } from '@eldric/engine';
import { mountMobileControls } from '../ui/mobile-controls.js';
import { mountHelpMenu } from '../ui/help-menu.js';

export function bootstrapGame(root, overrides = {}) {
  if (!root || typeof root.append !== 'function') {
    throw new TypeError('Eldric requires a valid mount element.');
  }

  const config = resolveConfig(overrides);
  const canvas = root.ownerDocument.createElement('canvas');
  canvas.className = 'lc-game-canvas';
  canvas.width = config.logicalWidth;
  canvas.height = config.logicalHeight;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label', 'Eldric: The Living Chronicle game');

  const status = root.ownerDocument.createElement('p');
  status.className = 'lc-screenreader-status';
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Eldric is ready.';

  root.classList.add('lc-mounted');
  root.replaceChildren(canvas, status);
  const openingPlate = new root.ownerDocument.defaultView.Image();
  openingPlate.decoding = 'async';
  openingPlate.src = `${config.assetBase.replace(/\/$/, '')}/opening/millhaven-book-source.png`;
  const storage = new LocalStorageBackend(root.ownerDocument.defaultView.localStorage, config.saveKey);
  const audio = new AudioSystem(new WebAudioBackend(root.ownerDocument.defaultView.AudioContext ?? root.ownerDocument.defaultView.webkitAudioContext));
  const runtime = createGameRuntime(canvas, { ...config, openingPlate, storage, audio }, (message) => { status.textContent = message; });
  const unmountControls = mountMobileControls(root, runtime.platform.touchSource);
  const unmountHelp = mountHelpMenu(root);

  const abortController = new AbortController();
  const startAudio = async () => { await audio.init(); audio.setMusic(MusicState.VILLAGE); };
  root.addEventListener('pointerdown', startAudio, { once: true, signal: abortController.signal });
  root.addEventListener('keydown', startAudio, { once: true, signal: abortController.signal });
  const resize = () => resizeCanvasDisplay(root, canvas, config);
  root.ownerDocument.defaultView?.addEventListener('resize', resize, {
    signal: abortController.signal,
  });
  resize();
  canvas.focus({ preventScroll: true });
  runtime.start();

  return {
    root,
    canvas,
    config,
    runtime,
    destroy() {
      runtime.stop();
      unmountControls();
      unmountHelp();
      audio.dispose();
      abortController.abort();
      root.classList.remove('lc-mounted');
      root.replaceChildren();
    },
  };
}

function resizeCanvasDisplay(root, canvas, config) {
  const availableWidth = Math.max(1, root.clientWidth || config.logicalWidth);
  const availableHeight = Math.max(1, root.clientHeight || config.logicalHeight);
  const scale = computeDisplayScale(availableWidth, availableHeight, config.logicalWidth, config.logicalHeight);
  canvas.style.width = `${config.logicalWidth * scale}px`;
  canvas.style.height = `${config.logicalHeight * scale}px`;
  // Supersample the backing store toward the true display resolution so the
  // vector art and UI text rasterize crisply instead of being stretched from
  // 384×216. The render backend keeps drawing in logical coordinates.
  const pixelRatio = Math.min(root.ownerDocument.defaultView?.devicePixelRatio || 1, config.pixelRatioCap);
  const renderScale = computeRenderScale(scale, pixelRatio);
  const width = Math.round(config.logicalWidth * renderScale);
  const height = Math.round(config.logicalHeight * renderScale);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
}

// Clamp the supersample factor: never below 1 (blurry), never above 4 —
// beyond ~1536×864 the per-frame vector fill cost outweighs any visible gain.
export function computeRenderScale(displayScale, pixelRatio) {
  return Math.min(4, Math.max(1, displayScale * (pixelRatio || 1)));
}

// Fractional scales are fine now that the backing store is supersampled to
// match — integer snapping only protected the old 1× nearest-neighbor look,
// at the cost of large black borders on in-between displays.
export function computeDisplayScale(availableWidth, availableHeight, logicalWidth, logicalHeight) {
  return Math.max(.25, Math.min(availableWidth / logicalWidth, availableHeight / logicalHeight));
}
