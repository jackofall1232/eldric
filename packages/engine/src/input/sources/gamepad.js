import { Action } from '../actions.js';

export class GamepadSource {
  constructor(provider = () => navigator.getGamepads?.()[0]) {
    this.provider = provider;
  }
  poll() {
    const pad = this.provider();
    if (!pad) return {};
    const down = new Set();
    if (pad.buttons[0]?.pressed) down.add(Action.ATTACK);
    if (pad.buttons[1]?.pressed) down.add(Action.DODGE);
    if (pad.buttons[2]?.pressed) down.add(Action.INTERACT);
    if (pad.buttons[3]?.pressed) down.add(Action.HEAVY);
    if (pad.buttons[4]?.pressed) down.add(Action.BLOCK);
    if (pad.buttons[9]?.pressed) down.add(Action.MENU);
    return {
      down,
      moveX: Math.abs(pad.axes[0] ?? 0) > 0.18 ? pad.axes[0] : 0,
      moveY: Math.abs(pad.axes[1] ?? 0) > 0.18 ? pad.axes[1] : 0,
    };
  }
}
