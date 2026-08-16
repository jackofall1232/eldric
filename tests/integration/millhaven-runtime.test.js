import assert from 'node:assert/strict';
import test from 'node:test';
import { createFakeHost, installFakeNavigator } from '../helpers/fake-canvas.js';

installFakeNavigator();
const { createGameRuntime } = await import('../../packages/game/src/runtime/game-runtime.js');
const { RUNE_SEAL } = await import('../../packages/game/src/content/world/millhaven.js');

const STONES = { crown: [1070, 690], river: [1130, 625], root: [1220, 720] };

function begin() {
  const host = createFakeHost();
  const game = createGameRuntime(host.canvas, {
    logicalWidth: 384, logicalHeight: 216, openingSeen: true,
    storage: host.storage, audio: null, aiEnabled: false,
  }, () => {});
  game.start();

  const put = (x, y) => { Object.assign(game.player, { x, y, previousX: x, previousY: y }); };
  const tap = (code) => { host.fire('keydown', code); host.frames(1); host.fire('keyup', code); host.frames(1); };
  const use = (x, y) => { put(x, y); host.frames(2); tap('KeyE'); };
  // Walk the authored critical path up to the open Gloam Gate.
  const toTheGate = () => {
    use(255, 330); tap('KeyE'); tap('KeyE');       // Elara
    use(548, 365); use(785, 460);                   // wagon, river tracks
    use(1160, 210);                                 // reliquary — the River Key
    use(1100, 610);                                 // the Gloam Gate
  };
  return { game, host, put, tap, use, toTheGate, touch: (name) => use(...STONES[name]) };
}

test('the river seal restates the order it wants every time it turns the player away', () => {
  const { game, touch, toTheGate } = begin();
  toTheGate();
  assert.match(game.state.toast, new RegExp(RUNE_SEAL.hint), 'the gate must state the order');

  // The stones stand crown, river, root west to east, so left-to-right is the
  // reading a player arrives at first — and it is wrong.
  touch('crown');
  assert.equal(game.state.runesSolved, false);
  assert.match(game.state.toast, new RegExp(RUNE_SEAL.hint), 'a rejection must repeat the order');

  for (const stone of ['river', 'crown', 'root']) touch(stone);
  assert.equal(game.state.runesSolved, true);
  assert.equal(game.state.bossAwake, true);
});

test('killing the boss does not answer Corven with the same key that killed him', () => {
  const { game, host, put, toTheGate, touch } = begin();
  toTheGate();
  for (const stone of ['river', 'crown', 'root']) touch(stone);
  game.player.maxHealth = 1e6; game.player.health = 1e6;

  // A player finishing a boss fight is mashing attack. That must not decide the
  // slice's one irreversible choice for them.
  for (let swing = 0; swing < 400 && !game.state.outcome; swing += 1) {
    if (game.state.dialogue !== 'decision') { put(1160, 685); game.player.stamina = 100; }
    host.fire('keydown', 'KeyJ'); host.frames(1); host.fire('keyup', 'KeyJ'); host.frames(1);
  }
  assert.equal(game.state.dialogue, 'decision', 'the boss should be dead and the choice on screen');
  assert.equal(game.state.outcome, null, 'mashing attack must never resolve the choice');

  host.frames(60);                                  // the player stops, reads, decides
  host.fire('keydown', 'KeyK'); host.frames(1); host.fire('keyup', 'KeyK'); host.frames(1);
  assert.equal(game.state.outcome, 'bind');
  assert.equal(game.state.quest, 8);
});

test('the first rest after the decision closes the chapter instead of passing as an ordinary rest', () => {
  const { game, host, put, use, toTheGate, touch } = begin();
  toTheGate();
  for (const stone of ['river', 'crown', 'root']) touch(stone);
  game.player.maxHealth = 1e6; game.player.health = 1e6;
  for (let swing = 0; swing < 400 && game.state.dialogue !== 'decision'; swing += 1) {
    put(1160, 685); game.player.stamina = 100;
    host.fire('keydown', 'KeyJ'); host.frames(1); host.fire('keyup', 'KeyJ'); host.frames(1);
  }
  host.frames(150);                                 // past the hold, hands off the keys
  host.fire('keydown', 'KeyJ'); host.frames(1); host.fire('keyup', 'KeyJ'); host.frames(1);
  assert.equal(game.state.outcome, 'release');

  use(258, 390);                                    // the village campfire
  assert.equal(game.state.quest, 9);
  assert.match(game.state.toast, /Chapter one closes/);
  assert.ok(game.state.chronicle.some((entry) => /Chapter one closes/.test(entry)));
  assert.ok(host.saved.discoveries.includes('chapter_one_closed'), 'the ending must survive a reload');

  // Resting again is an ordinary rest; the ending fires once.
  use(258, 390);
  assert.match(game.state.toast, /Rested/);
  assert.equal(game.state.chronicle.filter((entry) => /Chapter one closes/.test(entry)).length, 1);
});
