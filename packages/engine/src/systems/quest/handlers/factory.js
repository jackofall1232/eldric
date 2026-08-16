import { OBJECTIVE_EVENTS } from '../objectives.js';
export function createObjectiveHandler(type) { return (objective, event) => event.type === OBJECTIVE_EVENTS[type] && event.target === objective.target; }
