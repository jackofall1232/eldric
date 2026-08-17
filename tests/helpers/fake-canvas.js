// Headless canvas double for renderer tests.
//
// Enough of a canvas, document and window for `createGameRuntime` to boot and
// run its real frame loop under Node, so playthrough regressions can be tested
// against the runtime itself rather than against a re-implementation of it.
// Draw calls go nowhere; the point is the simulation underneath them.

function drawingContext() {
  const gradient = { addColorStop() {} };
  const stub = {
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  };
  // Canvas2D is a wide API and the art module reaches for a lot of it; anything
  // not stubbed above is a no-op rather than a crash.
  return new Proxy(stub, {
    get: (target, key) => (key in target ? target[key] : () => undefined),
    set: (target, key, value) => { target[key] = value; return true; },
  });
}

export function createFakeCanvas({ width = 384, height = 216 } = {}) {
  const listeners = new Map();
  let pending = [];
  const view = {
    requestAnimationFrame(callback) { pending.push(callback); return pending.length; },
    cancelAnimationFrame() {},
    matchMedia: () => ({ matches: false }),
  };
  const canvas = {
    width, height, style: {},
    ownerDocument: { defaultView: view },
    getContext: () => drawingContext(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      listeners.set(type, (listeners.get(type) ?? []).filter((entry) => entry !== handler));
    },
  };
  let now = 0;
  return {
    canvas,
    /** Dispatch a DOM event the runtime's input sources listen for. */
    fire(type, code) { for (const handler of listeners.get(type) ?? []) handler({ code, preventDefault() {} }); },
    /** Run `count` frames of the runtime's real loop at a fixed 60Hz. */
    frames(count = 1) {
      for (let index = 0; index < count; index += 1) {
        now += 1000 / 60;
        const due = pending;
        pending = [];
        for (const callback of due) callback(now);
      }
    },
  };
}

/** A canvas double plus the in-memory save slot the runtime persists into. */
export function createFakeHost(options) {
  const host = createFakeCanvas(options);
  let saved = null;
  return {
    ...host,
    storage: { load: () => saved, save: (data) => { saved = data; } },
    get saved() { return saved; },
  };
}

// `navigator` is read by the platform's capability probe and gamepad source.
export function installFakeNavigator() {
  Object.defineProperty(globalThis, 'navigator', {
    value: { deviceMemory: 8, maxTouchPoints: 0, getGamepads: () => [] },
    configurable: true,
  });
}
