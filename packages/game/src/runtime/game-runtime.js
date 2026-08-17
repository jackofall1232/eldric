import {
  Action, Camera, Canvas2DBackend, Renderer, SeededRng,
  StorySystem, buildStoryContext, createNarrativeState, createWebPlatform,
} from '@eldric/engine';
import { DIALOGUE, ENEMY_SPAWNS, INTERACTABLES, OBSTACLES, RUNE_SEAL, TREE_CLUMPS, WORLD, ZONES } from '../content/world/millhaven.js';
import { createStoryProvider } from '../story/create-provider.js';
import {
  PALETTE, createArtCache, drawChronicle, drawDialogue, drawHud, drawInterior,
  drawInventory, drawOpening, drawWorld,
} from '../render/art.js';

export function createGameRuntime(canvas, config, onStatus = () => {}) {
  const platform = createWebPlatform(canvas, { storage: config.storage, audio: config.audio });
  // All layout math runs in the fixed logical space; the canvas element itself
  // may carry a supersampled physical resolution for crisp rasterization.
  const viewport = { width: config.logicalWidth ?? canvas.width, height: config.logicalHeight ?? canvas.height };
  const renderer = new Renderer(new Canvas2DBackend(canvas, { logicalWidth: viewport.width, logicalHeight: viewport.height }));
  const camera = new Camera({ width: viewport.width, height: viewport.height, x: 270, y: 375, smoothing: 9 });
  camera.setBounds({ x: 0, y: 0, ...WORLD });
  const rng = new SeededRng('eldric-millhaven-v1');
  const player = { x: 250, y: 370, previousX: 250, previousY: 370, facingX: 1, facingY: 0,
    health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, state: 'idle', timer: 0,
    invulnerable: 0, attackId: 0, stepTimer: 0 };
  const enemies = ENEMY_SPAWNS.map(createEnemy);
  const saved = platform.storage?.load?.() ?? null;
  if (saved?.player) Object.assign(player, saved.player);
  const state = {
    mode: config.openingSeen ? 'world' : 'opening', openingTime: 0, running: false,
    dialogue: null, dialogueIndex: 0, quest: 0, discoveries: new Set(), chronicle: [],
    rumor: 'Something claws at travelers beneath Blackwater Bridge.', toast: '', toastTime: 0,
    zone: 'millhaven', hour: 17.5, weather: 'leaves', outcome: null, bossAwake: false,
    gloamOpen: false, runesSolved: false, runeSequence: [], decisionLock: 0, decisionArmed: 0,
    interior: null, interiorX: 192, interiorY: 170,
    inventory: ['Millhaven Sword', 'Traveler’s Tonic'], clock: 0,
  };
  if (saved) {
    state.mode = saved.openingSeen ? 'world' : state.mode;
    state.quest = saved.quest ?? state.quest;
    state.discoveries = new Set(saved.discoveries ?? []);
    state.chronicle = saved.chronicle ?? [];
    state.rumor = saved.rumor ?? state.rumor;
    state.outcome = saved.outcome ?? null;
    state.bossAwake = saved.bossAwake ?? false;
    state.gloamOpen = saved.gloamOpen ?? state.bossAwake;
    state.runesSolved = saved.runesSolved ?? state.bossAwake;
    state.inventory = saved.inventory ?? state.inventory;
  }
  const storyState = createNarrativeState();
  const storyteller = new StorySystem({ provider: createStoryProvider(config), state: storyState });
  storyteller.subscribe((pending) => { state.storyPending = pending; });
  let previousTime = null;
  let accumulator = 0;
  let requestId = 0;
  const particles = Array.from({ length: platform.capabilities.particleBudget }, (_, index) => ({
    x: rng.int(0, viewport.width), y: rng.int(0, viewport.height), phase: index * 0.73,
  }));

  function frame(time) {
    if (!state.running) return;
    if (previousTime === null) previousTime = time;
    accumulator += Math.min(100, time - previousTime);
    previousTime = time;
    // Poll input per simulation tick, not per render frame: on high-refresh
    // displays a render frame may run zero ticks, and polling there would
    // consume tap latches before the simulation could observe them.
    while (accumulator >= 1000 / 60) {
      platform.input.update();
      update(1 / 60);
      accumulator -= 1000 / 60;
    }
    render(accumulator / (1000 / 60));
    requestId = platform.scheduler.request(frame);
  }

  function update(delta) {
    state.clock += delta;
    state.toastTime = Math.max(0, state.toastTime - delta);
    if (state.mode === 'opening') return updateOpening(delta);
    if (state.mode === 'chronicle' || state.mode === 'inventory') {
      if (platform.input.pressed(Action.CHRONICLE) || platform.input.pressed(Action.INVENTORY) || platform.input.pressed(Action.MENU)) state.mode = 'world';
      return;
    }
    if (state.mode === 'interior') return updateInterior(delta);
    if (state.dialogue) return updateDialogue(delta);
    if (platform.input.pressed(Action.CHRONICLE)) { state.mode = 'chronicle'; return; }
    if (platform.input.pressed(Action.INVENTORY)) { state.mode = 'inventory'; return; }
    updatePlayer(delta);
    updateEnemies(delta);
    state.hour = (state.hour + delta * 0.015) % 24;
    camera.follow(player, delta);
    camera.update(delta);
    updateZone();
  }

  function updateOpening(delta) {
    state.openingTime += delta;
    const skip = platform.input.pressed(Action.ATTACK) || platform.input.pressed(Action.INTERACT)
      || platform.input.movement().x || platform.input.movement().y;
    if (state.openingTime >= 7.2 || (skip && state.openingTime > 3.8)) {
      state.mode = 'world';
      toast('The road to Millhaven lies ahead.');
      onStatus('You have entered Millhaven.');
      persist();
      requestStory('REGION_ENTERED');
    }
  }

  function updateInterior(delta) {
    const movement = platform.input.movement();
    const speed = platform.input.down(Action.RUN) ? 105 : 72;
    state.interiorX = clamp(state.interiorX + movement.x * speed * delta, 58, 326);
    state.interiorY = clamp(state.interiorY + movement.y * speed * delta, 52, 184);
    if (platform.input.pressed(Action.MENU) || (platform.input.pressed(Action.INTERACT) && state.interiorY > 158)) {
      state.mode = 'world'; state.interior = null; toast('The village air meets you again.'); return;
    }
    if (platform.input.pressed(Action.INTERACT) && state.interiorY < 105) {
      toast(state.interior === 'tavern' ? state.rumor : interiorDetail(state.interior));
    }
  }

  function updatePlayer(delta) {
    player.previousX = player.x; player.previousY = player.y;
    player.timer = Math.max(0, player.timer - delta);
    player.invulnerable = Math.max(0, player.invulnerable - delta);
    player.stamina = Math.min(player.maxStamina, player.stamina + 24 * delta);
    player.stepTimer = Math.max(0, player.stepTimer - delta);
    if (player.timer <= 0 && ['attack', 'heavy', 'dodge', 'hurt'].includes(player.state)) player.state = 'idle';

    if (platform.input.pressed(Action.ATTACK) && player.stamina >= 10) startAttack('attack', 0.34, 10, 22, 42);
    else if (platform.input.pressed(Action.HEAVY) && player.stamina >= 25) startAttack('heavy', 0.64, 25, 40, 54);
    else if (platform.input.pressed(Action.DODGE) && player.stamina >= 22) {
      player.state = 'dodge'; player.timer = 0.28; player.invulnerable = 0.24; player.stamina -= 22;
    }

    const movement = platform.input.movement();
    if (movement.x || movement.y) { player.facingX = movement.x; player.facingY = movement.y; }
    if (!['attack', 'heavy', 'hurt'].includes(player.state)) {
      const running = platform.input.down(Action.RUN) && player.stamina > 2;
      const speed = player.state === 'dodge' ? 205 : running ? 120 : 78;
      if (running) player.stamina -= 15 * delta;
      if ((movement.x || movement.y) && player.stepTimer <= 0) { platform.audio?.play?.('footstep', { bus: 'sfx', volume: running ? .12 : .08 }); player.stepTimer = running ? .2 : .32; }
      const nextX = player.x + movement.x * speed * delta;
      const nextY = player.y + movement.y * speed * delta;
      if (!collides(nextX, player.y)) player.x = clamp(nextX, 12, WORLD.width - 12);
      if (!collides(player.x, nextY)) player.y = clamp(nextY, 12, WORLD.height - 12);
      if (player.state !== 'dodge') player.state = movement.x || movement.y ? running ? 'run' : 'walk' : 'idle';
    }
    if (platform.input.down(Action.BLOCK) && player.state === 'idle' && player.stamina > 0) player.state = 'block';
    if (player.state === 'block') player.stamina = Math.max(0, player.stamina - 10 * delta);
    if (platform.input.pressed(Action.INTERACT)) interact();
  }

  function startAttack(kind, duration, cost, damage, reach) {
    platform.audio?.play?.('sword', { bus: 'sfx', volume: kind === 'heavy' ? .48 : .32 });
    player.state = kind; player.timer = duration; player.stamina -= cost; player.attackId += 1;
    const cx = player.x + player.facingX * reach * 0.65;
    const cy = player.y + player.facingY * reach * 0.65;
    for (const enemy of enemies) {
      if (!enemy.alive || enemy.lastHit === player.attackId || distance(cx, cy, enemy.x, enemy.y) > reach) continue;
      enemy.lastHit = player.attackId;
      const guardedDamage = enemy.kind === 'armored_knight' && kind !== 'heavy' ? 4 : damage;
      enemy.health -= guardedDamage; enemy.flash = 0.12;
      enemy.x += player.facingX * 14; enemy.y += player.facingY * 14;
      camera.shake(kind === 'heavy' ? 4 : 2, 0.1);
      if (enemy.health <= 0) defeatEnemy(enemy);
    }
  }

  function updateEnemies(delta) {
    for (const enemy of enemies) {
      if (!enemy.alive) {
        if (enemy.reassemble > 0) {
          enemy.reassemble -= delta;
          if (enemy.reassemble <= 0) {
            enemy.alive = true; enemy.reassembled = true; enemy.health = Math.ceil(enemy.maxHealth * 0.45);
            toast('Behind you, old bones remember their oath.');
          }
        }
        continue;
      }
      if (enemy.kind === 'boss' && !state.bossAwake) continue;
      enemy.cooldown = Math.max(0, enemy.cooldown - delta); enemy.flash = Math.max(0, enemy.flash - delta);
      const d = distance(player.x, player.y, enemy.x, enemy.y);
      if (d > enemy.aggro || d < 1) continue;
      const dx = (player.x - enemy.x) / d; const dy = (player.y - enemy.y) / d;
      const healthRatio = enemy.health / enemy.maxHealth;
      if (enemy.kind === 'forest_creature' && !enemy.revealed && d > 62) continue;
      if (enemy.kind === 'forest_creature') enemy.revealed = true;
      if (enemy.kind === 'bandit' && healthRatio < 0.2) {
        enemy.x -= dx * enemy.speed * 1.4 * delta; enemy.y -= dy * enemy.speed * 1.4 * delta;
        continue;
      }
      if (enemy.kind === 'boss') {
        enemy.bossPhase = healthRatio > .66 ? 1 : healthRatio > .33 ? 2 : 3;
        enemy.reach = enemy.bossPhase === 3 ? 92 : enemy.bossPhase === 2 ? 74 : 62;
        enemy.damage = enemy.bossPhase === 3 ? 42 : enemy.bossPhase === 2 ? 37 : 34;
      }
      if (enemy.kind === 'miniboss') {
        const charging = enemy.attackStep % 2 === 0;
        enemy.reach = charging ? 46 : 72;
        enemy.speed = charging ? 76 : 38;
      }
      if (enemy.telegraph > 0) {
        enemy.telegraph -= delta;
        if (enemy.telegraph <= 0 && d < enemy.reach + 12) hurtPlayer(enemy.damage, dx, dy);
      } else if (enemy.cooldown <= 0 && d < enemy.reach) {
        enemy.telegraph = enemy.kind === 'boss' ? Math.max(.38, .78 - enemy.bossPhase * .1) : enemy.kind === 'dungeon_creature' ? .7 : .46;
        enemy.cooldown = enemy.kind === 'boss' ? Math.max(.72, 1.35 - enemy.bossPhase * .17) : 1.5;
        enemy.attackStep += 1;
      } else {
        const orbit = enemy.kind === 'wolf' ? Math.sin(enemy.phase += delta * 3) * 0.55 : enemy.kind === 'dungeon_creature' ? Math.sin(enemy.phase += delta * 2) * 0.35 : 0;
        enemy.x += (dx - dy * orbit) * enemy.speed * delta; enemy.y += (dy + dx * orbit) * enemy.speed * delta;
      }
    }
  }

  function hurtPlayer(damage, dx, dy) {
    if (player.invulnerable > 0) return;
    if (player.state === 'block') { player.stamina = Math.max(0, player.stamina - damage); damage *= 0.22; }
    player.health = Math.max(0, player.health - damage); player.state = 'hurt'; player.timer = 0.28;
    platform.audio?.play?.('danger', { bus: 'sfx', volume: .28 });
    player.x -= dx * 16; player.y -= dy * 16; camera.shake(5, 0.16);
    if (player.health <= 0) {
      player.health = player.maxHealth; player.x = 258; player.y = 390; state.zone = 'millhaven';
      toast('The storyteller turns back a blood-darkened page.');
    }
  }

  function defeatEnemy(enemy) {
    enemy.alive = false;
    if (enemy.kind === 'skeleton' && !enemy.reassembled) enemy.reassemble = 3.2;
    if (enemy.kind === 'miniboss') { discover('thornhart_defeated', 'The Thornhart fell guarding a rusted river key.'); state.quest = Math.max(state.quest, 5); }
    if (enemy.kind === 'boss') {
      state.mode = 'decision'; state.dialogue = 'decision'; state.dialogueIndex = 0;
      state.decisionLock = 1.5; state.decisionArmed = 0;
    }
  }

  function updateDialogue(delta) {
    if (state.dialogue === 'decision') {
      // The blow that kills the boss is an attack press, and a player finishing
      // a boss fight is mashing that key. Unguarded, the choice resolved on the
      // very next frame — the slice's one real decision made for the player,
      // off-screen. So the prompt holds for a beat, and then still waits for a
      // press that started after the boss fell.
      state.decisionLock = Math.max(0, state.decisionLock - delta);
      if (state.decisionLock > 0) return;
      // Arm only once both attack keys have been quiet for a moment. A player
      // still mashing releases for a frame between presses, and that gap is not
      // a decision — it would answer Corven the instant the hold expired.
      if (state.decisionArmed >= 0.25) {
        if (platform.input.pressed(Action.ATTACK)) return chooseOutcome('release');
        if (platform.input.pressed(Action.HEAVY)) return chooseOutcome('bind');
      }
      state.decisionArmed = platform.input.down(Action.ATTACK) || platform.input.down(Action.HEAVY)
        ? 0 : state.decisionArmed + delta;
      return;
    }
    if (platform.input.pressed(Action.INTERACT) || platform.input.pressed(Action.ATTACK)) {
      const lines = dialogueLines(state.dialogue);
      state.dialogueIndex += 1;
      if (state.dialogueIndex >= lines.length) {
        if (state.dialogue === 'elara') state.quest = Math.max(state.quest, 1);
        if (state.dialogue === 'mara') discover('mara_clue', 'Mara’s words linger: follow the saint’s gaze to the pale mushrooms.');
        state.dialogue = null; state.dialogueIndex = 0;
      }
    }
  }

  function chooseOutcome(outcome) {
    state.outcome = outcome; state.dialogue = null; state.mode = 'world'; state.quest = 8;
    const entry = outcome === 'release'
      ? 'Beneath Blackwater Bridge, Eldric broke the iron seal and freed Corven Vale from the river’s curse. The flood took the eastern fields.'
      : 'Beneath Blackwater Bridge, Eldric renewed the river seal, saving Millhaven’s harvest while leaving Corven bound to the black water.';
    state.chronicle.push(entry); state.rumor = outcome === 'release'
      ? 'They say Eldric loosed a river demon—and called it mercy.'
      : 'They say Eldric chained a man beneath the bridge so Millhaven might sleep.';
    toast('A new chapter has been written. Millhaven has not heard it yet.'); onStatus(entry);
    persist();
    requestStory('MAJOR_DECISION');
  }

  function interact() {
    const target = nearestInteractable();
    if (!target) return;
    if (target.type === 'npc' || target.type === 'traveler') { state.dialogue = target.id; state.dialogueIndex = 0; return; }
    if (target.type === 'building') { platform.audio?.play?.('door', { bus: 'sfx', volume: .18 }); state.mode = 'interior'; state.interior = target.interior; state.interiorX = 192; state.interiorY = 170; toast(`Entered ${target.name.replace('Enter the ', '')}.`); return; }
    if (target.id === 'campfire') {
      platform.audio?.play?.('fire', { bus: 'ambience', volume: .2 });
      player.health = player.maxHealth; player.stamina = player.maxStamina;
      // The first rest after the decision is the slice's ending. It used to pass
      // as an ordinary rest, and the quest ribbon fell off the end of its own
      // list — so a player who had finished the whole chapter was told nothing,
      // and read the quiet world as a game that had broken.
      if (state.outcome && state.quest < 9) {
        state.quest = 9;
        discover('chapter_one_closed', state.outcome === 'release'
          ? 'Chapter one closes. Corven Vale walks under his own name again, the eastern fields lie drowned, and Millhaven will argue about Eldric for a generation.'
          : 'Chapter one closes. The harvest stands, the river runs quiet, and every night Millhaven pretends not to hear singing beneath the bridge.');
        requestStory('CAMPFIRE_REST'); return;
      }
      const summary = state.discoveries.size
        ? `At Millhaven’s fire, the storyteller recalled ${[...state.discoveries].length} signs Eldric had uncovered along Blackwater Road.`
        : 'At Millhaven’s fire, Eldric rested while an unfinished kingdom waited beyond the sparks.';
      state.chronicle.push(summary); toast('Rested. Chronicle updated.'); persist(); requestStory('CAMPFIRE_REST'); return;
    }
    if (target.id === 'cave-door') {
      if (!state.discoveries.has('ruin-key')) { toast('An iron seal. Its key bears the Broken King’s crown.'); return; }
      platform.audio?.play?.('door', { bus: 'sfx', volume: .3 }); state.gloamOpen = true; state.quest = Math.max(state.quest, 6); discover('gloam_opened', `The Gloam Gate opened. Within, three stones wait — wake them in the river’s order: ${RUNE_SEAL.hint}.`); return;
    }
    if (target.type === 'rune') { touchRune(target.rune); return; }
    if (target.type === 'hidden') { discover('hidden-glade', 'Beyond the pale mushrooms, a moonlit glade concealed the Witchglass Charm.'); if (!state.inventory.includes('Witchglass Charm')) state.inventory.push('Witchglass Charm'); return; }
    if (target.type === 'locked') { if (!state.discoveries.has('ruin-key')) { toast('The cellar lock bears the same broken crown as the eastern ruin.'); return; } discover('locked-cellar', 'The River Key opened the cellar. Inside lay medicine hidden from frightened villagers.'); return; }
    if (target.type === 'chest') { platform.audio?.play?.('treasure', { bus: 'sfx', volume: .24 }); discover(target.id, 'Inside: the River Key and the Broken King’s medallion.'); state.quest = Math.max(state.quest, 4); return; }
    if (target.type === 'secret') { discover(target.id, target.id === 'statue' ? 'The saint points southeast. A hidden trail answers in pale mushrooms.' : 'The hollow rock concealed a traveler’s rain-stained letter: “It spoke Elara’s name.”'); return; }
    discover(target.id, target.id === 'wagon' ? 'The claw marks were carved from inside the wagon.' :
      target.id === 'tracks' ? 'Bare human footprints enter the river. Webbed tracks leave it.' :
        target.id === 'distant-smoke' ? 'A cold camp beyond the trees held food laid out for someone who never returned.' :
        'Under the bridge, iron chains descend toward a sealed cavern.');
    state.quest = Math.max(state.quest, target.id === 'wagon' ? 2 : target.id === 'tracks' ? 3 : state.quest);
  }

  function discover(id, message) {
    if (state.discoveries.has(id)) { toast(message); return; }
    state.discoveries.add(id); state.chronicle.push(message); toast(message); onStatus(message); persist();
  }

  function nearestInteractable() {
    let best = null; let bestDistance = 46;
    for (const target of INTERACTABLES) {
      if (target.type === 'hidden' && !state.discoveries.has('mara_clue')) continue;
      const d = distance(player.x, player.y, target.x, target.y);
      if (d < bestDistance) { best = target; bestDistance = d; }
    }
    return best;
  }

  function touchRune(rune) {
    if (!state.gloamOpen) { toast('The rune is silent beyond the sealed Gloam Gate.'); return; }
    if (state.runesSolved) { toast('The three stones hum in one river-deep chord.'); return; }
    const { order, names, hint } = RUNE_SEAL;
    const expected = order[state.runeSequence.length];
    if (rune !== expected) {
      // Every rejection repeats the rule. The gate states the order once, in a
      // toast gone in four seconds, and a player who touches the stones in the
      // order they stand — crown, river, root — is turned away with no way to
      // learn what the cavern actually wanted.
      const restarted = rune === order[0];
      state.runeSequence = restarted ? [rune] : [];
      toast(restarted
        ? `The chord breaks and begins again on the river stone. The seal wants ${hint}.`
        : `The ${names[rune]} stone answers out of turn; the stones fall dark. The seal wants ${hint}.`);
      return;
    }
    state.runeSequence.push(rune); platform.audio?.play?.('magic', { bus: 'sfx', volume: .2 + state.runeSequence.length * .04 });
    if (state.runeSequence.length < order.length) { toast(`${['', 'The river stone answers.', 'The crown stone bows.'][state.runeSequence.length]} (${state.runeSequence.length} of ${order.length})`); return; }
    toast('Roots split the final seal.'); state.runesSolved = true; state.bossAwake = true; state.quest = Math.max(state.quest, 7); discover('gloam_runes_solved', 'River, crown, root: the old order woke what waited beneath Blackwater.');
  }

  function updateZone() {
    const zone = ZONES.find((candidate) => inside(player, candidate));
    if (zone && state.zone !== zone.id) { state.zone = zone.id; state.weather = zone.id === 'gloam-cave' || zone.id === 'sunken-ruin' ? 'fog' : zone.id === 'blackwater-bridge' ? 'rain' : zone.id === 'millhaven' ? 'fireflies' : 'leaves'; toast(zone.name); platform.audio?.setMusic?.(zone.id === 'millhaven' ? 'village' : zone.id === 'gloam-cave' || zone.id === 'sunken-ruin' ? 'dungeon' : 'exploration'); platform.audio?.play?.(zone.id === 'blackwater-bridge' ? 'water' : zone.id === 'whisperwood' ? 'bird' : zone.id === 'gloam-cave' ? 'danger' : 'fire', { bus: 'ambience', volume: .08 }); }
  }

  const artCache = createArtCache({ world: WORLD, obstacles: OBSTACLES, trees: TREE_CLUMPS });
  const artCtx = {
    renderer, camera, canvas: viewport, config, state, player, enemies, particles,
    art: artCache, obstacles: OBSTACLES, interactables: INTERACTABLES, world: WORLD,
    // On touch devices the DOM buttons replace the keyboard hint text.
    touchControls: canvas.ownerDocument?.defaultView?.matchMedia?.('(pointer: coarse)')?.matches ?? false,
    clock: 0, heroX: player.x, heroY: player.y, nearest: null, questText: '',
    dialogueTitle: '', dialogueLine: '', dialogueColor: null,
    ox: 0, oy: 0, view: null,
  };

  function render(alpha) {
    renderer.begin(PALETTE.forest);
    artCtx.clock = state.clock;
    if (state.mode === 'opening') { drawOpening(artCtx); return renderer.end(); }
    if (state.mode === 'chronicle') { drawChronicle(artCtx); return renderer.end(); }
    if (state.mode === 'inventory') { drawInventory(artCtx); return renderer.end(); }
    if (state.mode === 'interior') { drawInterior(artCtx); return renderer.end(); }
    artCtx.heroX = lerp(player.previousX, player.x, alpha);
    artCtx.heroY = lerp(player.previousY, player.y, alpha);
    artCtx.nearest = nearestInteractable();
    artCtx.questText = questText();
    drawWorld(artCtx);
    drawHud(artCtx);
    if (state.dialogue) {
      const target = INTERACTABLES.find((candidate) => candidate.id === state.dialogue);
      artCtx.dialogueTitle = target?.name ?? '';
      artCtx.dialogueColor = target?.color ?? null;
      artCtx.dialogueLine = dialogueLines(state.dialogue)[state.dialogueIndex] ?? '';
      drawDialogue(artCtx);
    }
    renderer.end();
  }


  function dialogueLines(id) { const lines = [...(DIALOGUE[id] ?? [])]; if (!state.outcome) return lines; const consequence = { elara: state.outcome === 'release' ? 'You brought Corven home, Eldric. I cannot thank you for the flooded fields—but I will never forget that you kept your promise.' : 'Millhaven calls the harvest a blessing. I hear my brother singing below the bridge every night.', rowan: state.outcome === 'release' ? 'The east field is gone, and families will go hungry. Mercy has a price; now help us pay it.' : 'You chose the village over one cursed man. I would have done the same. That does not make it clean.', mara: state.outcome === 'release' ? 'A broken oath runs wild, but a living man may yet mend it.' : 'The river is quiet. Do not mistake quiet for forgiveness.' }[id]; if (consequence) lines.push(consequence); return lines; }
  function interiorDetail(interior) { return { apothecary: 'A ledger lists medicine missing before the attacks began.', smithy: 'Fresh nicks on Rowan’s spare chains match the marks beneath the bridge.', mill: 'The mill wheel turns though the river outside is still.' }[interior] ?? 'The room keeps its counsel.'; }
  function questText() { return ['Speak with the people of Millhaven', 'Investigate Blackwater Road', 'Follow the signs toward the river', 'Search the Sunken Ruin', 'Defeat the ruin’s guardian', 'Open the Gloam Gate', 'Wake the stones: river, crown, root', 'Face what waits beneath Blackwater', 'Carry the truth home to Millhaven',
    'Chapter one ends — read your Chronicle'][state.quest] ?? 'The Chronicle continues'; }
  function toast(message) { state.toast = message; state.toastTime = 4; }
  function collides(x, y) { return OBSTACLES.some((o) => x > o.x - 10 && x < o.x + o.width + 10 && y > o.y - 10 && y < o.y + o.height + 10); }

  return {
    state, player, platform,
    start() { if (state.running) return; state.running = true; previousTime = null; requestId = platform.scheduler.request(frame); },
    stop() { persist(); state.running = false; platform.scheduler.cancel(requestId); platform.input.dispose(); },
  };

  function persist() {
    platform.storage?.save?.({ schema_version: 1, openingSeen: state.mode !== 'opening', player: { x: player.x, y: player.y, health: player.health, stamina: player.stamina }, quest: state.quest, discoveries: [...state.discoveries], chronicle: state.chronicle, rumor: state.rumor, outcome: state.outcome, bossAwake: state.bossAwake, gloamOpen: state.gloamOpen, runesSolved: state.runesSolved, inventory: state.inventory });
  }
  function requestStory(beat) {
    const context = buildStoryContext({ beat, region: state.zone, recentActions: [...state.discoveries].slice(-8), chronicle: state.chronicle, reputation: {}, npcMemories: [] });
    storyteller.request(context).then(({ output }) => {
      if (!output) return;
      if (output.narration) toast(`✦ ${output.narration}`);
      if (output.chronicle_entry && !state.chronicle.includes(output.chronicle_entry)) state.chronicle.push(output.chronicle_entry);
      persist();
    });
  }
}

function createEnemy(spawn) {
  const roster = {
    boss: [260, 34, 62, 165, 62],
    miniboss: [120, 28, 54, 135, 22],
    wolf: [42, 18, 58, 105, 16],
    bandit: [58, 20, 45, 110, 20],
    skeleton: [70, 22, 34, 105, 20],
    forest_creature: [86, 26, 86, 120, 24],
    armored_knight: [110, 30, 28, 110, 22],
    dungeon_creature: [74, 24, 22, 145, 78],
  };
  const stats = roster[spawn.kind];
  return { ...spawn, health: stats[0], maxHealth: stats[0], damage: stats[1], speed: stats[2], aggro: stats[3], reach: stats[4], cooldown: 0, telegraph: 0, flash: 0, phase: 0, bossPhase: 1, attackStep: 0, lastHit: -1, alive: true, revealed: spawn.kind !== 'forest_creature', reassemble: 0, reassembled: false };
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function inside(point, rect) { return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height; }
