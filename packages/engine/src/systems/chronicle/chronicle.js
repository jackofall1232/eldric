const CATEGORIES = new Set(['character', 'place', 'decision', 'enemy', 'legend', 'quest', 'artifact', 'rumor']);
export class Chronicle {
  constructor(initial = []) { this.events = new Set(); this.entries = []; for (const entry of initial) this.append(entry); }
  record(eventKey) { const added = !this.events.has(eventKey); this.events.add(eventKey); return added; }
  has(eventKey) { return this.events.has(eventKey); }
  append(entry) { if (!entry?.event_key || !CATEGORIES.has(entry.category) || typeof entry.text !== 'string') throw new TypeError('Invalid Chronicle entry.'); if (!this.record(entry.event_key)) return false; this.entries.push(Object.freeze({ event_key: entry.event_key, category: entry.category, title: String(entry.title ?? '').slice(0, 120), text: entry.text.slice(0, 1200), at: entry.at ?? this.entries.length })); return true; }
  recent(limit = 20) { return this.entries.slice(-limit); }
  serialize() { return { events: [...this.events], entries: this.entries }; }
}
