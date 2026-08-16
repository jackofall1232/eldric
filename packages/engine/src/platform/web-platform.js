import { InputManager } from '../input/input.js';
import { KeyboardSource } from '../input/sources/keyboard.js';
import { PointerSource } from '../input/sources/mouse.js';
import { TouchSource } from '../input/sources/touch.js';
import { GamepadSource } from '../input/sources/gamepad.js';
import { capabilityProfile } from './capabilities.js';
import { createPlatform } from './platform.js';

export function createWebPlatform(canvas, services = {}) {
  const touchSource = new TouchSource();
  const input = new InputManager([
    new KeyboardSource(canvas),
    new PointerSource(canvas),
    touchSource,
    new GamepadSource(),
  ]);
  const view = canvas.ownerDocument.defaultView;
  return createPlatform({
    ...services,
    input,
    touchSource,
    scheduler: {
      request: (callback) => view.requestAnimationFrame(callback),
      cancel: (id) => view.cancelAnimationFrame(id),
    },
    capabilities: capabilityProfile({
      deviceMemory: navigator.deviceMemory,
      touch: navigator.maxTouchPoints > 0,
      reducedMotion: view.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    }),
  });
}
