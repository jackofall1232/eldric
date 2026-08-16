import { createFixedStepLoop } from './core/loop.js';
import { EventBus } from './core/events.js';
import { GameTime } from './core/time.js';
import { SceneManager } from './scene/scene-manager.js';

export function createEngine({ platform, renderer, systems = [] } = {}) {
  if (!platform?.scheduler) throw new TypeError('Engine requires a platform scheduler.');
  const events = new EventBus();
  const time = new GameTime();
  const scenes = new SceneManager();
  let initialized = false;
  let disposed = false;

  const context = { platform, renderer, events, time, scenes, systems };
  const loop = createFixedStepLoop({
    scheduler: platform.scheduler,
    update(deltaSeconds) {
      const delta = time.advance(deltaSeconds);
      platform.input?.update?.();
      for (const system of systems) system.update?.(delta, context);
      scenes.update(delta);
    },
    render(alpha) {
      renderer?.begin?.();
      scenes.render(renderer, alpha);
      renderer?.end?.();
    },
  });

  return {
    ...context,
    loop,
    async init() {
      if (initialized) return false;
      if (disposed) throw new Error('Cannot initialize a disposed engine.');
      await platform.init?.(context);
      for (const system of systems) await system.init?.(context);
      initialized = true;
      events.emit('engine:ready', context);
      return true;
    },
    start() {
      if (!initialized) throw new Error('Engine must be initialized before starting.');
      return loop.start();
    },
    stop() {
      return loop.stop();
    },
    async dispose() {
      if (disposed) return false;
      loop.stop();
      scenes.clear();
      for (const system of [...systems].reverse()) await system.dispose?.(context);
      await platform.dispose?.(context);
      events.clear();
      disposed = true;
      return true;
    },
  };
}
