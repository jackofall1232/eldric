import { OBJECTIVE_TYPES } from './objectives.js';

const ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;
export function compileQuest(definition) {
  if (!plain(definition) || !ID.test(definition.id) || typeof definition.title !== 'string' || !Array.isArray(definition.objectives) || !definition.objectives.length || definition.objectives.length > 16) throw new TypeError('Quest definition is invalid.');
  return Object.seal({ id: definition.id, title: definition.title.slice(0, 120), description: String(definition.description ?? '').slice(0, 500), status: 'active', activeIndex: 0, objectives: definition.objectives.map(compileObjective) });
}
function compileObjective(value, index) {
  if (!plain(value) || !OBJECTIVE_TYPES.has(value.type) || !ID.test(value.target)) throw new TypeError(`Quest objective ${index} is unsupported.`);
  const quantity = Math.max(1, Math.min(999, Math.floor(Number(value.quantity) || 1)));
  return Object.seal({ type: value.type, target: value.target, text: String(value.text ?? '').slice(0, 240), quantity, progress: 0, status: 'pending' });
}
function plain(value) { return value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
