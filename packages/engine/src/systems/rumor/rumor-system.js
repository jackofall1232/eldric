export class RumorSystem {
  constructor() { this.rumors = []; }
  fromEvent(event, variants) { const created = ['true', 'exaggerated', 'false'].map((truth) => Object.freeze({ id: `${event.id}_${truth}`, event_id: event.id, truth, text: interpolate(variants[truth], event), distance: 0 })); this.rumors.push(...created); return created; }
  available(settlement) { return this.rumors.filter((rumor) => !rumor.settlement || rumor.settlement === settlement); }
}
function interpolate(template = '', values) { return template.replace(/\{([a-z_]+)\}/g, (_, key) => String(values[key] ?? 'someone')); }
