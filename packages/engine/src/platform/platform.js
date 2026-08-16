export function createPlatform(services) {
  if (!services?.scheduler || !services?.input) {
    throw new TypeError('Platform requires scheduler and input services.');
  }
  return Object.freeze({
    audio: null,
    storage: null,
    transport: null,
    capabilities: {},
    ...services,
    async init() {
      await services.input.init?.();
      await services.audio?.init?.();
    },
    async dispose() {
      services.input.dispose?.();
      await services.audio?.dispose?.();
    },
  });
}
