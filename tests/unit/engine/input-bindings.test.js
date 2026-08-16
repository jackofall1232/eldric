import assert from 'node:assert/strict';
import test from 'node:test';
import { Action } from '../../../packages/engine/src/input/actions.js';
import { InputManager } from '../../../packages/engine/src/input/input.js';
import { TouchSource } from '../../../packages/engine/src/input/sources/touch.js';

test('input manager exposes normalized movement and edge states', () => {
  const touch = new TouchSource();
  const input = new InputManager([touch]);
  touch.setMovement(1, 1);
  touch.setAction(Action.ATTACK, true);
  input.update();
  assert.equal(input.pressed(Action.ATTACK), true);
  assert.ok(Math.abs(input.movement().x - Math.SQRT1_2) < 1e-9);
  input.update();
  assert.equal(input.pressed(Action.ATTACK), false);
  assert.equal(input.down(Action.ATTACK), true);
  touch.setAction(Action.ATTACK, false);
  input.update();
  assert.equal(input.released(Action.ATTACK), true);
});
