export function createFakeScheduler() {
  let nextId = 1;
  const callbacks = new Map();

  return {
    request(callback) {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, callback);
      return id;
    },
    cancel(id) {
      callbacks.delete(id);
    },
    frame(time) {
      const pending = [...callbacks.values()];
      callbacks.clear();
      for (const callback of pending) callback(time);
    },
    get pending() {
      return callbacks.size;
    },
  };
}
