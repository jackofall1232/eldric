export class StorageAdapter {
  load() { throw new Error('StorageAdapter.load must be implemented.'); }
  save() { throw new Error('StorageAdapter.save must be implemented.'); }
  delete() { throw new Error('StorageAdapter.delete must be implemented.'); }
}
