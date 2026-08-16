import {
  Action, Camera, Canvas2DBackend, LocalStoryProvider, Renderer, RenderLayer, SeededRng,
  StorySystem, buildStoryContext, createNarrativeState, createWebPlatform,
} from '@eldric/engine';
import { DIALOGUE, ENEMY_SPAWNS, INTERACTABLES, OBSTACLES, TREE_CLUMPS, WORLD, ZONES } from '../content/world/millhaven.js';
import { LOCAL_STORY_CORPUS } from '../content/story/local-corpus.js';

const PALETTE = Object.freeze({
  ink: '#2a2430', parchment: '#e8d2a2', moss: '#4c6849', forest: '#182b2b',
  river: '#28546a', ember: '#e38b45', moon: '#b8c8c0', blood: '#8d3e3a', grass: '#617854',
});

export function createGameRuntime(canvas, config, onStatus = () => {}) {
  const platform = createWebPlatform(canvas, { storage: config.storage, audio: config.audio });
  const renderer = new Renderer(new Canvas2DBackend(canvas));
  const camera = new Camera({ width: canvas.width, height: canvas.height, x: 270, y: 375, smoothing: 9 });
  camera.setBounds({ x: 0, y: 0, ...WORLD });
  const rng = new SeededRng('eldric-millhaven-v1');
  const player = { x: 250, y: 370, previousX: 250, previousY: 370, facingX: 1, facingY: 0,
    health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, state: 'idle', timer: 0,
    invulnerable: 0, attackId: 0 };
  const enemies = ENEMY_SPAWNS.map(createEnemy);
  const saved = platform.storage?.load?.() ?? null;
  if (saved?.player) Object.assign(player, saved.player);
  const state = {
    mode: config.openingSeen ? 'world' : 'opening', openingTime: 0, running: false,
    dialogue: null, dialogueIndex: 0, quest: 0, discoveries: new Set(), chronicle: [],
    rumor: 'Something claws at travelers beneath Blackwater Bridge.', toast: '', toastTime: 0,
    zone: 'millhaven', hour: 17.5, weather: 'leaves', outcome: null, bossAwake: false,
    gloamOpen: false, runesSolved: false, runeSequence: [], interior: null, interiorX: 192, interiorY: 170,
    inventory: ['Millhaven Sword', 'Traveler’s Tonic'],
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
  const storyteller = new StorySystem({ provider: new LocalStoryProvider({ corpus: LOCAL_STORY_CORPUS, seed: 'millhaven-player' }), state: storyState });
  storyteller.subscribe((pending) => { state.storyPending = pending; });
  let previousTime = null;
  let accumulator = 0;
  let requestId = 0;
  const particles = Array.from({ length: platform.capabilities.particleBudget }, (_, index) => ({
    x: rng.int(0, canvas.width), y: rng.int(0, canvas.height), phase: index * 0.73,
  }));

  function frame(time) {
    if (!state.running) return;
    if (previousTime === null) previousTime = time;
    accumulator += Math.min(100, time - previousTime);
    previousTime = time;
    platform.input.update();
    while (accumulator >= 1000 / 60) {
      update(1 / 60);
      accumulator -= 1000 / 60;
    }
    render(accumulator / (1000 / 60));
    requestId = platform.scheduler.request(frame);
  }

  function update(delta) {
    state.toastTime = Math.max(0, state.toastTime - delta);
    if (state.mode === 'opening') return updateOpening(delta);
    if (state.mode === 'chronicle' || state.mode === 'inventory') {
      if (platform.input.pressed(Action.CHRONICLE) || platform.input.pressed(Action.INVENTORY) || platform.input.pressed(Action.MENU)) state.mode = 'world';
      return;
    }
    if (state.mode === 'interior') return updateInterior(delta);
    if (state.dialogue) return updateDialogue();
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
    }
  }

  function updateDialogue() {
    if (state.dialogue === 'decision') {
      if (platform.input.pressed(Action.ATTACK)) chooseOutcome('release');
      if (platform.input.pressed(Action.HEAVY)) chooseOutcome('bind');
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
    toast('A new chapter has been written.'); onStatus(entry);
    persist();
    requestStory('MAJOR_DECISION');
  }

  function interact() {
    const target = nearestInteractable();
    if (!target) return;
    if (target.type === 'npc' || target.type === 'traveler') { state.dialogue = target.id; state.dialogueIndex = 0; return; }
    if (target.type === 'building') { state.mode = 'interior'; state.interior = target.interior; state.interiorX = 192; state.interiorY = 170; toast(`Entered ${target.name.replace('Enter the ', '')}.`); return; }
    if (target.id === 'campfire') {
      platform.audio?.play?.('fire', { bus: 'ambience', volume: .2 });
      player.health = player.maxHealth; player.stamina = player.maxStamina;
      const summary = state.discoveries.size
        ? `At Millhaven’s fire, the storyteller recalled ${[...state.discoveries].length} signs Eldric had uncovered along Blackwater Road.`
        : 'At Millhaven’s fire, Eldric rested while an unfinished kingdom waited beyond the sparks.';
      if (state.outcome) state.quest = 9;
      state.chronicle.push(summary); toast('Rested. Chronicle updated.'); persist(); requestStory('CAMPFIRE_REST'); return;
    }
    if (target.id === 'cave-door') {
      if (!state.discoveries.has('ruin-key')) { toast('An iron seal. Its key bears the Broken King’s crown.'); return; }
      state.gloamOpen = true; state.quest = Math.max(state.quest, 6); discover('gloam_opened', 'The Gloam Gate opened. Within, three stones wait: river, crown, root.'); return;
    }
    if (target.type === 'rune') { touchRune(target.rune); return; }
    if (target.type === 'hidden') { discover('hidden-glade', 'Beyond the pale mushrooms, a moonlit glade concealed the Witchglass Charm.'); if (!state.inventory.includes('Witchglass Charm')) state.inventory.push('Witchglass Charm'); return; }
    if (target.type === 'locked') { if (!state.discoveries.has('ruin-key')) { toast('The cellar lock bears the same broken crown as the eastern ruin.'); return; } discover('locked-cellar', 'The River Key opened the cellar. Inside lay medicine hidden from frightened villagers.'); return; }
    if (target.type === 'chest') { discover(target.id, 'Inside: the River Key and the Broken King’s medallion.'); state.quest = Math.max(state.quest, 4); return; }
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
    const order = [2, 1, 3]; const expected = order[state.runeSequence.length];
    if (rune !== expected) { state.runeSequence = rune === order[0] ? [rune] : []; toast('The cavern rejects the sequence; the stones fall dark.'); return; }
    state.runeSequence.push(rune); toast(['', 'The river stone answers.', 'The crown stone bows.', 'Roots split the final seal.'][state.runeSequence.length]);
    if (state.runeSequence.length === order.length) { state.runesSolved = true; state.bossAwake = true; state.quest = Math.max(state.quest, 7); discover('gloam_runes_solved', 'River, crown, root: the old order woke what waited beneath Blackwater.'); }
  }

  function updateZone() {
    const zone = ZONES.find((candidate) => inside(player, candidate));
    if (zone && state.zone !== zone.id) { state.zone = zone.id; state.weather = zone.id === 'gloam-cave' || zone.id === 'sunken-ruin' ? 'fog' : zone.id === 'blackwater-bridge' ? 'rain' : zone.id === 'millhaven' ? 'fireflies' : 'leaves'; toast(zone.name); platform.audio?.setMusic?.(zone.id === 'millhaven' ? 'village' : zone.id === 'gloam-cave' || zone.id === 'sunken-ruin' ? 'dungeon' : 'exploration'); }
  }

  function render(alpha) {
    renderer.begin(PALETTE.forest);
    if (state.mode === 'opening') return renderOpening();
    if (state.mode === 'chronicle') return renderChronicle();
    if (state.mode === 'inventory') return renderInventory();
    if (state.mode === 'interior') return renderInterior();
    renderWorld(alpha); renderHud();
    if (state.dialogue) renderDialogue();
    renderer.end();
  }

  function renderOpening() {
    const t = state.openingTime;
    renderer.rect({ x: 0, y: 0, width: canvas.width, height: canvas.height, fill: '#050707' }, RenderLayer.GROUND);
    if (t > 0.35 && t < 4.4) {
      const glow = 20 + Math.sin(t * 9) * 3;
      renderer.circle({ x: canvas.width / 2, y: 164, radius: glow, fill: 'rgba(227,139,69,.14)', alpha: Math.min(1, 4.4 - t) }, RenderLayer.DETAIL);
      renderer.polygon({ points: [{ x: 188, y: 168 }, { x: 178, y: 190 }, { x: 198, y: 190 }], fill: PALETTE.ember, alpha: Math.min(1, 4.4 - t) }, RenderLayer.OBJECT);
    }
    if (t > .65 && t < 4.6) renderer.text({ text: 'ELDRIC', x: 192, y: 50, align: 'center', fill: '#e7c879', font: 'bold 18px Georgia', alpha: Math.min(1, (t - .65) * 1.4, 4.6 - t) });
    if (t > .9 && t < 4.6) renderer.text({ text: 'THE LIVING CHRONICLE', x: 192, y: 65, align: 'center', fill: '#a99670', font: 'bold 7px Georgia', alpha: Math.min(1, (t - .9) * 1.4, 4.6 - t) });
    if (t > 1.45 && t < 4.6) renderer.text({ text: '“Gather close, and heed my tale.”', x: 192, y: 92, align: 'center', fill: PALETTE.parchment, font: 'italic 11px Georgia', alpha: Math.min(1, (t - 1.45) * 1.2, 4.6 - t) });
    if (t > 2.7 && t < 4.6) renderer.text({ text: 'A kingdom waits for the hand that will write its history.', x: 192, y: 109, align: 'center', fill: '#b6a580', font: '8px Georgia', alpha: Math.min(1, (t - 2.7) * 1.5, 4.6 - t) });
    if (t > 3.55) {
      const progress = clamp((t - 3.55) / 3.65, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      const x = 44 * (1 - eased), y = 31 * (1 - eased);
      const width = 296 + 88 * eased, height = 167 + 49 * eased;
      renderer.rect({ x: x - 5, y: y - 5, width: width + 10, height: height + 10, fill: '#c7ad78', stroke: '#67492e', lineWidth: 2, radius: 5 }, RenderLayer.DETAIL);
      if (config.openingPlate?.complete) {
        renderer.sprite({ image: config.openingPlate, x, y, width, height }, RenderLayer.OBJECT);
        renderer.rect({ x, y, width, height, stroke: '#8c714d', lineWidth: 2, radius: 4 }, RenderLayer.OVERHEAD);
      } else {
        renderer.rect({ x, y, width, height, fill: '#c7ad78', stroke: '#57452f', radius: 4 }, RenderLayer.OBJECT);
      }
      if (progress > .55) renderer.text({ text: 'Press E / J to enter the page', x: 192, y: 204, align: 'center', fill: PALETTE.parchment, font: 'bold 7px Georgia', stroke: '#171314', lineWidth: 3 });
    }
    renderer.end();
  }

  function renderInterior() {
    const rooms = { tavern: ['THE HEARTH & THISTLE', '#6c4633'], apothecary: ['APOTHECARY', '#526751'], smithy: ['MILLHAVEN SMITHY', '#5f4a42'], mill: ['THE OLD MILL', '#6a5940'] };
    const [title, accent] = rooms[state.interior] ?? ['MILLHAVEN', '#5b5044'];
    renderer.rect({ x: 30, y: 20, width: 324, height: 184, fill: '#3a3029', stroke: '#b08b5b', lineWidth: 3, radius: 8 }, RenderLayer.GROUND);
    for (let y = 48; y < 196; y += 16) renderer.line({ x1: 38, y1: y, x2: 346, y2: y, stroke: 'rgba(196,149,92,.2)' }, RenderLayer.DETAIL);
    renderer.rect({ x: 54, y: 45, width: 276, height: 58, fill: accent, stroke: '#271f1d', radius: 5 }, RenderLayer.OBJECT);
    if (state.interior === 'tavern') { renderer.rect({ x: 76, y: 64, width: 232, height: 18, fill: '#7c5939', stroke: '#2d2420', radius: 3 }, RenderLayer.OBJECT, 1); for (let x = 95; x < 300; x += 42) renderer.circle({ x, y: 91, radius: 6, fill: '#b77746', stroke: '#39261f' }, RenderLayer.ENTITY); }
    else if (state.interior === 'apothecary') { for (let x = 82; x < 310; x += 32) renderer.rect({ x, y: 63, width: 12, height: 20, fill: x % 3 ? '#8b684d' : '#556d68', stroke: '#2b2826', radius: 3 }, RenderLayer.ENTITY); }
    else if (state.interior === 'smithy') { renderer.circle({ x: 110, y: 76, radius: 18, fill: '#b64f35', stroke: '#2c2523' }, RenderLayer.ENTITY); renderer.rect({ x: 245, y: 68, width: 42, height: 14, fill: '#737879', stroke: '#25292a', radius: 4 }, RenderLayer.ENTITY); }
    else { renderer.circle({ x: 105, y: 76, radius: 24, stroke: '#a58a5a', lineWidth: 5 }, RenderLayer.ENTITY); renderer.rect({ x: 230, y: 65, width: 58, height: 28, fill: '#927447', stroke: '#382d24' }, RenderLayer.ENTITY); }
    renderer.text({ text: title, x: 192, y: 36, align: 'center', fill: PALETTE.parchment, font: 'bold 9px Georgia' });
    renderer.text({ text: 'E near the back to investigate · E at the door to leave', x: 192, y: 197, align: 'center', fill: '#d4bf91', font: '7px Georgia' });
    renderer.circle({ x: state.interiorX, y: state.interiorY + 8, radius: 9, fill: 'rgba(12,14,13,.28)' }, RenderLayer.DETAIL);
    renderer.polygon({ points: [{ x: state.interiorX - 9, y: state.interiorY + 11 }, { x: state.interiorX - 5, y: state.interiorY - 7 }, { x: state.interiorX + 5, y: state.interiorY - 7 }, { x: state.interiorX + 9, y: state.interiorY + 11 }], fill: '#35536a', stroke: PALETTE.ink }, RenderLayer.ENTITY);
    renderer.circle({ x: state.interiorX, y: state.interiorY - 12, radius: 6, fill: '#d6aa7f', stroke: PALETTE.ink }, RenderLayer.ENTITY, 1);
    renderer.rect({ x: 172, y: 184, width: 40, height: 20, fill: '#2c2422', stroke: '#8c6844' }, RenderLayer.OBJECT, 2);
    renderer.end();
  }

  function renderWorld(alpha) {
    const px = lerp(player.previousX, player.x, alpha), py = lerp(player.previousY, player.y, alpha);
    drawGround(); drawWaterAndRoad();
    for (const tree of TREE_CLUMPS) drawTree(tree);
    for (const obstacle of OBSTACLES) drawObstacle(obstacle);
    for (const target of INTERACTABLES) drawInteractable(target);
    for (const enemy of enemies) if (enemy.alive && (enemy.kind !== 'boss' || state.bossAwake)) drawEnemy(enemy);
    drawPlayer(px, py); drawParticles(); drawNight(); drawLocalLights();
  }

  function drawGround() {
    const topLeft = camera.worldToScreen(0, 0);
    renderer.rect({ x: topLeft.x, y: topLeft.y, width: WORLD.width, height: WORLD.height, fill: PALETTE.grass }, RenderLayer.GROUND);
    for (let x = 24; x < WORLD.width; x += 48) for (let y = 24; y < WORLD.height; y += 48) {
      const p = camera.worldToScreen(x, y); renderer.line({ x1: p.x - 3, y1: p.y + 2, x2: p.x, y2: p.y - 3, stroke: 'rgba(35,55,42,.28)' }, RenderLayer.DETAIL);
    }
  }

  function drawWaterAndRoad() {
    const river = camera.worldToScreen(880, 0);
    renderer.rect({ x: river.x, y: river.y, width: 150, height: 800, fill: PALETTE.river }, RenderLayer.GROUND, 1);
    for (let y = 10; y < 800; y += 22) { const p = camera.worldToScreen(900 + (y % 3) * 18, y); renderer.line({ x1: p.x, y1: p.y, x2: p.x + 42, y2: p.y, stroke: 'rgba(184,200,192,.28)' }, RenderLayer.DETAIL); }
    const road = camera.worldToScreen(400, 330);
    renderer.polygon({ points: [{ x: road.x, y: road.y }, { x: road.x + 510, y: road.y - 48 }, { x: road.x + 510, y: road.y + 44 }, { x: road.x, y: road.y + 72 }], fill: '#8a7758' }, RenderLayer.GROUND, 2);
    const bridge = camera.worldToScreen(850, 322);
    renderer.rect({ x: bridge.x, y: bridge.y, width: 210, height: 70, fill: '#604932', stroke: '#2f2722' }, RenderLayer.OBJECT, 0);
    for (let x = 0; x < 210; x += 14) renderer.line({ x1: bridge.x + x, y1: bridge.y, x2: bridge.x + x, y2: bridge.y + 70, stroke: '#8b6d47' }, RenderLayer.OBJECT, 1);
  }

  function drawTree(tree) { const p = camera.worldToScreen(tree.x, tree.y); renderer.circle({ x: p.x + 2, y: p.y + tree.size * .6, radius: tree.size * .7, fill: 'rgba(15,25,22,.28)' }, RenderLayer.DETAIL, tree.y - 2); renderer.rect({ x: p.x - 2, y: p.y - 2, width: 5, height: tree.size + 7, fill: '#4b3928', stroke: '#2d2823' }, RenderLayer.OBJECT, tree.y - 1); renderer.circle({ x: p.x, y: p.y, radius: tree.size, fill: '#263f35', stroke: '#172a28' }, RenderLayer.OBJECT, tree.y); renderer.circle({ x: p.x - tree.size * .35, y: p.y - tree.size * .3, radius: tree.size * .58, fill: '#4c6849' }, RenderLayer.OBJECT, tree.y + 1); renderer.circle({ x: p.x + tree.size * .38, y: p.y - tree.size * .15, radius: tree.size * .48, fill: '#385a40' }, RenderLayer.OBJECT, tree.y + 2); }
  function drawObstacle(o) { const p = camera.worldToScreen(o.x, o.y); const fill = o.kind === 'house' ? '#a67c52' : o.kind === 'ruin' ? '#6d7068' : '#6a5036'; renderer.rect({ x: p.x, y: p.y, width: o.width, height: o.height, fill, stroke: PALETTE.ink, radius: 3 }, RenderLayer.OBJECT, o.y); if (o.kind === 'house') { renderer.polygon({ points: [{ x: p.x - 6, y: p.y + 8 }, { x: p.x + o.width / 2, y: p.y - 30 }, { x: p.x + o.width + 6, y: p.y + 8 }], fill: '#70423a', stroke: PALETTE.ink }, RenderLayer.OVERHEAD, o.y); renderer.rect({ x: p.x + o.width / 2 - 8, y: p.y + o.height - 26, width: 16, height: 26, fill: '#3a2b25' }, RenderLayer.ENTITY, o.y + o.height); } }
  function drawInteractable(t) {
    const p = camera.worldToScreen(t.x, t.y); const order = t.y;
    if (t.type === 'hidden' && !state.discoveries.has('mara_clue')) return;
    if (t.type === 'npc' || t.type === 'traveler') { renderer.circle({ x: p.x, y: p.y + 10, radius: 9, fill: 'rgba(24,27,25,.24)' }, RenderLayer.DETAIL, order); renderer.polygon({ points: [{ x: p.x - 9, y: p.y + 12 }, { x: p.x - 5, y: p.y - 5 }, { x: p.x + 5, y: p.y - 5 }, { x: p.x + 9, y: p.y + 12 }], fill: t.color ?? '#7a6348', stroke: PALETTE.ink }, RenderLayer.ENTITY, order); renderer.circle({ x: p.x, y: p.y - 10, radius: 6, fill: '#d9b38c', stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 1); renderer.polygon({ points: [{ x: p.x - 6, y: p.y - 13 }, { x: p.x, y: p.y - 19 }, { x: p.x + 6, y: p.y - 12 }], fill: t.id === 'mara' ? '#d3d0c4' : '#49362f' }, RenderLayer.ENTITY, order + 2); }
    else if (t.type === 'campfire') { renderer.line({ x1: p.x - 9, y1: p.y + 7, x2: p.x + 9, y2: p.y + 11, stroke: '#4c3022', lineWidth: 4 }, RenderLayer.ENTITY, order); renderer.line({ x1: p.x + 9, y1: p.y + 7, x2: p.x - 9, y2: p.y + 11, stroke: '#4c3022', lineWidth: 4 }, RenderLayer.ENTITY, order); renderer.polygon({ points: [{ x: p.x, y: p.y - 17 }, { x: p.x - 8, y: p.y + 7 }, { x: p.x, y: p.y + 3 }, { x: p.x + 8, y: p.y + 7 }], fill: PALETTE.ember, stroke: '#6d3629' }, RenderLayer.ENTITY, order + 1); renderer.polygon({ points: [{ x: p.x, y: p.y - 8 }, { x: p.x - 3, y: p.y + 4 }, { x: p.x + 4, y: p.y + 2 }], fill: '#f4cf65' }, RenderLayer.ENTITY, order + 2); }
    else if (t.type === 'chest') { renderer.rect({ x: p.x - 11, y: p.y - 3, width: 22, height: 14, fill: '#6d452b', stroke: PALETTE.ink, radius: 2 }, RenderLayer.ENTITY, order); renderer.rect({ x: p.x - 10, y: p.y - 8, width: 20, height: 8, fill: '#8a5c35', stroke: PALETTE.ink, radius: 4 }, RenderLayer.ENTITY, order + 1); renderer.rect({ x: p.x - 2, y: p.y - 1, width: 4, height: 6, fill: '#d0a44e' }, RenderLayer.ENTITY, order + 2); }
    else if (t.type === 'door') { renderer.rect({ x: p.x - 11, y: p.y - 18, width: 22, height: 30, fill: '#333d3a', stroke: '#1e2524', radius: 8 }, RenderLayer.ENTITY, order); renderer.line({ x1: p.x - 8, y1: p.y - 3, x2: p.x + 8, y2: p.y - 3, stroke: '#74827c', lineWidth: 2 }, RenderLayer.ENTITY, order + 1); }
    else if (t.type === 'building' || t.type === 'locked') { renderer.rect({ x: p.x - 8, y: p.y - 13, width: 16, height: 25, fill: t.type === 'locked' ? '#3d342d' : '#59402e', stroke: '#241f1d', radius: 4 }, RenderLayer.ENTITY, order); renderer.circle({ x: p.x + 4, y: p.y, radius: 2, fill: '#d0a44e' }, RenderLayer.ENTITY, order + 1); }
    else if (t.type === 'rune') { renderer.polygon({ points: [{ x: p.x - 9, y: p.y + 9 }, { x: p.x - 6, y: p.y - 12 }, { x: p.x + 7, y: p.y - 9 }, { x: p.x + 9, y: p.y + 10 }], fill: state.runeSequence.includes(t.rune) ? '#6d8f8d' : '#59605c', stroke: '#252c2b' }, RenderLayer.ENTITY, order); renderer.text({ text: ['','♔','≈','⌁'][t.rune], x: p.x, y: p.y + 2, align: 'center', fill: '#c7d6c3', font: 'bold 9px Georgia' }, RenderLayer.ENTITY, order + 1); }
    else if (t.type === 'hidden') { renderer.circle({ x: p.x - 5, y: p.y + 2, radius: 5, fill: '#d8d2ae', stroke: '#59645a' }, RenderLayer.ENTITY, order); renderer.circle({ x: p.x + 5, y: p.y - 3, radius: 4, fill: '#d1c7e0', stroke: '#59645a' }, RenderLayer.ENTITY, order + 1); }
    else if (t.id === 'tracks') { renderer.circle({ x: p.x - 4, y: p.y - 4, radius: 3, fill: '#433d32' }, RenderLayer.ENTITY, order); renderer.circle({ x: p.x + 4, y: p.y + 4, radius: 3, fill: '#433d32' }, RenderLayer.ENTITY, order); }
    else if (t.id === 'statue') { renderer.rect({ x: p.x - 7, y: p.y - 10, width: 14, height: 22, fill: '#858a7e', stroke: '#41483f', radius: 3 }, RenderLayer.ENTITY, order); renderer.circle({ x: p.x, y: p.y - 15, radius: 6, fill: '#9da093', stroke: '#41483f' }, RenderLayer.ENTITY, order + 1); }
    else renderer.circle({ x: p.x, y: p.y, radius: 6, fill: state.discoveries.has(t.id) ? '#70766d' : PALETTE.moon, stroke: PALETTE.ink }, RenderLayer.ENTITY, order);
    if (t.type !== 'hidden' && !state.discoveries.has(t.id) && distance(player.x, player.y, t.x, t.y) < 52) renderer.polygon({ points: [{ x: p.x, y: p.y - 30 }, { x: p.x - 4, y: p.y - 24 }, { x: p.x, y: p.y - 18 }, { x: p.x + 4, y: p.y - 24 }], fill: '#f1d27d', stroke: '#6d5133' }, RenderLayer.OVERHEAD, order + 3);
  }
  function drawPlayer(x, y) { const p = camera.worldToScreen(x, y); const hurt = player.state === 'hurt' && Math.floor(player.timer * 30) % 2; const bob = player.state === 'walk' || player.state === 'run' ? Math.sin(state.hour * 90) * 1.5 : 0; renderer.circle({ x: p.x, y: p.y + 11, radius: 10, fill: 'rgba(18,24,22,.3)' }, RenderLayer.DETAIL, y); renderer.polygon({ points: [{ x: p.x - 10, y: p.y + 13 }, { x: p.x - 6, y: p.y - 5 + bob }, { x: p.x + 5, y: p.y - 5 + bob }, { x: p.x + 11, y: p.y + 13 }], fill: '#35536a', stroke: PALETTE.ink }, RenderLayer.ENTITY, y); renderer.polygon({ points: [{ x: p.x - 8, y: p.y + 11 }, { x: p.x - 11, y: p.y - 1 }, { x: p.x - 5, y: p.y - 4 }], fill: '#7b333a', stroke: PALETTE.ink }, RenderLayer.ENTITY, y + 1); renderer.circle({ x: p.x, y: p.y - 11 + bob, radius: 6, fill: hurt ? '#fff' : '#d6aa7f', stroke: PALETTE.ink }, RenderLayer.ENTITY, y + 2); renderer.polygon({ points: [{ x: p.x - 6, y: p.y - 13 + bob }, { x: p.x, y: p.y - 19 + bob }, { x: p.x + 6, y: p.y - 13 + bob }], fill: '#4b352c' }, RenderLayer.ENTITY, y + 3); renderer.line({ x1: p.x + player.facingX * 5, y1: p.y + player.facingY * 4, x2: p.x + player.facingX * 19, y2: p.y + player.facingY * 19, stroke: '#e1dcc8', lineWidth: 3 }, RenderLayer.ENTITY, y + 4); renderer.line({ x1: p.x + player.facingX * 4 - player.facingY * 4, y1: p.y + player.facingY * 4 + player.facingX * 4, x2: p.x + player.facingX * 4 + player.facingY * 4, y2: p.y + player.facingY * 4 - player.facingX * 4, stroke: '#9a6b3b', lineWidth: 2 }, RenderLayer.ENTITY, y + 5); if (player.state === 'attack' || player.state === 'heavy') renderer.circle({ x: p.x + player.facingX * 20, y: p.y + player.facingY * 20, radius: player.state === 'heavy' ? 20 : 15, stroke: '#f0d68a', alpha: .65 }, RenderLayer.ENTITY, y + 6); }
  function drawEnemy(e) { const p = camera.worldToScreen(e.x, e.y); const color = e.flash ? '#fff' : { wolf: '#655f59', bandit: '#75434a', skeleton: '#b8b09b', forest_creature: '#31563c', armored_knight: '#737881', dungeon_creature: '#665089', miniboss: '#3b684d', boss: '#315e68' }[e.kind]; const radius = e.kind === 'boss' ? 18 : e.kind === 'miniboss' ? 14 : e.kind === 'armored_knight' ? 11 : 9; renderer.circle({ x: p.x, y: p.y + radius * .65, radius: radius, fill: 'rgba(18,24,22,.28)' }, RenderLayer.DETAIL, e.y); if (e.kind === 'wolf') { renderer.circle({ x: p.x - 3, y: p.y, radius: 8, fill: color, stroke: PALETTE.ink }, RenderLayer.ENTITY, e.y); renderer.circle({ x: p.x + 7, y: p.y - 4, radius: 6, fill: color, stroke: PALETTE.ink }, RenderLayer.ENTITY, e.y + 1); renderer.polygon({ points: [{ x: p.x + 4, y: p.y - 9 }, { x: p.x + 6, y: p.y - 16 }, { x: p.x + 9, y: p.y - 9 }], fill: color }, RenderLayer.ENTITY, e.y + 2); renderer.line({ x1: p.x - 9, y1: p.y - 2, x2: p.x - 15, y2: p.y - 8, stroke: color, lineWidth: 3 }, RenderLayer.ENTITY, e.y + 2); }
    else if (e.kind === 'skeleton') { renderer.circle({ x: p.x, y: p.y - 10, radius: 6, fill: color, stroke: PALETTE.ink }, RenderLayer.ENTITY, e.y); renderer.line({ x1: p.x, y1: p.y - 4, x2: p.x, y2: p.y + 10, stroke: color, lineWidth: 3 }, RenderLayer.ENTITY, e.y + 1); renderer.line({ x1: p.x - 8, y1: p.y, x2: p.x + 8, y2: p.y, stroke: color, lineWidth: 2 }, RenderLayer.ENTITY, e.y + 1); renderer.line({ x1: p.x, y1: p.y + 8, x2: p.x - 7, y2: p.y + 15, stroke: color, lineWidth: 2 }, RenderLayer.ENTITY, e.y + 1); renderer.line({ x1: p.x, y1: p.y + 8, x2: p.x + 7, y2: p.y + 15, stroke: color, lineWidth: 2 }, RenderLayer.ENTITY, e.y + 1); }
    else if (e.kind === 'forest_creature' || e.kind === 'miniboss') { renderer.circle({ x: p.x, y: p.y, radius, fill: color, stroke: PALETTE.ink, lineWidth: 2 }, RenderLayer.ENTITY, e.y); renderer.line({ x1: p.x - 5, y1: p.y - radius + 2, x2: p.x - 12, y2: p.y - radius - 9, stroke: '#5c4b34', lineWidth: 3 }, RenderLayer.ENTITY, e.y + 1); renderer.line({ x1: p.x + 5, y1: p.y - radius + 2, x2: p.x + 12, y2: p.y - radius - 9, stroke: '#5c4b34', lineWidth: 3 }, RenderLayer.ENTITY, e.y + 1); renderer.line({ x1: p.x, y1: p.y + radius - 2, x2: p.x - 12, y2: p.y + radius + 9, stroke: '#3e4e32', lineWidth: 3 }, RenderLayer.ENTITY, e.y + 1); }
    else if (e.kind === 'armored_knight') { renderer.polygon({ points: [{ x: p.x - 10, y: p.y + 13 }, { x: p.x - 7, y: p.y - 8 }, { x: p.x + 7, y: p.y - 8 }, { x: p.x + 10, y: p.y + 13 }], fill: color, stroke: PALETTE.ink }, RenderLayer.ENTITY, e.y); renderer.rect({ x: p.x - 6, y: p.y - 16, width: 12, height: 10, fill: '#9299a0', stroke: PALETTE.ink, radius: 4 }, RenderLayer.ENTITY, e.y + 1); renderer.circle({ x: p.x - 11, y: p.y + 2, radius: 8, fill: '#56636d', stroke: '#aab2b4', lineWidth: 2 }, RenderLayer.ENTITY, e.y + 2); }
    else if (e.kind === 'dungeon_creature' || e.kind === 'boss') { for (let i = -2; i <= 2; i += 1) renderer.line({ x1: p.x + i * 4, y1: p.y + radius * .5, x2: p.x + i * 8, y2: p.y + radius + 11 + Math.sin(e.phase + i) * 4, stroke: color, lineWidth: e.kind === 'boss' ? 5 : 3 }, RenderLayer.ENTITY, e.y); renderer.circle({ x: p.x, y: p.y, radius, fill: color, stroke: PALETTE.ink, lineWidth: 2 }, RenderLayer.ENTITY, e.y + 1); renderer.circle({ x: p.x, y: p.y - 3, radius: e.kind === 'boss' ? 5 : 4, fill: '#d6cf9a', stroke: '#293032' }, RenderLayer.ENTITY, e.y + 2); }
    else { renderer.polygon({ points: [{ x: p.x - 9, y: p.y + 12 }, { x: p.x - 6, y: p.y - 7 }, { x: p.x + 6, y: p.y - 7 }, { x: p.x + 9, y: p.y + 12 }], fill: color, stroke: PALETTE.ink }, RenderLayer.ENTITY, e.y); renderer.circle({ x: p.x, y: p.y - 12, radius: 6, fill: '#b98b70', stroke: PALETTE.ink }, RenderLayer.ENTITY, e.y + 1); renderer.line({ x1: p.x + 7, y1: p.y, x2: p.x + 15, y2: p.y + 9, stroke: '#c9c4b1', lineWidth: 2 }, RenderLayer.ENTITY, e.y + 2); }
    if (e.telegraph > 0) renderer.circle({ x: p.x, y: p.y, radius: radius + 8 + Math.sin(e.telegraph * 20) * 2, stroke: '#e6a35d', lineWidth: 2 }, RenderLayer.ENTITY, e.y + 4); if (e.kind === 'boss') renderer.text({ text: `THE DROWNED OATH · PHASE ${e.bossPhase}`, x: 192, y: 24, align: 'center', fill: PALETTE.parchment, font: 'bold 9px Georgia' }); }
  function drawParticles() { for (const particle of particles) { particle.phase += .004; if (state.weather === 'rain') { particle.y += 1.6; particle.x -= .28; if (particle.y > canvas.height) particle.y = 0; renderer.line({ x1: particle.x, y1: particle.y, x2: particle.x - 2, y2: particle.y + 7, stroke: 'rgba(181,204,210,.32)' }, RenderLayer.WEATHER); } else if (state.weather === 'fog') { particle.x += .05; if (particle.x > canvas.width) particle.x = 0; renderer.circle({ x: particle.x, y: particle.y, radius: 4 + particle.phase % 5, fill: 'rgba(190,201,190,.08)' }, RenderLayer.WEATHER); } else { particle.y += .12; particle.x += Math.sin(particle.phase + state.hour) * .08; if (particle.y > canvas.height) particle.y = 0; renderer.circle({ x: particle.x, y: particle.y, radius: state.weather === 'fireflies' ? 1.3 : 1, fill: state.weather === 'fireflies' ? 'rgba(241,211,104,.55)' : 'rgba(199,155,76,.32)' }, RenderLayer.WEATHER); } } }
  function drawNight() { const darkness = state.hour > 19 || state.hour < 6 ? .38 : .08; renderer.rect({ x: 0, y: 0, width: canvas.width, height: canvas.height, fill: `rgba(10,20,28,${darkness})` }, RenderLayer.LIGHTING); }
  function drawLocalLights() { const camp = camera.worldToScreen(258, 390); drawGlow(camp.x, camp.y, 34, '227,139,69'); for (const house of OBSTACLES.filter((object) => object.kind === 'house')) { const window = camera.worldToScreen(house.x + house.width * .72, house.y + house.height * .58); drawGlow(window.x, window.y, 17, '238,183,92'); } if (state.zone === 'gloam-cave') { const moon = camera.worldToScreen(1120, 610); drawGlow(moon.x, moon.y, 42, '107,151,169'); } }
  function drawGlow(x, y, radius, rgb) { if (x < -radius || y < -radius || x > canvas.width + radius || y > canvas.height + radius) return; for (let ring = 4; ring > 0; ring -= 1) renderer.circle({ x, y, radius: radius * ring / 4, fill: `rgba(${rgb},${.025 * (5 - ring)})` }, RenderLayer.LIGHTING, ring); }

  function renderHud() { renderer.rect({ x: 8, y: 8, width: 102, height: 22, fill: 'rgba(30,26,29,.82)', stroke: '#8d7853', radius: 3 }, RenderLayer.UI); renderer.rect({ x: 14, y: 14, width: 88 * player.health / player.maxHealth, height: 5, fill: PALETTE.blood }, RenderLayer.UI, 1); renderer.rect({ x: 14, y: 22, width: 88 * player.stamina / player.maxStamina, height: 3, fill: '#c0a65b' }, RenderLayer.UI, 1); renderer.text({ text: questText(), x: 192, y: 14, align: 'center', fill: PALETTE.parchment, font: '7px Georgia' }); const target = nearestInteractable(); if (target) renderer.text({ text: `E  ${target.name}`, x: 192, y: 196, align: 'center', fill: PALETTE.parchment, font: 'bold 8px Georgia' }); if (state.toastTime > 0) { renderer.rect({ x: 55, y: 164, width: 274, height: 30, fill: 'rgba(25,22,24,.9)', stroke: '#8d7853', radius: 4 }, RenderLayer.UI); renderer.text({ text: state.toast, x: 192, y: 177, align: 'center', fill: PALETTE.parchment, font: '7px Georgia', wrapWidth: 250, lineHeight: 8, maxLines: 2 }); } if (state.storyPending) renderer.text({ text: '✦ The storyteller is turning a page…', x: 192, y: 207, align: 'center', fill: '#e3a85e', font: 'italic 7px Georgia' }); renderer.text({ text: 'TAB Chronicle', x: 376, y: 210, align: 'right', fill: '#d2bf92', font: '7px Georgia' }); }
  function renderDialogue() { renderer.rect({ x: 20, y: 142, width: 344, height: 66, fill: '#2b2628', stroke: '#b59a67', radius: 5 }, RenderLayer.UI, 10); if (state.dialogue === 'decision') { renderer.text({ text: 'Corven: Break the seal and the river may flood—or bind me here so Millhaven prospers.', x: 32, y: 158, fill: PALETTE.parchment, font: '7px Georgia', wrapWidth: 318, lineHeight: 9, maxLines: 3 }, RenderLayer.UI, 11); renderer.text({ text: 'J — Break the seal     K — Renew the binding', x: 192, y: 199, align: 'center', fill: '#e3a85e', font: 'bold 7px Georgia' }, RenderLayer.UI, 11); } else { const target = INTERACTABLES.find((t) => t.id === state.dialogue); renderer.text({ text: target?.name ?? '', x: 32, y: 156, fill: '#e3a85e', font: 'bold 8px Georgia' }, RenderLayer.UI, 11); renderer.text({ text: dialogueLines(state.dialogue)[state.dialogueIndex], x: 32, y: 169, fill: PALETTE.parchment, font: '7px Georgia', wrapWidth: 304, lineHeight: 9, maxLines: 4 }, RenderLayer.UI, 11); renderer.text({ text: 'E', x: 348, y: 201, align: 'right', fill: '#b59a67', font: 'bold 7px Georgia' }, RenderLayer.UI, 11); } }
  function renderChronicle() {
    renderer.rect({ x: 0, y: 0, width: 384, height: 216, fill: '#171314' }, RenderLayer.GROUND);
    renderer.rect({ x: 28, y: 12, width: 328, height: 192, fill: '#d7c08d', stroke: '#5b432e', radius: 7 }, RenderLayer.OBJECT);
    renderer.line({ x1: 192, y1: 18, x2: 192, y2: 198, stroke: '#8c714d' }, RenderLayer.ENTITY);
    renderer.text({ text: 'THE LIVING CHRONICLE', x: 192, y: 34, align: 'center', fill: PALETTE.ink, font: 'bold 11px Georgia' });
    renderer.text({ text: 'Rumor in Millhaven', x: 44, y: 57, fill: '#684738', font: 'bold 8px Georgia' });
    renderer.text({ text: state.rumor, x: 44, y: 72, fill: PALETTE.ink, font: 'italic 7px Georgia', wrapWidth: 128, lineHeight: 9, maxLines: 10 });
    renderer.text({ text: 'What Eldric did', x: 210, y: 57, fill: '#684738', font: 'bold 8px Georgia' });
    state.chronicle.slice(-5).forEach((entry, i) => renderer.text({ text: `• ${entry}`, x: 210, y: 72 + i * 23, fill: PALETTE.ink, font: '7px Georgia', wrapWidth: 128, lineHeight: 8, maxLines: 2 }));
    renderer.text({ text: 'TAB to close', x: 192, y: 194, align: 'center', fill: '#684738', font: '7px Georgia' }); renderer.end();
  }
  function renderInventory() { renderer.rect({ x: 0, y: 0, width: 384, height: 216, fill: '#131b1a' }, RenderLayer.GROUND); renderer.rect({ x: 42, y: 22, width: 300, height: 172, fill: '#2b2628', stroke: '#b59a67', radius: 6 }, RenderLayer.OBJECT); renderer.text({ text: 'TRAVELER’S SATCHEL', x: 192, y: 46, align: 'center', fill: PALETTE.parchment, font: 'bold 11px Georgia' }); state.inventory.forEach((item, i) => { renderer.rect({ x: 70, y: 65 + i * 36, width: 244, height: 27, fill: '#3b3434', stroke: '#6f6046', radius: 3 }, RenderLayer.UI); renderer.text({ text: item, x: 84, y: 82 + i * 36, fill: PALETTE.parchment, font: '8px Georgia' }); }); renderer.text({ text: 'I to close', x: 192, y: 181, align: 'center', fill: '#b59a67', font: '6px Georgia' }); renderer.end(); }

  function dialogueLines(id) { const lines = [...(DIALOGUE[id] ?? [])]; if (!state.outcome) return lines; const consequence = { elara: state.outcome === 'release' ? 'You brought Corven home, Eldric. I cannot thank you for the flooded fields—but I will never forget that you kept your promise.' : 'Millhaven calls the harvest a blessing. I hear my brother singing below the bridge every night.', rowan: state.outcome === 'release' ? 'The east field is gone, and families will go hungry. Mercy has a price; now help us pay it.' : 'You chose the village over one cursed man. I would have done the same. That does not make it clean.', mara: state.outcome === 'release' ? 'A broken oath runs wild, but a living man may yet mend it.' : 'The river is quiet. Do not mistake quiet for forgiveness.' }[id]; if (consequence) lines.push(consequence); return lines; }
  function interiorDetail(interior) { return { apothecary: 'A ledger lists medicine missing before the attacks began.', smithy: 'Fresh nicks on Rowan’s spare chains match the marks beneath the bridge.', mill: 'The mill wheel turns though the river outside is still.' }[interior] ?? 'The room keeps its counsel.'; }
  function questText() { return ['Speak with the people of Millhaven', 'Investigate Blackwater Road', 'Follow the signs toward the river', 'Search the Sunken Ruin', 'Defeat the ruin’s guardian', 'Open the Gloam Gate', 'Solve the three-stone river seal', 'Face what waits beneath Blackwater', 'Return to the campfire'][state.quest] ?? 'The Chronicle continues'; }
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
