import { Action } from './actions.js';

export const DEFAULT_KEY_BINDINGS = Object.freeze({
  KeyW: Action.MOVE_UP, ArrowUp: Action.MOVE_UP,
  KeyS: Action.MOVE_DOWN, ArrowDown: Action.MOVE_DOWN,
  KeyA: Action.MOVE_LEFT, ArrowLeft: Action.MOVE_LEFT,
  KeyD: Action.MOVE_RIGHT, ArrowRight: Action.MOVE_RIGHT,
  ShiftLeft: Action.RUN, ShiftRight: Action.RUN,
  KeyJ: Action.ATTACK, KeyK: Action.HEAVY, KeyL: Action.BLOCK,
  Space: Action.DODGE, KeyE: Action.INTERACT, KeyI: Action.INVENTORY,
  Escape: Action.MENU, Tab: Action.CHRONICLE,
});

export function mergeBindings(custom = {}) {
  return Object.freeze({ ...DEFAULT_KEY_BINDINGS, ...custom });
}
