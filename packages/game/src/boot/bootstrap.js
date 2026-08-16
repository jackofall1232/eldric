import { resolveConfig } from './config.js';

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
  drawBootPlate(canvas, config);

  const abortController = new AbortController();
  const resize = () => resizeCanvasDisplay(root, canvas, config);
  root.ownerDocument.defaultView?.addEventListener('resize', resize, {
    signal: abortController.signal,
  });
  resize();
  canvas.focus({ preventScroll: true });

  return {
    root,
    canvas,
    config,
    destroy() {
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

function drawBootPlate(canvas, config) {
  const context = canvas.getContext('2d');
  if (!context) return;

  context.imageSmoothingEnabled = false;
  context.fillStyle = '#111817';
  context.fillRect(0, 0, config.logicalWidth, config.logicalHeight);

  const glow = context.createRadialGradient(
    config.logicalWidth / 2,
    config.logicalHeight * 0.72,
    2,
    config.logicalWidth / 2,
    config.logicalHeight * 0.72,
    config.logicalHeight * 0.5,
  );
  glow.addColorStop(0, 'rgba(227, 139, 69, 0.42)');
  glow.addColorStop(1, 'rgba(17, 24, 23, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, config.logicalWidth, config.logicalHeight);

  context.textAlign = 'center';
  context.fillStyle = '#e8d2a2';
  context.font = '600 12px Georgia, serif';
  context.fillText('ELDRIC', config.logicalWidth / 2, config.logicalHeight * 0.43);
  context.fillStyle = '#b6a580';
  context.font = 'italic 7px Georgia, serif';
  context.fillText('The Living Chronicle', config.logicalWidth / 2, config.logicalHeight * 0.53);
}
