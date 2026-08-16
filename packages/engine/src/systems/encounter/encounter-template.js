const ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;
export class EncounterTemplate {
  constructor({ id, variables = {}, build }) { if (!ID.test(id) || typeof build !== 'function') throw new TypeError('Invalid encounter template.'); this.id = id; this.variables = variables; this.build = build; }
  instantiate(values = {}) { const safe = {}; for (const [name, allowed] of Object.entries(this.variables)) { const value = values[name] ?? allowed[0]; if (!allowed.includes(value)) throw new RangeError(`Unsupported encounter variable: ${name}`); safe[name] = value; } return Object.freeze({ template_id: this.id, variables: Object.freeze(safe), ...this.build(safe) }); }
}
