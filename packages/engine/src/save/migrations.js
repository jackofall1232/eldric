import { SAVE_SCHEMA_VERSION, createSave } from './schema.js';

export function migrateSave(value) {
  if (!value || typeof value !== 'object') return null;
  const version = Number(value.schema_version) || 0;
  if (version > SAVE_SCHEMA_VERSION) throw new RangeError('This save was created by a newer Eldric version.');
  let save = { ...value };
  if (version === 0) save = createSave({ ...save, chronicle: save.chronicle ?? [], discoveries: save.discoveries ?? [] });
  return save;
}
