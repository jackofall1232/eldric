import { StorageAdapter } from './storage-adapter.js';

export class MemoryStorageBackend extends StorageAdapter {
  constructor(initialValue = null) { super(); this.value = initialValue; }
  load() { return structuredCloneSafe(this.value); }
  save(value) { this.value = structuredCloneSafe(value); return true; }
  delete() { this.value = null; return true; }
}

function structuredCloneSafe(value) {
  return value === null ? null : JSON.parse(JSON.stringify(value));
}
