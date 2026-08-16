import { resolveConfig } from './config.js';
import { createGameRuntime } from '../runtime/game-runtime.js';
import { AudioSystem, LocalStorageBackend, MusicState, WebAudioBackend } from '@eldric/engine';
import { mountMobileControls } from '../ui/mobile-controls.js';

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
  const scale = Math.max(1, Math.floor(Math.min(
    availableWidth / config.logicalWidth,
    availableHeight / config.logicalHeight,
  )));
  canvas.style.width = `${config.logicalWidth * scale}px`;
  canvas.style.height = `${config.logicalHeight * scale}px`;
}
