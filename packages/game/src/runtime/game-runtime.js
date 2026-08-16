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
      const lines = DIALOGUE[state.dialogue];
      state.dialogueIndex += 1;
      if (state.dialogueIndex >= lines.length) {
        if (state.dialogue === 'elara') state.quest = Math.max(state.quest, 1);
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
    if (target.type === 'npc') { state.dialogue = target.id; state.dialogueIndex = 0; return; }
    if (target.id === 'campfire') {
      platform.audio?.play?.('fire', { bus: 'ambience', volume: .2 });
      player.health = player.maxHealth; player.stamina = player.maxStamina;
      const summary = state.discoveries.size
        ? `At Millhaven’s fire, the storyteller recalled ${[...state.discoveries].length} signs Eldric had uncovered along Blackwater Road.`
        : 'At Millhaven’s fire, Eldric rested while an unfinished kingdom waited beyond the sparks.';
      state.chronicle.push(summary); toast('Rested. Chronicle updated.'); persist(); requestStory('CAMPFIRE_REST'); return;
    }
    if (target.id === 'cave-door') {
      if (!state.discoveries.has('ruin-key')) { toast('An iron seal. Its key bears the Broken King’s crown.'); return; }
      state.bossAwake = true; state.quest = Math.max(state.quest, 6); discover('gloam_opened', 'The Gloam Gate opened beneath the river’s roar.'); return;
    }
    if (target.type === 'chest') { discover(target.id, 'Inside: the River Key and the Broken King’s medallion.'); state.quest = Math.max(state.quest, 4); return; }
    if (target.type === 'secret') { discover(target.id, 'The saint points southeast. A hidden trail answers in pale mushrooms.'); return; }
    discover(target.id, target.id === 'wagon' ? 'The claw marks were carved from inside the wagon.' :
      target.id === 'tracks' ? 'Bare human footprints enter the river. Webbed tracks leave it.' :
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
      const d = distance(player.x, player.y, target.x, target.y);
      if (d < bestDistance) { best = target; bestDistance = d; }
    }
    return best;
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

  function drawTree(tree) { const p = camera.worldToScreen(tree.x, tree.y); renderer.circle({ x: p.x, y: p.y, radius: tree.size, fill: '#263f35', stroke: '#172a28' }, RenderLayer.OBJECT, tree.y); renderer.circle({ x: p.x - 5, y: p.y - 6, radius: tree.size * .55, fill: '#4c6849' }, RenderLayer.OBJECT, tree.y + 1); }
  function drawObstacle(o) { const p = camera.worldToScreen(o.x, o.y); const fill = o.kind === 'house' ? '#a67c52' : o.kind === 'ruin' ? '#6d7068' : '#6a5036'; renderer.rect({ x: p.x, y: p.y, width: o.width, height: o.height, fill, stroke: PALETTE.ink, radius: 3 }, RenderLayer.OBJECT, o.y); if (o.kind === 'house') { renderer.polygon({ points: [{ x: p.x - 6, y: p.y + 8 }, { x: p.x + o.width / 2, y: p.y - 30 }, { x: p.x + o.width + 6, y: p.y + 8 }], fill: '#70423a', stroke: PALETTE.ink }, RenderLayer.OVERHEAD, o.y); renderer.rect({ x: p.x + o.width / 2 - 8, y: p.y + o.height - 26, width: 16, height: 26, fill: '#3a2b25' }, RenderLayer.ENTITY, o.y + o.height); } }
  function drawInteractable(t) { const p = camera.worldToScreen(t.x, t.y); if (t.type === 'npc') { renderer.circle({ x: p.x, y: p.y - 9, radius: 6, fill: '#d9b38c', stroke: PALETTE.ink }, RenderLayer.ENTITY, t.y); renderer.polygon({ points: [{ x: p.x - 8, y: p.y + 11 }, { x: p.x, y: p.y - 4 }, { x: p.x + 8, y: p.y + 11 }], fill: t.color, stroke: PALETTE.ink }, RenderLayer.ENTITY, t.y + 1); } else if (t.type === 'campfire') { renderer.polygon({ points: [{ x: p.x, y: p.y - 14 }, { x: p.x - 8, y: p.y + 6 }, { x: p.x + 8, y: p.y + 6 }], fill: PALETTE.ember }, RenderLayer.ENTITY, t.y); } else { renderer.circle({ x: p.x, y: p.y, radius: 5, fill: state.discoveries.has(t.id) ? '#70766d' : PALETTE.moon, stroke: PALETTE.ink }, RenderLayer.ENTITY, t.y); } }
  function drawPlayer(x, y) { const p = camera.worldToScreen(x, y); const hurt = player.state === 'hurt' && Math.floor(player.timer * 30) % 2; renderer.circle({ x: p.x, y: p.y - 9, radius: 6, fill: hurt ? '#fff' : '#d6aa7f', stroke: PALETTE.ink }, RenderLayer.ENTITY, y); renderer.polygon({ points: [{ x: p.x - 8, y: p.y + 12 }, { x: p.x, y: p.y - 4 }, { x: p.x + 8, y: p.y + 12 }], fill: '#35536a', stroke: PALETTE.ink }, RenderLayer.ENTITY, y + 1); renderer.line({ x1: p.x + player.facingX * 5, y1: p.y + player.facingY * 4, x2: p.x + player.facingX * 17, y2: p.y + player.facingY * 17, stroke: '#d8d2bd', lineWidth: 2 }, RenderLayer.ENTITY, y + 2); if (player.state === 'attack' || player.state === 'heavy') renderer.circle({ x: p.x + player.facingX * 20, y: p.y + player.facingY * 20, radius: player.state === 'heavy' ? 20 : 15, stroke: '#f0d68a', alpha: .65 }, RenderLayer.ENTITY, y + 3); }
  function drawEnemy(e) { const p = camera.worldToScreen(e.x, e.y); const colors = { wolf: '#655f59', bandit: '#75434a', skeleton: '#b8b09b', forest_creature: '#31563c', armored_knight: '#737881', dungeon_creature: '#665089', miniboss: '#3b684d', boss: '#315e68' }; const color = e.flash ? '#fff' : colors[e.kind]; const radius = e.kind === 'boss' ? 18 : e.kind === 'miniboss' ? 14 : e.kind === 'armored_knight' ? 11 : 9; renderer.circle({ x: p.x, y: p.y, radius, fill: color, stroke: PALETTE.ink, lineWidth: 2 }, RenderLayer.ENTITY, e.y); if (e.telegraph > 0) renderer.circle({ x: p.x, y: p.y, radius: radius + 8 + Math.sin(e.telegraph * 20) * 2, stroke: '#e6a35d', lineWidth: 2 }, RenderLayer.ENTITY, e.y + 1); if (e.kind === 'boss') renderer.text({ text: `THE DROWNED OATH · PHASE ${e.bossPhase}`, x: 192, y: 24, align: 'center', fill: PALETTE.parchment, font: 'bold 9px Georgia' }); }
  function drawParticles() { for (const particle of particles) { particle.phase += .004; if (state.weather === 'rain') { particle.y += 1.6; particle.x -= .28; if (particle.y > canvas.height) particle.y = 0; renderer.line({ x1: particle.x, y1: particle.y, x2: particle.x - 2, y2: particle.y + 7, stroke: 'rgba(181,204,210,.32)' }, RenderLayer.WEATHER); } else if (state.weather === 'fog') { particle.x += .05; if (particle.x > canvas.width) particle.x = 0; renderer.circle({ x: particle.x, y: particle.y, radius: 4 + particle.phase % 5, fill: 'rgba(190,201,190,.08)' }, RenderLayer.WEATHER); } else { particle.y += .12; particle.x += Math.sin(particle.phase + state.hour) * .08; if (particle.y > canvas.height) particle.y = 0; renderer.circle({ x: particle.x, y: particle.y, radius: state.weather === 'fireflies' ? 1.3 : 1, fill: state.weather === 'fireflies' ? 'rgba(241,211,104,.55)' : 'rgba(199,155,76,.32)' }, RenderLayer.WEATHER); } } }
  function drawNight() { const darkness = state.hour > 19 || state.hour < 6 ? .38 : .08; renderer.rect({ x: 0, y: 0, width: canvas.width, height: canvas.height, fill: `rgba(10,20,28,${darkness})` }, RenderLayer.LIGHTING); }
  function drawLocalLights() { const camp = camera.worldToScreen(258, 390); drawGlow(camp.x, camp.y, 34, '227,139,69'); for (const house of OBSTACLES.filter((object) => object.kind === 'house')) { const window = camera.worldToScreen(house.x + house.width * .72, house.y + house.height * .58); drawGlow(window.x, window.y, 17, '238,183,92'); } if (state.zone === 'gloam-cave') { const moon = camera.worldToScreen(1120, 610); drawGlow(moon.x, moon.y, 42, '107,151,169'); } }
  function drawGlow(x, y, radius, rgb) { if (x < -radius || y < -radius || x > canvas.width + radius || y > canvas.height + radius) return; for (let ring = 4; ring > 0; ring -= 1) renderer.circle({ x, y, radius: radius * ring / 4, fill: `rgba(${rgb},${.025 * (5 - ring)})` }, RenderLayer.LIGHTING, ring); }

  function renderHud() { renderer.rect({ x: 8, y: 8, width: 102, height: 22, fill: 'rgba(30,26,29,.82)', stroke: '#8d7853', radius: 3 }, RenderLayer.UI); renderer.rect({ x: 14, y: 14, width: 88 * player.health / player.maxHealth, height: 5, fill: PALETTE.blood }, RenderLayer.UI, 1); renderer.rect({ x: 14, y: 22, width: 88 * player.stamina / player.maxStamina, height: 3, fill: '#c0a65b' }, RenderLayer.UI, 1); renderer.text({ text: questText(), x: 192, y: 14, align: 'center', fill: PALETTE.parchment, font: '7px Georgia' }); const target = nearestInteractable(); if (target) renderer.text({ text: `E  ${target.name}`, x: 192, y: 196, align: 'center', fill: PALETTE.parchment, font: 'bold 8px Georgia' }); if (state.toastTime > 0) { renderer.rect({ x: 55, y: 164, width: 274, height: 30, fill: 'rgba(25,22,24,.9)', stroke: '#8d7853', radius: 4 }, RenderLayer.UI); renderer.text({ text: state.toast, x: 192, y: 177, align: 'center', fill: PALETTE.parchment, font: '7px Georgia', wrapWidth: 250, lineHeight: 8, maxLines: 2 }); } if (state.storyPending) renderer.text({ text: '✦ The storyteller is turning a page…', x: 192, y: 207, align: 'center', fill: '#e3a85e', font: 'italic 7px Georgia' }); renderer.text({ text: 'TAB Chronicle', x: 376, y: 210, align: 'right', fill: '#d2bf92', font: '7px Georgia' }); }
  function renderDialogue() { renderer.rect({ x: 20, y: 142, width: 344, height: 66, fill: '#2b2628', stroke: '#b59a67', radius: 5 }, RenderLayer.UI, 10); if (state.dialogue === 'decision') { renderer.text({ text: 'Corven: Break the seal and the river may flood—or bind me here so Millhaven prospers.', x: 32, y: 158, fill: PALETTE.parchment, font: '7px Georgia', wrapWidth: 318, lineHeight: 9, maxLines: 3 }, RenderLayer.UI, 11); renderer.text({ text: 'J — Break the seal     K — Renew the binding', x: 192, y: 199, align: 'center', fill: '#e3a85e', font: 'bold 7px Georgia' }, RenderLayer.UI, 11); } else { const target = INTERACTABLES.find((t) => t.id === state.dialogue); renderer.text({ text: target?.name ?? '', x: 32, y: 156, fill: '#e3a85e', font: 'bold 8px Georgia' }, RenderLayer.UI, 11); renderer.text({ text: DIALOGUE[state.dialogue][state.dialogueIndex], x: 32, y: 169, fill: PALETTE.parchment, font: '7px Georgia', wrapWidth: 304, lineHeight: 9, maxLines: 4 }, RenderLayer.UI, 11); renderer.text({ text: 'E', x: 348, y: 201, align: 'right', fill: '#b59a67', font: 'bold 7px Georgia' }, RenderLayer.UI, 11); } }
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

  function questText() { return ['Speak with the people of Millhaven', 'Investigate Blackwater Road', 'Follow the signs toward the river', 'Search the Sunken Ruin', 'Defeat the ruin’s guardian', 'Open the Gloam Gate', 'Face what waits beneath Blackwater', 'Decide the river oath', 'Return to the campfire'][state.quest] ?? 'The Chronicle continues'; }
  function toast(message) { state.toast = message; state.toastTime = 4; }
  function collides(x, y) { return OBSTACLES.some((o) => x > o.x - 10 && x < o.x + o.width + 10 && y > o.y - 10 && y < o.y + o.height + 10); }

  return {
    state, player, platform,
    start() { if (state.running) return; state.running = true; previousTime = null; requestId = platform.scheduler.request(frame); },
    stop() { persist(); state.running = false; platform.scheduler.cancel(requestId); platform.input.dispose(); },
  };

  function persist() {
    platform.storage?.save?.({ schema_version: 1, openingSeen: state.mode !== 'opening', player: { x: player.x, y: player.y, health: player.health, stamina: player.stamina }, quest: state.quest, discoveries: [...state.discoveries], chronicle: state.chronicle, rumor: state.rumor, outcome: state.outcome, bossAwake: state.bossAwake, inventory: state.inventory });
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
