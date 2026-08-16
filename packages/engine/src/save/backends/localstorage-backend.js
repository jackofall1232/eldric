import { MemoryStorageBackend } from './memory-backend.js';
import { StorageAdapter } from './storage-adapter.js';

export class LocalStorageBackend extends StorageAdapter {
  constructor(storage, key, fallback = new MemoryStorageBackend()) {
    super(); this.storage = storage; this.key = key; this.fallback = fallback; this.degraded = false;
  }
  load() {
    if (this.degraded) return this.fallback.load();
    try { const value = this.storage.getItem(this.key); return value ? JSON.parse(value) : null; }
    catch { this.degraded = true; return this.fallback.load(); }
  }
  save(value) {
    if (this.degraded) return this.fallback.save(value);
    try { this.storage.setItem(this.key, JSON.stringify(value)); return true; }
    catch { this.degraded = true; return this.fallback.save(value); }
  }
  delete() {
    if (this.degraded) return this.fallback.delete();
    try { this.storage.removeItem(this.key); return true; }
    catch { this.degraded = true; return this.fallback.delete(); }
  }
}
