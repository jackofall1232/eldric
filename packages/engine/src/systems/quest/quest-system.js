import { compileQuest } from './quest-compiler.js';
import { QuestLog } from './quest-log.js';
import { OBJECTIVE_EVENTS } from './objectives.js';

export class QuestSystem {
  constructor(log = new QuestLog()) { this.log = log; }
  add(definition) { const quest = compileQuest(definition); this.log.add(quest); return quest; }
  handle(event) {
    const changed = [];
    for (const quest of this.log.active()) {
      const objective = quest.objectives[quest.activeIndex];
      if (!objective || event.type !== OBJECTIVE_EVENTS[objective.type] || event.target !== objective.target) continue;
      objective.progress = Math.min(objective.quantity, objective.progress + Math.max(1, Math.floor(event.amount ?? 1)));
      if (objective.progress >= objective.quantity && event.success !== false) {
        objective.status = 'completed'; quest.activeIndex += 1;
        if (quest.activeIndex >= quest.objectives.length) quest.status = 'completed';
        else quest.objectives[quest.activeIndex].status = 'active';
      }
      changed.push(quest);
    }
    return changed;
  }
}
