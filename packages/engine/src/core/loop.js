const DEFAULT_STEP_MS = 1000 / 60;

export function createFixedStepLoop({
  update,
  render,
  scheduler,
  stepMs = DEFAULT_STEP_MS,
  maxFrameMs = 250,
  maxSteps = 8,
} = {}) {
  if (typeof update !== 'function' || typeof render !== 'function') {
    throw new TypeError('FixedStepLoop requires update and render callbacks.');
  }

  const clock = scheduler ?? createManualScheduler();
  let running = false;
  let paused = false;
  let previousTime = null;
  let accumulator = 0;
  let requestId = null;

  const frame = (time) => {
    if (!running) return;
    tick(time);
    requestId = clock.request(frame);
  };

  function tick(time) {
    if (previousTime === null) {
      previousTime = time;
      render(0);
      return { steps: 0, alpha: 0 };
    }

    const frameTime = Math.min(maxFrameMs, Math.max(0, time - previousTime));
    previousTime = time;
    if (paused) {
      accumulator = 0;
      render(0);
      return { steps: 0, alpha: 0 };
    }

    accumulator += frameTime;
    let steps = 0;
    while (accumulator >= stepMs && steps < maxSteps) {
      update(stepMs / 1000);
      accumulator -= stepMs;
      steps += 1;
    }

    if (steps === maxSteps && accumulator >= stepMs) {
      accumulator %= stepMs;
    }

    const alpha = accumulator / stepMs;
    render(alpha);
    return { steps, alpha };
  }

  return {
    start() {
      if (running) return false;
      running = true;
      previousTime = null;
      accumulator = 0;
      requestId = clock.request(frame);
      return true;
    },
    stop() {
      if (!running) return false;
      running = false;
      if (requestId !== null) clock.cancel(requestId);
      requestId = null;
      previousTime = null;
      accumulator = 0;
      return true;
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
      previousTime = null;
      accumulator = 0;
    },
    tick,
    get running() {
      return running;
    },
    get paused() {
      return paused;
    },
    get stepSeconds() {
      return stepMs / 1000;
    },
  };
}

function createManualScheduler() {
  let id = 0;
  return {
    request() {
      id += 1;
      return id;
    },
    cancel() {},
  };
}
