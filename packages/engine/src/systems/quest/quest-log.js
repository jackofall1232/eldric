export class QuestLog {
  #quests = new Map();
  add(quest) { if (this.#quests.has(quest.id)) return false; quest.objectives[0].status = 'active'; this.#quests.set(quest.id, quest); return true; }
  get(id) { return this.#quests.get(id) ?? null; }
  active() { return [...this.#quests.values()].filter((quest) => quest.status === 'active'); }
  completed() { return [...this.#quests.values()].filter((quest) => quest.status === 'completed'); }
  all() { return [...this.#quests.values()]; }
}
