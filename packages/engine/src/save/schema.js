export const SAVE_SCHEMA_VERSION = 1;

export function createSave(data = {}) {
  return { schema_version: SAVE_SCHEMA_VERSION, saved_at: new Date().toISOString(), ...data };
}
