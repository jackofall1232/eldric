// Painted-storybook art for Eldric. Pure draw helpers over the engine's command renderer.
// Every function takes a frame context: { renderer, camera, canvas, art, state, player, … }.
// All random detail is baked once by createArtCache with a SeededRng — never in the loop.
import { RenderLayer, SeededRng } from '@eldric/engine';

export const PALETTE = Object.freeze({
  ink: '#2a2430', parchment: '#e8d2a2', moss: '#4c6849', forest: '#182b2b',
  river: '#28546a', ember: '#e38b45', moon: '#b8c8c0', blood: '#8d3e3a', grass: '#63854b',
  gold: '#e0b45c', rule: '#8c714d', quill: '#684738',
});

const ROAD = Object.freeze({ x0: 400, x1: 910, dropTop: 48, dropBottom: 28, top: 330, bottom: 402 });
const RIVER = Object.freeze({ x: 880, width: 150 });
const BRIDGE = Object.freeze({ x: 850, y: 322, width: 210, height: 70 });

const GRASS_TONES = ['92,124,68', '118,152,86', '74,104,60', '134,166,94', '60,90,56', '146,176,102'];
const TUFT_TONES = ['rgba(48,68,46,.34)', 'rgba(122,150,92,.3)', 'rgba(62,88,56,.3)', 'rgba(96,124,74,.28)'];

// Cosmetic-only village dressing: trodden ground and clutter. No collision, no gameplay data.
const VILLAGE_GROUND = Object.freeze([
  { x: 258, y: 392, rx: 62, ry: 38 }, { x: 250, y: 452, rx: 96, ry: 24 },
  { x: 159, y: 316, rx: 32, ry: 20 }, { x: 334, y: 312, rx: 30, ry: 19 },
  { x: 152, y: 508, rx: 32, ry: 20 }, { x: 342, y: 512, rx: 30, ry: 19 },
  { x: 205, y: 350, rx: 54, ry: 22 },
]);
const VILLAGE_PROPS = Object.freeze([
  { kind: 'barrel', x: 74, y: 306 }, { kind: 'barrel', x: 232, y: 302 }, { kind: 'barrel', x: 236, y: 508 },
  { kind: 'crate', x: 66, y: 512 }, { kind: 'crate', x: 402, y: 372 },
  { kind: 'hay', x: 432, y: 470 }, { kind: 'hay', x: 60, y: 360 },
  { kind: 'well', x: 208, y: 452 },
  { kind: 'logs', x: 68, y: 468 },
  { kind: 'lantern', x: 302, y: 358 }, { kind: 'lantern', x: 196, y: 412 },
  { kind: 'sign', x: 436, y: 344 },
  { kind: 'bed', x: 128, y: 306 }, { kind: 'bed', x: 312, y: 300 },
]);
const VILLAGE_FENCE = Object.freeze({ x0: 96, x1: 404, y: 566, step: 40 });
const FLOWER_TONES = ['#e7dfb6', '#cfd9ea', '#d6c2e2', '#e6c07c'];
const TREE_TONES = [
  ['#17322a', '#25493a', '#376544', '#4d8351', '#6ea25c'],
  ['#1b3428', '#2a5138', '#3d6f43', '#57894f', '#79a75f'],
  ['#152d2c', '#22453f', '#33664f', '#498360', '#67a071'],
];
const HOUSE_TONES = [
  { wall: '#cfb387', shade: '#a68a63', beam: '#5b4130', roof: '#96683a', roofDark: '#6f4728', roofLit: '#b98748' },
  { wall: '#c7ab84', shade: '#9d8360', beam: '#523a2c', roof: '#7a5545', roofDark: '#57392f', roofLit: '#9a6d55' },
  { wall: '#d3b98f', shade: '#ab916a', beam: '#614732', roof: '#8b6b3c', roofDark: '#66492a', roofLit: '#ad8a4d' },
  { wall: '#c2a97f', shade: '#987f5c', beam: '#4d3729', roof: '#6d5b4a', roofDark: '#4c4034', roofLit: '#8b7660' },
];

// ── static detail bake ────────────────────────────────────────────────────────
export function createArtCache({ world, obstacles, trees, seed = 'eldric-art-v2' } = {}) {
  const rng = new SeededRng(seed);
  const patches = [];
  const tufts = [];
  const flowers = [];
  const pebbles = [];
  const glints = [];
  const reeds = [];
  const stones = [];

  const dapples = [];
  const dust = [];
  for (let index = 0; index < 185; index += 1) {
    const x = rng.int(4, world.width - 4);
    const y = rng.int(4, world.height - 4);
    if (inRiver(x) || onRoad(x, y)) continue;
    const rx = 14 + rng.next() * 30;
    patches.push({ x, y, rx, ry: rx * (.58 + rng.next() * .24),
      rotation: rng.next() * Math.PI, tone: GRASS_TONES[rng.int(0, GRASS_TONES.length - 1)], alpha: .16 + rng.next() * .3 });
  }
  for (let index = 0; index < 52; index += 1) {
    const x = rng.int(4, world.width - 4);
    const y = rng.int(4, world.height - 4);
    if (inRiver(x)) continue;
    dapples.push({ x, y, r: 9 + rng.next() * 17, warm: rng.chance(.62), alpha: .1 + rng.next() * .14 });
  }
  for (let index = 0; index < 28; index += 1) {
    const x = ROAD.x0 + rng.next() * (ROAD.x1 - ROAD.x0);
    const span = roadSpan(x);
    dust.push({ x, y: span.top + rng.next() * (span.bottom - span.top), r: 8 + rng.next() * 16,
      light: rng.chance(.55), alpha: .1 + rng.next() * .16 });
  }
  for (let index = 0; index < 380; index += 1) {
    const x = rng.int(3, world.width - 3);
    const y = rng.int(3, world.height - 3);
    if (inRiver(x) || onRoad(x, y)) continue;
    tufts.push({ x, y, h: 1.4 + rng.next() * 1.6, tone: TUFT_TONES[rng.int(0, TUFT_TONES.length - 1)] });
  }
  for (let index = 0; index < 90; index += 1) {
    const x = rng.int(6, world.width - 6);
    const y = rng.int(6, world.height - 6);
    if (inRiver(x) || onRoad(x, y)) continue;
    flowers.push({ x, y, tone: FLOWER_TONES[rng.int(0, FLOWER_TONES.length - 1)], r: rng.next() < .3 ? 1.4 : 1 });
  }
  for (let index = 0; index < 64; index += 1) {
    const x = ROAD.x0 + rng.next() * (ROAD.x1 - ROAD.x0);
    const span = roadSpan(x);
    const edge = rng.chance(.5);
    const y = edge ? span.top + rng.next() * 5 : span.bottom - rng.next() * 5;
    pebbles.push({ x, y, r: .8 + rng.next() * 1.5, tone: rng.chance(.5) ? 'rgba(96,84,62,.75)' : 'rgba(178,160,124,.7)' });
  }
  for (let index = 0; index < 90; index += 1) {
    glints.push({ x: RIVER.x + 12 + rng.next() * (RIVER.width - 24), y: rng.int(0, world.height),
      len: 5 + rng.next() * 18, phase: rng.next() * 6.28, speed: .5 + rng.next() * .9, alpha: .12 + rng.next() * .3 });
  }
  const ripples = [];
  for (let index = 0; index < 64; index += 1) {
    ripples.push({ x: RIVER.x + 10 + rng.next() * (RIVER.width - 20), y: rng.int(0, world.height),
      rx: 10 + rng.next() * 26, phase: rng.next() * 6.28, dark: rng.chance(.5), alpha: .07 + rng.next() * .1 });
  }
  const foam = [];
  for (let index = 0; index < 80; index += 1) {
    const left = rng.chance(.5);
    foam.push({ x: left ? RIVER.x + 1 + rng.next() * 5 : RIVER.x + RIVER.width - 6 + rng.next() * 5,
      y: rng.int(0, world.height), len: 3 + rng.next() * 6, phase: rng.next() * 6.28 });
  }
  for (let index = 0; index < 60; index += 1) {
    const left = rng.chance(.5);
    reeds.push({ x: left ? RIVER.x - 3 + rng.next() * 9 : RIVER.x + RIVER.width - 6 + rng.next() * 9,
      y: rng.int(0, world.height), h: 5 + rng.next() * 7, lean: (rng.next() - .5) * 4, dark: rng.chance(.5) });
  }
  for (let index = 0; index < 48; index += 1) {
    const left = rng.chance(.5);
    stones.push({ x: left ? RIVER.x - 8 + rng.next() * 10 : RIVER.x + RIVER.width - 4 + rng.next() * 10,
      y: rng.int(0, world.height), r: 1.4 + rng.next() * 2.6 });
  }

  // trees are decoration only, so the ones that would stand in the river are simply not drawn
  const treeArt = trees.filter((tree) => !inRiver(tree.x)).map((tree) => ({
    x: tree.x, y: tree.y, size: tree.size,
    tone: TREE_TONES[rng.int(0, TREE_TONES.length - 1)],
    lean: (rng.next() - .5) * 3, sway: rng.next() * 6.28, trunk: 4 + rng.int(0, 2),
    // lumpy silhouette lobes, then cluster and highlight blobs — all baked once
    lobes: Array.from({ length: 3 }, (_, index) => ({
      dx: (index - 1) * .46 + (rng.next() - .5) * .3, dy: (rng.next() - .5) * .34, r: .78 + rng.next() * .26,
    })),
    clusters: Array.from({ length: 2 }, () => ({
      dx: (rng.next() - .5) * 1.1, dy: (rng.next() - .5) * .9, r: .38 + rng.next() * .26,
    })),
  }));

  const houseArt = obstacles.map((obstacle, index) => {
    const tone = HOUSE_TONES[index % HOUSE_TONES.length];
    const beams = [];
    const braces = [];
    if (obstacle.kind === 'house') {
      for (let x = 14; x < obstacle.width - 8; x += 20 + rng.int(0, 6)) beams.push(x);
      for (const x of beams) if (rng.chance(.55)) braces.push({ x, dir: rng.chance(.5) ? 1 : -1 });
    }
    const rows = [];
    for (let step = 0; step < 6; step += 1) rows.push(.06 + rng.next() * .04);
    return { tone, beams, braces, rows, thatch: index % 2 === 0, jitter: rng.next() };
  });

  const embers = Array.from({ length: 6 }, () => ({ phase: rng.next(), drift: (rng.next() - .5) * 2.4, size: .8 + rng.next() * .9 }));
  const props = VILLAGE_PROPS.map((prop) => ({ ...prop, jitter: rng.next() }));
  return { patches, tufts, flowers, pebbles, glints, ripples, foam, reeds, stones, dapples, dust,
    trees: treeArt, houses: houseArt, embers, props };
}

function roadSpan(x) {
  const t = clamp01((x - ROAD.x0) / (ROAD.x1 - ROAD.x0));
  return { top: ROAD.top - ROAD.dropTop * t, bottom: ROAD.bottom - ROAD.dropBottom * t };
}
function onRoad(x, y) {
  if (x < ROAD.x0 - 6 || x > ROAD.x1 + 6) return false;
  const span = roadSpan(x);
  return y > span.top - 5 && y < span.bottom + 5;
}
function inRiver(x) { return x > RIVER.x - 14 && x < RIVER.x + RIVER.width + 14; }
function clamp01(value) { return Math.max(0, Math.min(1, value)); }
function inView(view, x, y, pad = 0) {
  return x >= view.x0 - pad && x <= view.x1 + pad && y >= view.y0 - pad && y <= view.y1 + pad;
}
function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

// Frame context: offsets are rounded once so every world shape lands on the same pixel grid.
export function prepareFrame(ctx) {
  const { camera, canvas } = ctx;
  ctx.bossBanner = false;
  ctx.ox = Math.round(canvas.width / 2 - camera.x + camera.shakeX);
  ctx.oy = Math.round(canvas.height / 2 - camera.y + camera.shakeY);
  ctx.view = ctx.view ?? { x0: 0, y0: 0, x1: 0, y1: 0 };
  ctx.view.x0 = camera.x - canvas.width / 2;
  ctx.view.y0 = camera.y - canvas.height / 2;
  ctx.view.x1 = camera.x + canvas.width / 2;
  ctx.view.y1 = camera.y + canvas.height / 2;
  return ctx;
}

// ── world ─────────────────────────────────────────────────────────────────────
export function drawWorld(ctx) {
  prepareFrame(ctx);
  drawTerrain(ctx);
  drawRoad(ctx);
  drawRiver(ctx);
  drawBridge(ctx);
  drawVillage(ctx);
  for (const tree of ctx.art.trees) if (inView(ctx.view, tree.x, tree.y, tree.size * 1.4 + 6)) drawTree(ctx, tree);
  ctx.obstacles.forEach((obstacle, index) => {
    if (inView(ctx.view, obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 72)) drawObstacle(ctx, obstacle, ctx.art.houses[index]);
  });
  for (const target of ctx.interactables) if (inView(ctx.view, target.x, target.y, 30)) drawInteractable(ctx, target);
  for (const enemy of ctx.enemies) {
    if (!enemy.alive || (enemy.kind === 'boss' && !ctx.state.bossAwake)) continue;
    if (inView(ctx.view, enemy.x, enemy.y, 48)) drawEnemy(ctx, enemy);
  }
  drawHero(ctx, ctx.heroX, ctx.heroY);
  drawParticles(ctx);
  drawAtmosphere(ctx);
}

function drawTerrain(ctx) {
  const { renderer, art, ox, oy, view, canvas } = ctx;
  renderer.rect({ x: 0, y: 0, width: canvas.width, height: canvas.height, fill: PALETTE.grass }, RenderLayer.GROUND, 0);
  renderer.rect({ x: 0, y: 0, width: canvas.width, height: canvas.height, fill: {
    type: 'linear', x0: 0, y0: 0, x1: canvas.width * .45, y1: canvas.height,
    stops: [[0, 'rgba(216,208,132,.16)'], [.5, 'rgba(0,0,0,0)'], [1, 'rgba(34,52,42,.3)']],
  } }, RenderLayer.GROUND, 1);
  for (const patch of art.patches) {
    if (!inView(view, patch.x, patch.y, 46)) continue;
    const px = patch.x + ox; const py = patch.y + oy;
    renderer.ellipse({ x: px, y: py, radiusX: patch.rx, radiusY: patch.ry, rotation: patch.rotation, fill: {
      type: 'radial', x0: px, y0: py, r0: 0, x1: px, y1: py, r1: patch.rx,
      stops: [[0, `rgba(${patch.tone},${patch.alpha})`], [.6, `rgba(${patch.tone},${patch.alpha * .55})`], [1, `rgba(${patch.tone},0)`]],
    } }, RenderLayer.GROUND, 2);
  }
  for (const dapple of art.dapples) {
    if (!inView(view, dapple.x, dapple.y, 22)) continue;
    const dx = dapple.x + ox; const dy = dapple.y + oy;
    const rgb = dapple.warm ? '246,224,150' : '30,52,44';
    renderer.circle({ x: dx, y: dy, radius: dapple.r, fill: {
      type: 'radial', x0: dx, y0: dy, r0: 0, x1: dx, y1: dy, r1: dapple.r,
      stops: [[0, `rgba(${rgb},${dapple.alpha})`], [1, `rgba(${rgb},0)`]],
    } }, RenderLayer.GROUND, 3);
  }
  for (const tuft of art.tufts) {
    if (!inView(view, tuft.x, tuft.y, 6)) continue;
    const x = tuft.x + ox; const y = tuft.y + oy;
    renderer.path({ points: [{ x: x - 2, y }, { x: x - 1, y: y - tuft.h }, { x, y: y - 1 }, { x: x + 1.4, y: y - tuft.h + .6 }, { x: x + 2.4, y }],
      stroke: tuft.tone, close: false }, RenderLayer.DETAIL, 0);
  }
  for (const flower of art.flowers) {
    if (!inView(view, flower.x, flower.y, 6)) continue;
    renderer.circle({ x: flower.x + ox, y: flower.y + oy, radius: flower.r, fill: flower.tone, alpha: .8 }, RenderLayer.DETAIL, 1);
  }
}

function drawRoad(ctx) {
  const { renderer, art, ox, oy, view } = ctx;
  if (view.x1 < ROAD.x0 - 20 || view.x0 > ROAD.x1 + 20) return;
  const left = roadSpan(ROAD.x0); const right = roadSpan(ROAD.x1);
  const x0 = ROAD.x0 + ox; const x1 = ROAD.x1 + ox;
  renderer.polygon({ points: [
    { x: x0 - 4, y: left.top + oy - 3 }, { x: x1 + 4, y: right.top + oy - 3 },
    { x: x1 + 4, y: right.bottom + oy + 3 }, { x: x0 - 4, y: left.bottom + oy + 3 },
  ], fill: '#7a6a4d', alpha: .55 }, RenderLayer.GROUND, 3);
  renderer.polygon({ points: [
    { x: x0, y: left.top + oy }, { x: x1, y: right.top + oy },
    { x: x1, y: right.bottom + oy }, { x: x0, y: left.bottom + oy },
  ], fill: { type: 'linear', x0: 0, y0: left.top + oy, x1: 0, y1: left.bottom + oy,
    stops: [[0, '#8d7a58'], [.4, '#a89065'], [1, '#7f6d4d']] } }, RenderLayer.GROUND, 4);
  for (const rut of [.34, .66]) {
    const y0 = left.top + (left.bottom - left.top) * rut + oy;
    const y1 = right.top + (right.bottom - right.top) * rut + oy;
    renderer.line({ x1: x0, y1: y0, x2: x1, y2: y1, stroke: 'rgba(88,72,48,.5)', lineWidth: 3 }, RenderLayer.GROUND, 5);
    renderer.line({ x1: x0, y1: y0 - 1.5, x2: x1, y2: y1 - 1.5, stroke: 'rgba(200,180,138,.22)', lineWidth: 1 }, RenderLayer.GROUND, 6);
  }
  for (const wash of art.dust) {
    if (!inView(view, wash.x, wash.y, 22)) continue;
    const wx = wash.x + ox; const wy = wash.y + oy;
    const rgb = wash.light ? '198,176,132' : '110,92,62';
    renderer.ellipse({ x: wx, y: wy, radiusX: wash.r * 1.4, radiusY: wash.r * .7, fill: {
      type: 'radial', x0: wx, y0: wy, r0: 0, x1: wx, y1: wy, r1: wash.r * 1.4,
      stops: [[0, `rgba(${rgb},${wash.alpha})`], [1, `rgba(${rgb},0)`]],
    } }, RenderLayer.GROUND, 6);
  }
  for (const pebble of art.pebbles) {
    if (!inView(view, pebble.x, pebble.y, 6)) continue;
    renderer.circle({ x: pebble.x + ox, y: pebble.y + oy, radius: pebble.r, fill: pebble.tone }, RenderLayer.GROUND, 7);
  }
}

function drawRiver(ctx) {
  const { renderer, art, ox, oy, view, clock, world } = ctx;
  if (view.x1 < RIVER.x - 24 || view.x0 > RIVER.x + RIVER.width + 24) return;
  const x = RIVER.x + ox; const y = oy; const h = world.height;
  renderer.rect({ x: x - 9, y, width: RIVER.width + 18, height: h, fill: '#6a5a41' }, RenderLayer.GROUND, 3);
  renderer.rect({ x: x - 5, y, width: RIVER.width + 10, height: h, fill: '#5b4d38' }, RenderLayer.GROUND, 4);
  renderer.rect({ x, y, width: RIVER.width, height: h, fill: {
    type: 'linear', x0: x, y0: 0, x1: x + RIVER.width, y1: 0,
    stops: [[0, '#3d7f92'], [.16, '#2a6280'], [.5, '#1a4159'], [.84, '#2a6280'], [1, '#3d7f92']],
  } }, RenderLayer.GROUND, 5);
  for (const ripple of art.ripples) {
    if (!inView(view, ripple.x, ripple.y, 30)) continue;
    const drift = Math.sin(clock * .5 + ripple.phase) * 5;
    renderer.ellipse({ x: ripple.x + ox + drift, y: ripple.y + oy, radiusX: ripple.rx, radiusY: 2.4,
      fill: ripple.dark ? '#123448' : '#4d8ea0', alpha: ripple.alpha }, RenderLayer.GROUND, 5.4);
  }
  for (const bubble of art.foam) {
    if (!inView(view, bubble.x, bubble.y, 12)) continue;
    const fy = bubble.y + oy + Math.sin(clock * 1.1 + bubble.phase) * 1.5;
    renderer.line({ x1: bubble.x + ox, y1: fy, x2: bubble.x + ox + bubble.len, y2: fy,
      stroke: 'rgba(206,232,230,.3)' }, RenderLayer.GROUND, 5.6);
  }
  for (const glint of art.glints) {
    if (!inView(view, glint.x, glint.y, 20)) continue;
    const drift = Math.sin(clock * glint.speed + glint.phase) * 7;
    const gy = glint.y + oy;
    renderer.line({ x1: glint.x + ox + drift, y1: gy, x2: glint.x + ox + drift + glint.len, y2: gy,
      stroke: '#cfe6e4', alpha: glint.alpha + Math.sin(clock * 2 + glint.phase) * .06 }, RenderLayer.GROUND, 6);
  }
  for (const stone of art.stones) {
    if (!inView(view, stone.x, stone.y, 8)) continue;
    renderer.ellipse({ x: stone.x + ox, y: stone.y + oy, radiusX: stone.r * 1.3, radiusY: stone.r,
      fill: '#7b7266', stroke: 'rgba(38,34,28,.5)' }, RenderLayer.GROUND, 7);
  }
  for (const reed of art.reeds) {
    if (!inView(view, reed.x, reed.y, 12)) continue;
    const rx = reed.x + ox; const ry = reed.y + oy;
    const bend = Math.sin(clock * 1.3 + reed.y * .05) * 1.4 + reed.lean;
    renderer.line({ x1: rx, y1: ry, x2: rx + bend, y2: ry - reed.h, stroke: reed.dark ? '#2f4a35' : '#54704a', lineWidth: 1 }, RenderLayer.DETAIL, 2);
  }
}

function drawBridge(ctx) {
  const { renderer, ox, oy, view } = ctx;
  if (!inView(view, BRIDGE.x + BRIDGE.width / 2, BRIDGE.y + BRIDGE.height / 2, 160)) return;
  const x = BRIDGE.x + ox; const y = BRIDGE.y + oy; const w = BRIDGE.width; const h = BRIDGE.height;
  renderer.rect({ x: x + 8, y: y + h, width: w - 16, height: 16, fill: {
    type: 'linear', x0: 0, y0: y + h, x1: 0, y1: y + h + 16,
    stops: [[0, 'rgba(6,16,22,.55)'], [1, 'rgba(6,16,22,0)']],
  } }, RenderLayer.GROUND, 8);
  // stone abutments plus voussoir rings that read as the arch masonry
  for (const side of [0, 1]) {
    const ax = side ? x + w - 34 : x;
    renderer.rect({ x: ax, y: y - 6, width: 34, height: h + 12, fill: '#7d7568', stroke: '#3a352d', radius: 2 }, RenderLayer.OBJECT, BRIDGE.y - 2);
    renderer.rect({ x: ax + 2, y: y - 4, width: 30, height: 6, fill: '#948b7c' }, RenderLayer.OBJECT, BRIDGE.y - 1);
    for (let block = 0; block < 4; block += 1) {
      renderer.rect({ x: ax + 2 + (block % 2) * 8, y: y + 4 + block * 15, width: 15, height: 13,
        fill: block % 2 ? '#8b8272' : '#736b5f', stroke: 'rgba(42,38,32,.5)', radius: 1 }, RenderLayer.OBJECT, BRIDGE.y - 1);
    }
  }
  for (const edge of [-1, 1]) {
    const baseY = edge < 0 ? y : y + h;
    for (let stone = 0; stone < 8; stone += 1) {
      const a0 = Math.PI * (stone / 8); const a1 = Math.PI * ((stone + 1) / 8);
      const points = [];
      for (const [angle, radius] of [[a0, 1], [a1, 1], [a1, .62], [a0, .62]]) {
        points.push({ x: x + w / 2 - Math.cos(angle) * 44 * radius, y: baseY + edge * Math.sin(angle) * 13 * radius });
      }
      renderer.polygon({ points, fill: stone % 2 ? '#8d8474' : '#79705f', stroke: 'rgba(44,40,34,.6)' }, RenderLayer.OBJECT, BRIDGE.y);
    }
  }
  renderer.rect({ x, y, width: w, height: h, fill: { type: 'linear', x0: 0, y0: y, x1: 0, y1: y + h,
    stops: [[0, '#7b5c3c'], [.5, '#6a4c31'], [1, '#523a26']] }, stroke: '#2f2722' }, RenderLayer.OBJECT, BRIDGE.y + 1);
  for (let plank = 0; plank < w; plank += 21) {
    renderer.line({ x1: x + plank, y1: y + 2, x2: x + plank, y2: y + h - 2, stroke: 'rgba(150,116,74,.6)' }, RenderLayer.OBJECT, BRIDGE.y + 2);
    renderer.line({ x1: x + plank + 5, y1: y + 3, x2: x + plank + 5, y2: y + h - 3, stroke: 'rgba(46,34,24,.4)' }, RenderLayer.OBJECT, BRIDGE.y + 2);
  }
  for (const edge of [y, y + h]) {
    renderer.line({ x1: x, y1: edge, x2: x + w, y2: edge, stroke: '#8f7a55', lineWidth: 2 }, RenderLayer.OBJECT, BRIDGE.y + 3);
    for (let post = 6; post < w - 4; post += 34) {
      renderer.rect({ x: x + post, y: edge - 5, width: 4, height: 10, fill: '#6d573a', stroke: '#2e251d' }, RenderLayer.OBJECT, BRIDGE.y + 4);
      renderer.rect({ x: x + post, y: edge - 5, width: 4, height: 3, fill: '#9a8158' }, RenderLayer.OBJECT, BRIDGE.y + 5);
    }
  }
}

// Trodden earth, fences and clutter — purely decorative dressing for the village.
function drawVillage(ctx) {
  const { renderer, art, ox, oy, view, clock } = ctx;
  if (view.x0 > 470 || view.y0 > 620 || view.y1 < 180) return;
  for (const ground of VILLAGE_GROUND) {
    if (!inView(view, ground.x, ground.y, ground.rx + 12)) continue;
    const gx = ground.x + ox; const gy = ground.y + oy;
    renderer.ellipse({ x: gx, y: gy, radiusX: ground.rx, radiusY: ground.ry, fill: {
      type: 'radial', x0: gx, y0: gy, r0: 0, x1: gx, y1: gy, r1: ground.rx,
      stops: [[0, 'rgba(150,128,90,.55)'], [.62, 'rgba(146,124,88,.3)'], [1, 'rgba(146,124,88,0)']],
    } }, RenderLayer.GROUND, 4);
  }
  if (view.y1 > VILLAGE_FENCE.y - 30 && view.y0 < VILLAGE_FENCE.y + 20) {
    const fy = VILLAGE_FENCE.y + oy;
    renderer.line({ x1: VILLAGE_FENCE.x0 + ox, y1: fy - 8, x2: VILLAGE_FENCE.x1 + ox, y2: fy - 8, stroke: '#6d5537', lineWidth: 2 }, RenderLayer.OBJECT, VILLAGE_FENCE.y);
    renderer.line({ x1: VILLAGE_FENCE.x0 + ox, y1: fy - 3, x2: VILLAGE_FENCE.x1 + ox, y2: fy - 3, stroke: '#5b452d', lineWidth: 2 }, RenderLayer.OBJECT, VILLAGE_FENCE.y);
    for (let px = VILLAGE_FENCE.x0; px <= VILLAGE_FENCE.x1; px += VILLAGE_FENCE.step) {
      if (!inView(view, px, VILLAGE_FENCE.y, 12)) continue;
      renderer.rect({ x: px + ox - 2, y: fy - 13, width: 4, height: 15, fill: '#7a6040', stroke: '#33281c' }, RenderLayer.OBJECT, VILLAGE_FENCE.y + 1);
    }
  }
  for (const prop of art.props) {
    if (!inView(view, prop.x, prop.y, 26)) continue;
    drawProp(ctx, prop, prop.x + ox, prop.y + oy, prop.y, clock);
  }
}

function drawProp(ctx, prop, x, y, order, clock) {
  const { renderer } = ctx;
  renderer.ellipse({ x: x + 2, y: y + 6, radiusX: 9, radiusY: 3.4, fill: 'rgba(16,22,20,.26)' }, RenderLayer.DETAIL, order - 1);
  if (prop.kind === 'barrel') {
    renderer.rect({ x: x - 6, y: y - 12, width: 12, height: 18, fill: { type: 'linear', x0: x - 6, y0: 0, x1: x + 6, y1: 0,
      stops: [[0, '#8a6440'], [1, '#5c422a']] }, stroke: '#2e231a', radius: 3 }, RenderLayer.OBJECT, order);
    for (const band of [y - 8, y - 1, y + 4]) renderer.line({ x1: x - 6, y1: band, x2: x + 6, y2: band, stroke: '#3f3b34', lineWidth: 1.6 }, RenderLayer.OBJECT, order + 1);
    renderer.ellipse({ x, y: y - 12, radiusX: 6, radiusY: 2.4, fill: '#9d7549', stroke: '#2e231a' }, RenderLayer.OBJECT, order + 2);
  } else if (prop.kind === 'crate') {
    renderer.rect({ x: x - 7, y: y - 11, width: 14, height: 16, fill: '#8b6c45', stroke: '#2e231a', radius: 1 }, RenderLayer.OBJECT, order);
    renderer.line({ x1: x - 7, y1: y - 11, x2: x + 7, y2: y + 5, stroke: 'rgba(58,42,28,.65)', lineWidth: 1.6 }, RenderLayer.OBJECT, order + 1);
    renderer.line({ x1: x + 7, y1: y - 11, x2: x - 7, y2: y + 5, stroke: 'rgba(58,42,28,.65)', lineWidth: 1.6 }, RenderLayer.OBJECT, order + 1);
    renderer.rect({ x: x - 7, y: y - 11, width: 14, height: 3, fill: 'rgba(216,182,124,.35)' }, RenderLayer.OBJECT, order + 2);
  } else if (prop.kind === 'hay') {
    renderer.ellipse({ x, y: y - 2, radiusX: 12, radiusY: 9, fill: '#c2a057', stroke: '#7b6231' }, RenderLayer.OBJECT, order);
    renderer.ellipse({ x: x - 3, y: y - 5, radiusX: 7, radiusY: 4.4, fill: '#d9bb72' }, RenderLayer.OBJECT, order + 1);
    for (let straw = -2; straw <= 2; straw += 1) {
      renderer.line({ x1: x + straw * 4, y1: y - 6, x2: x + straw * 5, y2: y - 12, stroke: 'rgba(214,182,110,.7)' }, RenderLayer.OBJECT, order + 2);
    }
  } else if (prop.kind === 'well') {
    renderer.ellipse({ x, y: y + 1, radiusX: 13, radiusY: 8, fill: '#7d7568', stroke: '#3a352d', lineWidth: 2 }, RenderLayer.OBJECT, order);
    renderer.ellipse({ x, y: y - 1, radiusX: 9, radiusY: 5, fill: '#15242a' }, RenderLayer.OBJECT, order + 1);
    for (const post of [-10, 10]) renderer.rect({ x: x + post - 1.5, y: y - 20, width: 3, height: 20, fill: '#6d5537', stroke: '#2f2519' }, RenderLayer.OBJECT, order + 2);
    renderer.polygon({ points: [{ x: x - 15, y: y - 18 }, { x, y: y - 28 }, { x: x + 15, y: y - 18 }], fill: '#7a5540', stroke: '#2f2519' }, RenderLayer.OBJECT, order + 3);
    renderer.line({ x1: x, y1: y - 19, x2: x, y2: y - 8, stroke: '#4b4239' }, RenderLayer.OBJECT, order + 4);
    renderer.rect({ x: x - 3, y: y - 9, width: 6, height: 5, fill: '#5f4a30', stroke: '#2a2118' }, RenderLayer.OBJECT, order + 5);
  } else if (prop.kind === 'logs') {
    for (let log = 0; log < 2; log += 1) {
      renderer.ellipse({ x: x - 6 + log * 6, y: y - 2 - (log === 1 ? 5 : 0), radiusX: 4, radiusY: 3.6, fill: '#8a6a48', stroke: '#3a2c1e' }, RenderLayer.OBJECT, order + log);
      renderer.circle({ x: x - 6 + log * 6, y: y - 2 - (log === 1 ? 5 : 0), radius: 1.6, fill: '#b18f61' }, RenderLayer.OBJECT, order + log + 1);
    }
  } else if (prop.kind === 'lantern') {
    renderer.rect({ x: x - 1.5, y: y - 26, width: 3, height: 28, fill: '#4f4132', stroke: '#241d16' }, RenderLayer.OBJECT, order);
    renderer.line({ x1: x, y1: y - 26, x2: x + 7, y2: y - 26, stroke: '#4f4132', lineWidth: 2 }, RenderLayer.OBJECT, order + 1);
    renderer.rect({ x: x + 4, y: y - 24, width: 7, height: 8, fill: '#ffcd7c', stroke: '#3b2f22', radius: 1 }, RenderLayer.OBJECT, order + 2);
    renderer.circle({ x: x + 7.5, y: y - 20, radius: 7, fill: {
      type: 'radial', x0: x + 7.5, y0: y - 20, r0: 0, x1: x + 7.5, y1: y - 20, r1: 7,
      stops: [[0, 'rgba(255,196,110,.4)'], [1, 'rgba(255,196,110,0)']],
    }, alpha: .7 + Math.sin(clock * 3 + prop.jitter * 6) * .12 }, RenderLayer.OBJECT, order + 3);
  } else if (prop.kind === 'sign') {
    renderer.rect({ x: x - 1.5, y: y - 24, width: 3, height: 26, fill: '#5c4830', stroke: '#291f16' }, RenderLayer.OBJECT, order);
    renderer.rect({ x: x - 14, y: y - 26, width: 28, height: 11, fill: '#8a6a45', stroke: '#2f2418', radius: 1 }, RenderLayer.OBJECT, order + 1);
    renderer.line({ x1: x - 10, y1: y - 22, x2: x + 8, y2: y - 22, stroke: 'rgba(50,38,26,.6)' }, RenderLayer.OBJECT, order + 2);
    renderer.line({ x1: x - 10, y1: y - 19, x2: x + 4, y2: y - 19, stroke: 'rgba(50,38,26,.6)' }, RenderLayer.OBJECT, order + 2);
  } else {
    for (let bloom = 0; bloom < 4; bloom += 1) {
      const bx = x + (bloom - 2) * 4; const by = y - (bloom % 2) * 3;
      renderer.line({ x1: bx, y1: by + 3, x2: bx, y2: by - 2, stroke: '#4f7043' }, RenderLayer.OBJECT, order);
      renderer.circle({ x: bx, y: by - 3, radius: 1.8, fill: FLOWER_TONES[bloom % FLOWER_TONES.length] }, RenderLayer.OBJECT, order + 1);
    }
  }
}

function drawTree(ctx, tree) {
  const { renderer, ox, oy, clock } = ctx;
  const x = tree.x + ox; const y = tree.y + oy; const s = tree.size;
  const sway = Math.sin(clock * .7 + tree.sway) * 1.2;
  const order = tree.y;
  renderer.ellipse({ x: x + 3, y: y + s * .78, radiusX: s * .95, radiusY: s * .4, fill: 'rgba(14,26,22,.32)' }, RenderLayer.DETAIL, order - 2);
  renderer.path({ points: [
    { x: x - tree.trunk, y: y + s * .72 }, { x: x - tree.trunk * .42, y: y + s * .12, cx: x - tree.trunk * .9, cy: y + s * .4 },
    { x: x + tree.trunk * .42 + tree.lean * .3, y: y + s * .12 },
    { x: x + tree.trunk, y: y + s * .72, cx: x + tree.trunk * .95, cy: y + s * .4 },
  ], fill: '#4a3524', stroke: '#2b2018' }, RenderLayer.OBJECT, order - 1);
  const cx = x + tree.lean + sway; const cy = y - s * .16;
  // lumpy silhouette in the deepest tone, then lit mass, clusters and rim sparks
  renderer.path({ points: [
    { x: cx - s * 1.02, y: cy + s * .28 },
    { x: cx - s * (.5 + tree.lobes[0].r * .2), y: cy - s * .82, cx: cx - s * 1.18, cy: cy - s * .52 },
    { x: cx + s * (.14 + tree.lobes[1].dx * .3), y: cy - s * (.9 + tree.lobes[1].r * .18), cx: cx - s * .12, cy: cy - s * 1.3 },
    { x: cx + s * .74, y: cy - s * .5, cx: cx + s * (.7 + tree.lobes[2].r * .3), cy: cy - s * 1.14 },
    { x: cx + s * 1.02, y: cy + s * .3, cx: cx + s * 1.2, cy: cy - s * .1 },
    { x: cx, y: cy + s * .86, cx: cx + s * .7, cy: cy + s * .84 },
    { x: cx - s * 1.02, y: cy + s * .28, cx: cx - s * .74, cy: cy + s * .86 },
  ], fill: tree.tone[0] }, RenderLayer.OBJECT, order);
  renderer.ellipse({ x: cx + s * .1, y: cy + s * .16, radiusX: s * .92, radiusY: s * .74, fill: tree.tone[1] }, RenderLayer.OBJECT, order + 1);
  renderer.ellipse({ x: cx - s * .16, y: cy - s * .06, radiusX: s * .78, radiusY: s * .64, fill: tree.tone[2] }, RenderLayer.OBJECT, order + 2);
  const cluster = tree.clusters[0];
  renderer.ellipse({ x: cx + s * cluster.dx, y: cy + s * cluster.dy, radiusX: s * cluster.r, radiusY: s * cluster.r * .82,
    fill: cluster.dx < 0 ? tree.tone[3] : tree.tone[2] }, RenderLayer.OBJECT, order + 3);
  renderer.ellipse({ x: cx + s * .5, y: cy + s * .46, radiusX: s * .44, radiusY: s * .3, fill: 'rgba(8,22,18,.42)' }, RenderLayer.OBJECT, order + 3);
  renderer.ellipse({ x: cx - s * .38, y: cy - s * .4, radiusX: s * .46, radiusY: s * .36, fill: tree.tone[3] }, RenderLayer.OBJECT, order + 4);
  renderer.ellipse({ x: cx - s * .46, y: cy - s * .5, radiusX: s * .26, radiusY: s * .19, fill: tree.tone[4], alpha: .9 }, RenderLayer.OBJECT, order + 5);
}

function drawObstacle(ctx, obstacle, art) {
  if (obstacle.kind === 'house') return drawHouse(ctx, obstacle, art);
  if (obstacle.kind === 'ruin') return drawRuin(ctx, obstacle);
  return drawWagon(ctx, obstacle);
}

function drawHouse(ctx, house, art) {
  const { renderer, ox, oy, state } = ctx;
  const x = house.x + ox; const y = house.y + oy; const w = house.width; const h = house.height;
  const tone = art.tone; const order = house.y;
  renderer.ellipse({ x: x + w / 2 + 5, y: y + h + 3, radiusX: w * .58, radiusY: 9, fill: 'rgba(16,22,20,.3)' }, RenderLayer.DETAIL, order - 1);
  // plaster wall with a lit left face
  renderer.rect({ x, y, width: w, height: h, fill: { type: 'linear', x0: x, y0: 0, x1: x + w, y1: 0,
    stops: [[0, tone.wall], [.55, tone.wall], [1, tone.shade]] }, stroke: PALETTE.ink, radius: 2 }, RenderLayer.OBJECT, order);
  renderer.rect({ x, y: y + h - 9, width: w, height: 9, fill: '#7e7566' }, RenderLayer.OBJECT, order + 1);
  for (let stone = 3; stone < w - 6; stone += 22) {
    renderer.rect({ x: x + stone, y: y + h - 8, width: 16, height: 6, fill: '#8d8474', stroke: 'rgba(48,44,38,.5)', radius: 1 }, RenderLayer.OBJECT, order + 2);
  }
  for (const beam of art.beams) {
    renderer.rect({ x: x + beam, y: y + 4, width: 3, height: h - 13, fill: tone.beam }, RenderLayer.OBJECT, order + 3);
  }
  for (const brace of art.braces) {
    renderer.line({ x1: x + brace.x, y1: y + h - 12, x2: x + brace.x + brace.dir * 16, y2: y + 12, stroke: tone.beam, lineWidth: 3 }, RenderLayer.OBJECT, order + 3);
  }
  renderer.rect({ x: x + 2, y: y + 3, width: w - 4, height: 3, fill: tone.beam, alpha: .8 }, RenderLayer.OBJECT, order + 3);
  renderer.rect({ x: x + 2, y: y + h * .62, width: w - 4, height: 3, fill: tone.beam, alpha: .75 }, RenderLayer.OBJECT, order + 3);
  // plaster mottling so the panels are not dead flat
  for (const blot of [[.4, .42, 22]]) {
    const bx = x + w * blot[0]; const by = y + h * blot[1];
    renderer.ellipse({ x: bx, y: by, radiusX: blot[2], radiusY: blot[2] * .66, fill: {
      type: 'radial', x0: bx, y0: by, r0: 0, x1: bx, y1: by, r1: blot[2],
      stops: [[0, 'rgba(88,68,44,.14)'], [1, 'rgba(88,68,44,0)']],
    } }, RenderLayer.OBJECT, order + 3);
  }
  // windows, warm from within
  const lit = state.hour > 17.5 || state.hour < 7 ? 1 : .55;
  for (const wx of [w * .22, w * .68]) {
    renderer.rect({ x: x + wx - 7, y: y + h * .38, width: 14, height: 12, fill: '#2f2318', stroke: tone.beam }, RenderLayer.OBJECT, order + 4);
    renderer.rect({ x: x + wx - 5, y: y + h * .38 + 2, width: 10, height: 8, fill: '#ffce7d', alpha: lit }, RenderLayer.OBJECT, order + 5);
    renderer.line({ x1: x + wx, y1: y + h * .38, x2: x + wx, y2: y + h * .38 + 12, stroke: tone.beam }, RenderLayer.OBJECT, order + 6);
    renderer.rect({ x: x + wx - 9, y: y + h * .38 + 12, width: 18, height: 2, fill: tone.beam }, RenderLayer.OBJECT, order + 6);
    for (const shutter of [-1, 1]) {
      renderer.rect({ x: x + wx + shutter * 10 - 3, y: y + h * .38, width: 6, height: 12, fill: shutter < 0 ? tone.beam : shade(tone.beam, 1.3), stroke: 'rgba(28,20,14,.6)', radius: 1 }, RenderLayer.OBJECT, order + 6);
    }
  }
  // door with lintel and iron
  const dx = x + w / 2 - 8;
  renderer.rect({ x: dx - 2, y: y + h - 29, width: 20, height: 4, fill: tone.beam }, RenderLayer.OBJECT, order + 7);
  renderer.rect({ x: dx, y: y + h - 25, width: 16, height: 25, fill: '#4a3223', stroke: '#241a14' }, RenderLayer.OBJECT, order + 7);
  renderer.line({ x1: dx + 8, y1: y + h - 24, x2: dx + 8, y2: y + h - 1, stroke: 'rgba(112,80,50,.7)' }, RenderLayer.OBJECT, order + 8);
  for (const hy of [y + h - 21, y + h - 8]) renderer.rect({ x: dx, y: hy, width: 6, height: 2, fill: '#8d8474' }, RenderLayer.OBJECT, order + 9);
  renderer.circle({ x: dx + 13, y: y + h - 12, radius: 1.4, fill: PALETTE.gold }, RenderLayer.OBJECT, order + 9);
  // roof
  const apex = y - 30; const eaveY = y + 8;
  renderer.polygon({ points: [{ x: x - 7, y: eaveY }, { x: x + w / 2, y: apex }, { x: x + w + 7, y: eaveY }],
    fill: tone.roofDark, stroke: PALETTE.ink }, RenderLayer.OBJECT, order + 10);
  renderer.polygon({ points: [{ x: x - 7, y: eaveY }, { x: x + w / 2, y: apex }, { x: x + w / 2, y: eaveY }],
    fill: tone.roofLit }, RenderLayer.OBJECT, order + 11);
  renderer.polygon({ points: [{ x: x + w / 2, y: apex }, { x: x + w + 7, y: eaveY }, { x: x + w / 2, y: eaveY }],
    fill: tone.roof }, RenderLayer.OBJECT, order + 11);
  // courses run eave-upward, each trapezoid following the roof taper and overlapping the one below
  const mid = x + w / 2;
  const span = eaveY - apex;
  const reach = w / 2 + 7;
  const stride = .9 / (art.rows.length - 1);
  for (let index = art.rows.length - 1; index >= 0; index -= 1) {
    const t = .14 + index * stride;
    const tTop = Math.max(0, t - stride * 1.45);
    const ry = apex + span * t; const ryTop = apex + span * tTop;
    const half = reach * t; const halfTop = reach * tTop;
    if (art.thatch) {
      const bumps = Math.max(3, Math.round(half / 8));
      const points = [{ x: mid - halfTop, y: ryTop }, { x: mid + halfTop, y: ryTop }, { x: mid + half, y: ry }];
      for (let bump = bumps; bump > 0; bump -= 1) {
        const nx = mid - half + 2 * half * ((bump - 1) / bumps);
        points.push({ x: nx, y: ry, cx: nx + half / bumps, cy: ry + 5.5 });
      }
      renderer.path({ points, fill: index % 2 ? tone.roofLit : tone.roofDark, stroke: 'rgba(48,30,16,.55)' }, RenderLayer.OBJECT, order + 12 + index);
      renderer.line({ x1: mid - half * .86, y1: ry - 1.5, x2: mid + half * .86, y2: ry - 1.5, stroke: 'rgba(246,212,140,.24)' }, RenderLayer.OBJECT, order + 12 + index);
    } else {
      // one banded course plus a few tile notches — cheaper than a rect per shingle
      renderer.polygon({ points: [{ x: mid - halfTop, y: ryTop }, { x: mid + halfTop, y: ryTop },
        { x: mid + half, y: ry }, { x: mid - half, y: ry }],
        fill: index % 2 ? tone.roofDark : tone.roof, stroke: 'rgba(30,22,18,.45)' }, RenderLayer.OBJECT, order + 12 + index);
      renderer.line({ x1: mid - halfTop, y1: ryTop + 1, x2: mid + halfTop, y2: ryTop + 1, stroke: 'rgba(236,204,150,.18)' }, RenderLayer.OBJECT, order + 12 + index);
      for (let notch = -2; notch <= 2; notch += 1) {
        const nx = mid + half * (notch / 2.6) + (index % 2) * 7;
        renderer.line({ x1: nx, y1: ryTop + 1, x2: nx, y2: ry - 1, stroke: 'rgba(30,22,18,.4)' }, RenderLayer.OBJECT, order + 12 + index);
      }
    }
  }
  renderer.line({ x1: x - 7, y1: eaveY, x2: x + w + 7, y2: eaveY, stroke: tone.beam, lineWidth: 2 }, RenderLayer.OBJECT, order + 13);
  renderer.line({ x1: x + w / 2, y1: apex, x2: x + w / 2, y2: eaveY, stroke: 'rgba(255,228,168,.16)', lineWidth: 2 }, RenderLayer.OBJECT, order + 13);
  // chimney with a thread of smoke
  renderer.rect({ x: x + w * .74, y: apex + 4, width: 9, height: 16, fill: '#79705f', stroke: '#332e26' }, RenderLayer.OBJECT, order + 14);
  renderer.rect({ x: x + w * .74 - 1, y: apex + 3, width: 11, height: 3, fill: '#8d8474' }, RenderLayer.OBJECT, order + 15);
  for (let puff = 0; puff < 2; puff += 1) {
    const t = (ctx.clock * .35 + art.jitter + puff * .33) % 1;
    renderer.circle({ x: x + w * .74 + 4 + Math.sin(t * 5 + puff) * 4, y: apex + 2 - t * 22,
      radius: 2 + t * 3.5, fill: 'rgba(206,198,184,.16)', alpha: 1 - t }, RenderLayer.OBJECT, order + 16);
  }
}

function drawRuin(ctx, ruin) {
  const { renderer, ox, oy } = ctx;
  const x = ruin.x + ox; const y = ruin.y + oy; const w = ruin.width; const h = ruin.height;
  const order = ruin.y;
  renderer.ellipse({ x: x + w / 2 + 4, y: y + h + 2, radiusX: w * .56, radiusY: 8, fill: 'rgba(16,22,20,.28)' }, RenderLayer.DETAIL, order - 1);
  renderer.rect({ x, y, width: w, height: h, fill: { type: 'linear', x0: x, y0: 0, x1: x + w, y1: 0,
    stops: [[0, '#7a7d74'], [1, '#54574f']] }, stroke: '#2a2c28', radius: 2 }, RenderLayer.OBJECT, order);
  for (let row = 4; row < h - 4; row += 20) {
    for (let col = 3; col < w - 10; col += 26) {
      renderer.rect({ x: x + col + (row % 40 ? 8 : 0), y: y + row, width: 22, height: 14, fill: 'rgba(140,144,132,.4)', stroke: 'rgba(40,44,40,.35)', radius: 1 }, RenderLayer.OBJECT, order + 1);
    }
  }
  renderer.polygon({ points: [{ x, y }, { x: x + w * .3, y: y - 14 }, { x: x + w * .46, y }, { x: x + w * .7, y: y - 22 }, { x: x + w, y: y - 4 }, { x: x + w, y: y + 6 }, { x, y: y + 6 }],
    fill: '#666a60', stroke: '#2a2c28' }, RenderLayer.OBJECT, order + 2);
  renderer.rect({ x: x + w * .38, y: y + h - 30, width: 20, height: 30, fill: '#20241f' }, RenderLayer.OBJECT, order + 3);
  renderer.ellipse({ x: x + w * .38 + 10, y: y + h - 30, radiusX: 10, radiusY: 9, start: Math.PI, end: 0, fill: '#20241f' }, RenderLayer.OBJECT, order + 3);
  for (const ivy of [.16, .58, .86]) {
    renderer.line({ x1: x + w * ivy, y1: y + 2, x2: x + w * ivy + 4, y2: y + h - 6, stroke: 'rgba(58,88,58,.5)', lineWidth: 3 }, RenderLayer.OBJECT, order + 4);
  }
}

function drawWagon(ctx, wagon) {
  const { renderer, ox, oy } = ctx;
  const x = wagon.x + ox; const y = wagon.y + oy; const w = wagon.width; const h = wagon.height;
  const order = wagon.y;
  renderer.ellipse({ x: x + w / 2 + 3, y: y + h + 1, radiusX: w * .58, radiusY: 7, fill: 'rgba(16,22,20,.3)' }, RenderLayer.DETAIL, order - 1);
  renderer.rect({ x, y: y + 6, width: w, height: h - 6, fill: '#6a5036', stroke: '#2b231c', radius: 2 }, RenderLayer.OBJECT, order);
  for (let plank = 4; plank < w - 4; plank += 10) {
    renderer.line({ x1: x + plank, y1: y + 8, x2: x + plank, y2: y + h - 3, stroke: 'rgba(146,112,72,.55)' }, RenderLayer.OBJECT, order + 1);
  }
  renderer.rect({ x: x - 3, y: y + 4, width: w + 6, height: 5, fill: '#4c3a28', stroke: '#241d18' }, RenderLayer.OBJECT, order + 2);
  renderer.path({ points: [{ x: x + 6, y: y + 8 }, { x: x + w / 2, y: y - 14, cx: x + w * .2, cy: y - 16 }, { x: x + w - 6, y: y + 8, cx: x + w * .8, cy: y - 16 }],
    fill: '#a89b81', stroke: '#4e463a' }, RenderLayer.OBJECT, order + 3);
  renderer.path({ points: [{ x: x + 6, y: y + 8 }, { x: x + w / 2, y: y - 14, cx: x + w * .2, cy: y - 16 }, { x: x + w / 2, y: y + 8 }],
    fill: '#c0b294' }, RenderLayer.OBJECT, order + 4);
  for (const rib of [.28, .5, .72]) {
    renderer.line({ x1: x + w * rib, y1: y + 8, x2: x + w * rib, y2: y - 13 + Math.abs(rib - .5) * 22, stroke: 'rgba(70,60,46,.4)' }, RenderLayer.OBJECT, order + 4);
  }
  for (const wheel of [{ x: x + 12, y: y + h }, { x: x + w - 12, y: y + h }]) {
    renderer.circle({ x: wheel.x, y: wheel.y, radius: 8, fill: '#4b3826', stroke: '#241c16', lineWidth: 2 }, RenderLayer.OBJECT, order + 5);
    renderer.circle({ x: wheel.x, y: wheel.y, radius: 2.4, fill: '#8b6b45' }, RenderLayer.OBJECT, order + 6);
    for (let spoke = 0; spoke < 4; spoke += 1) {
      const angle = spoke * Math.PI / 4 + .4;
      renderer.line({ x1: wheel.x - Math.cos(angle) * 7, y1: wheel.y - Math.sin(angle) * 7,
        x2: wheel.x + Math.cos(angle) * 7, y2: wheel.y + Math.sin(angle) * 7, stroke: 'rgba(150,116,74,.7)' }, RenderLayer.OBJECT, order + 6);
    }
  }
  for (const claw of [0, 1, 2]) {
    renderer.line({ x1: x + 18 + claw * 6, y1: y + 14, x2: x + 26 + claw * 6, y2: y + 30, stroke: 'rgba(52,32,26,.75)', lineWidth: 2 }, RenderLayer.OBJECT, order + 7);
  }
}

// ── props and characters ──────────────────────────────────────────────────────
function drawInteractable(ctx, target) {
  const { renderer, ox, oy, state, player, clock } = ctx;
  if (target.type === 'hidden' && !state.discoveries.has('mara_clue')) return;
  const x = target.x + ox; const y = target.y + oy; const order = target.y;
  if (target.type === 'npc' || target.type === 'traveler') drawVillager(ctx, target, x, y, order);
  else if (target.type === 'campfire') drawCampfire(ctx, x, y, order);
  else if (target.type === 'chest') {
    renderer.ellipse({ x, y: y + 11, radiusX: 13, radiusY: 4, fill: 'rgba(18,24,22,.3)' }, RenderLayer.DETAIL, order);
    renderer.rect({ x: x - 11, y: y - 3, width: 22, height: 14, fill: { type: 'linear', x0: x - 11, y0: 0, x1: x + 11, y1: 0, stops: [[0, '#7d5233'], [1, '#4f3320']] }, stroke: PALETTE.ink, radius: 2 }, RenderLayer.ENTITY, order);
    renderer.rect({ x: x - 10, y: y - 9, width: 20, height: 8, fill: '#8a5c35', stroke: PALETTE.ink, radius: 4 }, RenderLayer.ENTITY, order + 1);
    renderer.line({ x1: x - 10, y1: y - 5, x2: x + 10, y2: y - 5, stroke: '#c9a45e' }, RenderLayer.ENTITY, order + 2);
    renderer.rect({ x: x - 2, y: y - 6, width: 4, height: 8, fill: PALETTE.gold, stroke: '#6b4f22' }, RenderLayer.ENTITY, order + 3);
    renderer.circle({ x, y: y - 2, radius: 1, fill: '#3a2c16' }, RenderLayer.ENTITY, order + 4);
  } else if (target.type === 'door') {
    renderer.ellipse({ x, y: y + 12, radiusX: 15, radiusY: 5, fill: 'rgba(10,16,18,.4)' }, RenderLayer.DETAIL, order);
    renderer.path({ points: [{ x: x - 14, y: y + 12 }, { x: x - 12, y: y - 12, cx: x - 15, cy: y - 4 },
      { x: x + 12, y: y - 12, cx: x, cy: y - 26 }, { x: x + 14, y: y + 12, cx: x + 15, cy: y - 4 }],
      fill: '#2c3634', stroke: '#161c1c', lineWidth: 2 }, RenderLayer.ENTITY, order);
    renderer.path({ points: [{ x: x - 9, y: y + 12 }, { x: x - 8, y: y - 8, cx: x - 10, cy: y - 2 },
      { x: x + 8, y: y - 8, cx: x, cy: y - 19 }, { x: x + 9, y: y + 12, cx: x + 10, cy: y - 2 }],
      fill: state.gloamOpen ? '#111c22' : '#3d4744', stroke: '#1b2222' }, RenderLayer.ENTITY, order + 1);
    renderer.line({ x1: x - 8, y1: y - 1, x2: x + 8, y2: y - 1, stroke: '#7d8b84', lineWidth: 2 }, RenderLayer.ENTITY, order + 2);
    renderer.circle({ x, y: y - 1, radius: 2.6, fill: state.gloamOpen ? '#6b97a9' : '#5a625d', stroke: '#20282a' }, RenderLayer.ENTITY, order + 3);
    if (state.gloamOpen) renderer.ellipse({ x, y: y + 2, radiusX: 9, radiusY: 12, fill: 'rgba(107,151,169,.22)' }, RenderLayer.ENTITY, order + 4);
  } else if (target.type === 'building') {
    // a doorstep porch rather than a slab of door standing in the grass
    renderer.ellipse({ x, y: y + 7, radiusX: 15, radiusY: 6, fill: '#8d8474', stroke: '#403c34' }, RenderLayer.ENTITY, order);
    renderer.ellipse({ x, y: y + 5, radiusX: 11, radiusY: 4, fill: '#a29886' }, RenderLayer.ENTITY, order + 1);
    for (const post of [-11, 11]) renderer.rect({ x: x + post - 1.5, y: y - 17, width: 3, height: 22, fill: '#6d5537', stroke: '#2f2519' }, RenderLayer.ENTITY, order + 2);
    renderer.polygon({ points: [{ x: x - 16, y: y - 15 }, { x, y: y - 25 }, { x: x + 16, y: y - 15 }], fill: '#7a5540', stroke: '#2f2519' }, RenderLayer.ENTITY, order + 3);
    renderer.polygon({ points: [{ x: x - 16, y: y - 15 }, { x, y: y - 25 }, { x, y: y - 15 }], fill: '#96694e' }, RenderLayer.ENTITY, order + 4);
    renderer.rect({ x: x - 5, y: y - 15, width: 10, height: 7, fill: '#4a3223', stroke: '#251b13', radius: 1 }, RenderLayer.ENTITY, order + 5);
    renderer.circle({ x: x + 9, y: y - 12, radius: 2.6, fill: '#ffcd7c', stroke: '#3b2f22' }, RenderLayer.ENTITY, order + 6);
    renderer.circle({ x: x + 9, y: y - 12, radius: 7, fill: {
      type: 'radial', x0: x + 9, y0: y - 12, r0: 0, x1: x + 9, y1: y - 12, r1: 7,
      stops: [[0, 'rgba(255,196,110,.34)'], [1, 'rgba(255,196,110,0)']],
    } }, RenderLayer.ENTITY, order + 7);
  } else if (target.type === 'locked') {
    // a cellar hatch set into the ground, with a padlock
    renderer.ellipse({ x, y: y + 2, radiusX: 16, radiusY: 10, fill: '#4b4133', stroke: '#26201a' }, RenderLayer.ENTITY, order);
    renderer.polygon({ points: [{ x: x - 14, y: y + 2 }, { x: x - 1, y: y - 6 }, { x: x - 1, y: y + 8 }, { x: x - 14, y: y + 8 }],
      fill: '#6a4d33', stroke: '#2b2119' }, RenderLayer.ENTITY, order + 1);
    renderer.polygon({ points: [{ x: x + 14, y: y + 2 }, { x: x + 1, y: y - 6 }, { x: x + 1, y: y + 8 }, { x: x + 14, y: y + 8 }],
      fill: '#7c5c3d', stroke: '#2b2119' }, RenderLayer.ENTITY, order + 1);
    for (const plank of [-9, -5, 5, 9]) {
      renderer.line({ x1: x + plank, y1: y - 2, x2: x + plank, y2: y + 7, stroke: 'rgba(40,30,20,.5)' }, RenderLayer.ENTITY, order + 2);
    }
    renderer.rect({ x: x - 4, y: y - 1, width: 8, height: 6, fill: '#8d8474', stroke: '#2c2924', radius: 1 }, RenderLayer.ENTITY, order + 3);
    renderer.ellipse({ x, y: y - 2, radiusX: 2.4, radiusY: 2.4, start: Math.PI, end: 0, stroke: '#8d8474', lineWidth: 1.6 }, RenderLayer.ENTITY, order + 4);
  } else if (target.type === 'rune') {
    const active = state.runeSequence.includes(target.rune);
    renderer.ellipse({ x, y: y + 10, radiusX: 11, radiusY: 4, fill: 'rgba(12,18,20,.35)' }, RenderLayer.DETAIL, order);
    renderer.path({ points: [{ x: x - 9, y: y + 9 }, { x: x - 6, y: y - 12 }, { x: x + 7, y: y - 9 }, { x: x + 9, y: y + 10 }],
      fill: { type: 'linear', x0: x - 9, y0: 0, x1: x + 9, y1: 0, stops: [[0, active ? '#7ea6a3' : '#697069'], [1, active ? '#456a6b' : '#454b48']] },
      stroke: '#252c2b' }, RenderLayer.ENTITY, order);
    if (active) renderer.ellipse({ x, y: y - 1, radiusX: 13, radiusY: 15, fill: 'rgba(126,196,196,.16)' }, RenderLayer.ENTITY, order + 1);
    renderer.text({ text: ['', '♔', '≈', '⌁'][target.rune], x, y: y + 2, align: 'center',
      fill: active ? '#dff3ea' : '#c7d6c3', font: 'bold 9px Georgia' }, RenderLayer.ENTITY, order + 2);
  } else if (target.type === 'hidden') {
    for (const cap of [{ dx: -5, dy: 2, r: 5, fill: '#e2dcbb' }, { dx: 5, dy: -3, r: 4, fill: '#d8cfe8' }, { dx: 1, dy: 6, r: 3, fill: '#cfc9a8' }]) {
      renderer.line({ x1: x + cap.dx, y1: y + cap.dy + cap.r, x2: x + cap.dx, y2: y + cap.dy + 1, stroke: '#b6ae90', lineWidth: 2 }, RenderLayer.ENTITY, order);
      renderer.ellipse({ x: x + cap.dx, y: y + cap.dy, radiusX: cap.r, radiusY: cap.r * .75, fill: cap.fill, stroke: '#67705f' }, RenderLayer.ENTITY, order + 1);
      renderer.ellipse({ x: x + cap.dx - cap.r * .3, y: y + cap.dy - cap.r * .25, radiusX: cap.r * .35, radiusY: cap.r * .22, fill: 'rgba(255,255,255,.5)' }, RenderLayer.ENTITY, order + 2);
    }
    renderer.ellipse({ x, y: y + 1, radiusX: 14, radiusY: 11, fill: 'rgba(190,220,205,.1)' }, RenderLayer.ENTITY, order + 3);
  } else if (target.id === 'tracks') {
    for (const print of [{ dx: -5, dy: -5 }, { dx: 4, dy: 2 }, { dx: -3, dy: 8 }]) {
      renderer.ellipse({ x: x + print.dx, y: y + print.dy, radiusX: 2.6, radiusY: 3.6, rotation: .4, fill: 'rgba(48,42,32,.75)' }, RenderLayer.ENTITY, order);
      for (let toe = -1; toe <= 1; toe += 1) {
        renderer.circle({ x: x + print.dx + toe * 2, y: y + print.dy - 4, radius: .9, fill: 'rgba(48,42,32,.7)' }, RenderLayer.ENTITY, order + 1);
      }
    }
  } else if (target.id === 'statue') {
    renderer.ellipse({ x, y: y + 13, radiusX: 12, radiusY: 4, fill: 'rgba(14,20,18,.32)' }, RenderLayer.DETAIL, order);
    renderer.rect({ x: x - 10, y: y + 8, width: 20, height: 5, fill: '#6f7469', stroke: '#3b423a', radius: 1 }, RenderLayer.ENTITY, order);
    renderer.path({ points: [{ x: x - 7, y: y + 9 }, { x: x - 4, y: y - 10, cx: x - 8, cy: y - 2 },
      { x: x + 4, y: y - 10 }, { x: x + 7, y: y + 9, cx: x + 8, cy: y - 2 }],
      fill: { type: 'linear', x0: x - 7, y0: 0, x1: x + 7, y1: 0, stops: [[0, '#9ba193'], [1, '#6c7268']] }, stroke: '#3d443c' }, RenderLayer.ENTITY, order + 1);
    renderer.circle({ x, y: y - 15, radius: 6, fill: '#9da093', stroke: '#41483f' }, RenderLayer.ENTITY, order + 2);
    renderer.ellipse({ x: x - 2, y: y - 16, radiusX: 3, radiusY: 4, fill: 'rgba(220,224,210,.55)' }, RenderLayer.ENTITY, order + 3);
    renderer.line({ x1: x + 4, y1: y - 6, x2: x + 12, y2: y + 2, stroke: '#8d9287', lineWidth: 3 }, RenderLayer.ENTITY, order + 3);
    for (const moss of [{ dx: -6, dy: 4 }, { dx: 5, dy: -2 }]) {
      renderer.ellipse({ x: x + moss.dx, y: y + moss.dy, radiusX: 3, radiusY: 2, fill: 'rgba(88,124,74,.5)' }, RenderLayer.ENTITY, order + 4);
    }
  } else {
    const found = state.discoveries.has(target.id);
    renderer.ellipse({ x, y: y + 7, radiusX: 9, radiusY: 3, fill: 'rgba(14,20,18,.3)' }, RenderLayer.DETAIL, order);
    renderer.ellipse({ x, y, radiusX: 7, radiusY: 6, fill: found ? '#6b7168' : '#9fae9c', stroke: PALETTE.ink }, RenderLayer.ENTITY, order);
    renderer.ellipse({ x: x - 2, y: y - 2, radiusX: 3, radiusY: 2.2, fill: 'rgba(240,244,232,.45)' }, RenderLayer.ENTITY, order + 1);
  }
  if (target.type !== 'hidden' && !state.discoveries.has(target.id) && distance(player.x, player.y, target.x, target.y) < 52) {
    const hover = Math.sin(clock * 4) * 2;
    renderer.polygon({ points: [{ x, y: y - 28 + hover }, { x: x - 4, y: y - 22 + hover }, { x, y: y - 16 + hover }, { x: x + 4, y: y - 22 + hover }],
      fill: '#f1d27d', stroke: '#6d5133' }, RenderLayer.OVERHEAD, order + 3);
  }
}

function drawVillager(ctx, target, x, y, order) {
  const { renderer, clock } = ctx;
  const sway = Math.sin(clock * 1.4 + target.x * .1) * .8;
  const cloth = target.color ?? '#7a6348';
  renderer.ellipse({ x, y: y + 11, radiusX: 9, radiusY: 3.5, fill: 'rgba(24,27,25,.3)' }, RenderLayer.DETAIL, order);
  renderer.rect({ x: x - 5, y: y + 6, width: 10, height: 6, fill: '#4a3b2c' }, RenderLayer.ENTITY, order);
  renderer.path({ points: [{ x: x - 8.5 + sway, y: y + 12 }, { x: x - 5, y: y - 5, cx: x - 7.5, cy: y + 2 },
    { x: x + 5, y: y - 5 }, { x: x + 8.5 + sway, y: y + 12, cx: x + 7.5, cy: y + 2 }],
    fill: { type: 'linear', x0: x - 9, y0: 0, x1: x + 9, y1: 0, stops: [[0, cloth], [1, shade(cloth, .62)]] },
    stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 1);
  renderer.line({ x1: x - 6, y1: y + 3, x2: x + 6, y2: y + 3, stroke: 'rgba(48,38,30,.55)', lineWidth: 2 }, RenderLayer.ENTITY, order + 2);
  renderer.line({ x1: x - 6, y1: y - 3, x2: x - 8, y2: y + 4, stroke: cloth, lineWidth: 2.6 }, RenderLayer.ENTITY, order + 2);
  renderer.circle({ x, y: y - 10, radius: 5.6, fill: '#dcae86', stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 3);
  renderer.ellipse({ x: x + 2, y: y - 9, radiusX: 3.4, radiusY: 4.6, fill: 'rgba(120,80,56,.22)' }, RenderLayer.ENTITY, order + 4);
  renderer.circle({ x: x - 2, y: y - 10.5, radius: .8, fill: '#3a2a24' }, RenderLayer.ENTITY, order + 5);
  renderer.circle({ x: x + 2, y: y - 10.5, radius: .8, fill: '#3a2a24' }, RenderLayer.ENTITY, order + 5);
  const hair = target.id === 'mara' ? '#d3d0c4' : target.id === 'elara' ? '#7c4a2e' : target.id === 'rowan' ? '#4a4038' : '#49362f';
  renderer.path({ points: [{ x: x - 6, y: y - 11 }, { x, y: y - 18, cx: x - 5, cy: y - 18 },
    { x: x + 6, y: y - 11, cx: x + 5, cy: y - 18 }, { x: x + 5, y: y - 8, cx: x + 7, cy: y - 9 },
    { x: x - 5, y: y - 8, cx: x, cy: y - 12 }], fill: hair, stroke: 'rgba(24,18,16,.5)' }, RenderLayer.ENTITY, order + 6);
  if (target.id === 'rowan') {
    renderer.rect({ x: x - 7, y: y - 3, width: 5, height: 7, fill: '#6d7a80', stroke: '#2b3236', radius: 1 }, RenderLayer.ENTITY, order + 7);
    renderer.circle({ x: x - 4.5, y, radius: 1.2, fill: PALETTE.gold }, RenderLayer.ENTITY, order + 8);
  }
  if (target.type === 'traveler') {
    renderer.line({ x1: x + 8, y1: y - 12, x2: x + 9, y2: y + 10, stroke: '#6b5136', lineWidth: 2 }, RenderLayer.ENTITY, order + 7);
  }
}

function drawCampfire(ctx, x, y, order) {
  const { renderer, art, clock } = ctx;
  const flicker = Math.sin(clock * 7.3) * .5 + Math.sin(clock * 11.7) * .3;
  for (let stone = 0; stone < 5; stone += 1) {
    const angle = stone / 5 * Math.PI * 2 + .3;
    renderer.ellipse({ x: x + Math.cos(angle) * 13, y: y + 6 + Math.sin(angle) * 6, radiusX: 3.6, radiusY: 2.6,
      fill: stone % 2 ? '#8d8474' : '#726a5d', stroke: '#312c26' }, RenderLayer.ENTITY, order);
  }
  renderer.ellipse({ x, y: y + 6, radiusX: 10, radiusY: 5, fill: '#2b211a' }, RenderLayer.ENTITY, order + 1);
  renderer.line({ x1: x - 9, y1: y + 8, x2: x + 9, y2: y + 3, stroke: '#4c3022', lineWidth: 4 }, RenderLayer.ENTITY, order + 2);
  renderer.line({ x1: x + 9, y1: y + 8, x2: x - 9, y2: y + 3, stroke: '#5a3a27', lineWidth: 4 }, RenderLayer.ENTITY, order + 2);
  renderer.ellipse({ x, y: y + 4, radiusX: 8, radiusY: 3, fill: '#b8461f', alpha: .55 + flicker * .18 }, RenderLayer.ENTITY, order + 3);
  drawFlame(ctx, x, y + 4, 22 + flicker * 3, 9, clock, order + 4, RenderLayer.ENTITY);
  for (const ember of art.embers) {
    const life = (clock * .5 + ember.phase) % 1;
    renderer.circle({ x: x + Math.sin(life * 7 + ember.phase * 9) * 5 + ember.drift * life * 4,
      y: y - 4 - life * 26, radius: ember.size * (1 - life * .5),
      fill: '#ffb964', alpha: (1 - life) * .8 }, RenderLayer.ENTITY, order + 6);
  }
}

// A three-tone flame built from quadratic paths; phase-driven so it never allocates randomness.
function drawFlame(ctx, x, baseY, height, width, clock, order, layer = RenderLayer.ENTITY) {
  const { renderer } = ctx;
  const wobble = Math.sin(clock * 6.1) * width * .16;
  const wobble2 = Math.sin(clock * 8.7 + 1.4) * width * .12;
  renderer.path({ points: [
    { x: x - width, y: baseY },
    { x: x + wobble, y: baseY - height, cx: x - width * 1.15, cy: baseY - height * .58 },
    { x: x + width, y: baseY, cx: x + width * 1.15, cy: baseY - height * .58 },
  ], fill: '#d9531f', alpha: .95 }, layer, order);
  renderer.path({ points: [
    { x: x - width * .62, y: baseY },
    { x: x + wobble2, y: baseY - height * .72, cx: x - width * .78, cy: baseY - height * .42 },
    { x: x + width * .62, y: baseY, cx: x + width * .78, cy: baseY - height * .42 },
  ], fill: '#f09134' }, layer, order + 1);
  renderer.path({ points: [
    { x: x - width * .32, y: baseY - 1 },
    { x: x + wobble * .5, y: baseY - height * .44, cx: x - width * .42, cy: baseY - height * .26 },
    { x: x + width * .32, y: baseY - 1, cx: x + width * .42, cy: baseY - height * .26 },
  ], fill: '#f9dd82' }, layer, order + 2);
  renderer.ellipse({ x, y: baseY - height * .2, radiusX: width * .2, radiusY: height * .16, fill: '#fff4cd', alpha: .8 }, layer, order + 3);
}

function drawHero(ctx, x, y) {
  const { renderer, ox, oy, player, clock } = ctx;
  const px = Math.round(x) + ox; const py = Math.round(y) + oy;
  const order = y;
  const moving = player.state === 'walk' || player.state === 'run';
  const step = moving ? Math.sin(clock * (player.state === 'run' ? 15 : 9.5)) : 0;
  const bob = moving ? Math.abs(step) * 1.5 : 0;
  const hurt = player.state === 'hurt' && Math.floor(player.timer * 30) % 2;
  const top = py - 5 - bob;
  const fx = player.facingX; const fy = player.facingY;
  renderer.ellipse({ x: px, y: py + 12, radiusX: 10, radiusY: 4, fill: 'rgba(18,24,22,.34)' }, RenderLayer.DETAIL, order);
  // cloak behind, catching the wind
  renderer.path({ points: [
    { x: px - 9 - step, y: py + 13 }, { x: px - 6, y: top - 1, cx: px - 11, cy: py + 2 },
    { x: px + 6, y: top - 1 }, { x: px + 9 - step, y: py + 13, cx: px + 11, cy: py + 2 },
  ], fill: '#7b2f36', stroke: '#3e1a1e' }, RenderLayer.ENTITY, order);
  renderer.path({ points: [
    { x: px - 9 - step, y: py + 13 }, { x: px - 6, y: top - 1, cx: px - 11, cy: py + 2 }, { x: px - 1, y: py + 12 },
  ], fill: '#9a3f45' }, RenderLayer.ENTITY, order + 1);
  // legs
  renderer.rect({ x: px - 5, y: py + 5 + step, width: 4, height: 8 - step, fill: '#463424' }, RenderLayer.ENTITY, order + 2);
  renderer.rect({ x: px + 1, y: py + 5 - step, width: 4, height: 8 + step, fill: '#5a4430' }, RenderLayer.ENTITY, order + 2);
  renderer.rect({ x: px - 6, y: py + 11 + step * .6, width: 5, height: 3, fill: '#2f241a', radius: 1 }, RenderLayer.ENTITY, order + 3);
  renderer.rect({ x: px + 1, y: py + 11 - step * .6, width: 5, height: 3, fill: '#2f241a', radius: 1 }, RenderLayer.ENTITY, order + 3);
  // tunic and mail
  renderer.path({ points: [
    { x: px - 8, y: py + 8 }, { x: px - 6, y: top - 3, cx: px - 8, cy: top + 2 },
    { x: px + 6, y: top - 3 }, { x: px + 8, y: py + 8, cx: px + 8, cy: top + 2 },
  ], fill: { type: 'linear', x0: px - 8, y0: 0, x1: px + 8, y1: 0, stops: [[0, '#4a6f8a'], [.55, '#3b5c74'], [1, '#26404f']] },
    stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 4);
  renderer.line({ x1: px - 5, y1: top + 1, x2: px + 5, y2: top + 1, stroke: 'rgba(180,206,220,.35)', lineWidth: 1.5 }, RenderLayer.ENTITY, order + 5);
  renderer.rect({ x: px - 8, y: py + 2, width: 16, height: 3, fill: '#5b3f28', stroke: '#2c1f14' }, RenderLayer.ENTITY, order + 5);
  renderer.rect({ x: px - 2, y: py + 2, width: 4, height: 3, fill: PALETTE.gold }, RenderLayer.ENTITY, order + 6);
  // arms
  renderer.line({ x1: px - 6, y1: top + 3, x2: px - 8, y2: py + 3, stroke: '#3b5c74', lineWidth: 3 }, RenderLayer.ENTITY, order + 6);
  renderer.line({ x1: px + 6, y1: top + 3, x2: px + 8, y2: py + 3, stroke: '#4a6f8a', lineWidth: 3 }, RenderLayer.ENTITY, order + 6);
  // head
  renderer.circle({ x: px, y: top - 8, radius: 6, fill: hurt ? '#fff' : '#dfae82', stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 7);
  renderer.ellipse({ x: px + 2.4, y: top - 7, radiusX: 3.4, radiusY: 5, fill: 'rgba(122,80,54,.22)' }, RenderLayer.ENTITY, order + 8);
  if (fy >= 0) {
    renderer.circle({ x: px - 2.2, y: top - 8, radius: .9, fill: '#2f231e' }, RenderLayer.ENTITY, order + 9);
    renderer.circle({ x: px + 2.2, y: top - 8, radius: .9, fill: '#2f231e' }, RenderLayer.ENTITY, order + 9);
  }
  renderer.path({ points: [{ x: px - 6.4, y: top - 9 }, { x: px, y: top - 16, cx: px - 5, cy: top - 16 },
    { x: px + 6.4, y: top - 9, cx: px + 5, cy: top - 16 }, { x: px + 5, y: top - 6, cx: px + 7.4, cy: top - 7 },
    { x: px - 5, y: top - 6, cx: px, cy: top - 11 }], fill: '#4b352c', stroke: 'rgba(24,18,16,.55)' }, RenderLayer.ENTITY, order + 10);
  renderer.path({ points: [{ x: px - 7, y: top - 6 }, { x: px - 3, y: top - 12, cx: px - 8, cy: top - 12 },
    { x: px - 6, y: top - 4, cx: px - 3, cy: top - 8 }], fill: '#7b2f36', stroke: '#3e1a1e' }, RenderLayer.ENTITY, order + 11);
  // sword
  const swing = player.state === 'attack' || player.state === 'heavy' ? 1 : 0;
  const reach = swing ? 22 : 18;
  const hx = px + fx * 5; const hy = py + fy * 4 - 1;
  renderer.line({ x1: hx, y1: hy, x2: px + fx * reach, y2: py + fy * reach - 1, stroke: '#8c8878', lineWidth: 4 }, RenderLayer.ENTITY, order + 12);
  renderer.line({ x1: hx, y1: hy, x2: px + fx * reach, y2: py + fy * reach - 1, stroke: '#eae5d2', lineWidth: 2 }, RenderLayer.ENTITY, order + 13);
  renderer.line({ x1: hx - fy * 5, y1: hy + fx * 5, x2: hx + fy * 5, y2: hy - fx * 5, stroke: '#9a6b3b', lineWidth: 2.4 }, RenderLayer.ENTITY, order + 14);
  renderer.circle({ x: hx - fx * 3, y: hy - fy * 3, radius: 1.8, fill: PALETTE.gold, stroke: '#5f4520' }, RenderLayer.ENTITY, order + 15);
  if (swing) {
    const radius = player.state === 'heavy' ? 20 : 15;
    renderer.circle({ x: px + fx * 20, y: py + fy * 20, radius, stroke: '#f0d68a', lineWidth: 2, alpha: .6 }, RenderLayer.ENTITY, order + 16);
    renderer.circle({ x: px + fx * 20, y: py + fy * 20, radius: radius * .68, stroke: '#fff3c8', alpha: .35 }, RenderLayer.ENTITY, order + 16);
  }
  if (player.state === 'block') {
    renderer.ellipse({ x: px + fx * 11, y: py + fy * 9, radiusX: 8, radiusY: 9, rotation: Math.atan2(fy, fx),
      fill: '#5c6a72', stroke: '#c3cbc8', lineWidth: 2 }, RenderLayer.ENTITY, order + 16);
    renderer.circle({ x: px + fx * 11, y: py + fy * 9, radius: 2.4, fill: PALETTE.gold }, RenderLayer.ENTITY, order + 17);
  }
}

function drawEnemy(ctx, enemy) {
  const { renderer, ox, oy, canvas } = ctx;
  const x = enemy.x + ox; const y = enemy.y + oy; const order = enemy.y;
  const flash = enemy.flash > 0;
  const radius = enemy.kind === 'boss' ? 18 : enemy.kind === 'miniboss' ? 14 : enemy.kind === 'armored_knight' ? 11 : 9;
  renderer.ellipse({ x, y: y + radius * .8, radiusX: radius * 1.1, radiusY: radius * .42, fill: 'rgba(18,24,22,.32)' }, RenderLayer.DETAIL, order);
  if (enemy.kind === 'wolf') drawWolf(ctx, x, y, order, flash);
  else if (enemy.kind === 'skeleton') drawSkeleton(ctx, x, y, order, flash);
  else if (enemy.kind === 'forest_creature' || enemy.kind === 'miniboss') drawBriar(ctx, x, y, order, radius, flash, enemy.kind === 'miniboss');
  else if (enemy.kind === 'armored_knight') drawKnight(ctx, x, y, order, flash);
  else if (enemy.kind === 'dungeon_creature' || enemy.kind === 'boss') drawGloam(ctx, enemy, x, y, order, radius, flash);
  else drawBandit(ctx, x, y, order, flash);
  if (enemy.telegraph > 0) {
    const pulse = radius + 8 + Math.sin(enemy.telegraph * 20) * 2;
    renderer.circle({ x, y, radius: pulse, stroke: '#e6a35d', lineWidth: 2, alpha: .85 }, RenderLayer.ENTITY, order + 20);
    renderer.circle({ x, y, radius: pulse, fill: 'rgba(230,163,93,.12)' }, RenderLayer.ENTITY, order + 19);
  }
  if (enemy.kind === 'boss') {
    ctx.bossBanner = true;
    const half = canvas.width / 2;
    renderer.rect({ x: half - 96, y: 6, width: 192, height: 14, fill: 'rgba(18,14,16,.8)', stroke: '#8d7853', radius: 3 }, RenderLayer.UI);
    renderer.rect({ x: half - 94, y: 9, width: 188 * Math.max(0, enemy.health / enemy.maxHealth), height: 8, fill: {
      type: 'linear', x0: 0, y0: 9, x1: 0, y1: 17, stops: [[0, '#c05852'], [1, PALETTE.blood]],
    }, radius: 2 }, RenderLayer.UI, 1);
    renderer.text({ text: `THE DROWNED OATH · PHASE ${enemy.bossPhase}`, x: half, y: 16, align: 'center', fill: PALETTE.parchment, font: 'bold 8px Georgia', stroke: 'rgba(23,19,20,.8)', lineWidth: 2 }, RenderLayer.UI, 2);
  }
}

function drawWolf(ctx, x, y, order, flash) {
  const { renderer, clock } = ctx;
  const coat = flash ? '#fff' : '#6d655c';
  const dark = flash ? '#fff' : '#4a443d';
  const gait = Math.sin(clock * 9) * 2;
  for (const leg of [{ dx: -6, p: gait }, { dx: -2, p: -gait }, { dx: 5, p: -gait }, { dx: 9, p: gait }]) {
    renderer.line({ x1: x + leg.dx, y1: y + 3, x2: x + leg.dx + leg.p * .5, y2: y + 10, stroke: dark, lineWidth: 2.4 }, RenderLayer.ENTITY, order);
  }
  renderer.ellipse({ x: x - 1, y: y + 1, radiusX: 11, radiusY: 6.4, fill: coat, stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 1);
  renderer.ellipse({ x: x - 6, y: y - 1, radiusX: 5.4, radiusY: 5, fill: dark }, RenderLayer.ENTITY, order + 2);
  renderer.path({ points: [{ x: x - 10, y: y - 1 }, { x: x - 17, y: y - 8, cx: x - 16, cy: y - 1 }, { x: x - 13, y: y + 1, cx: x - 14, cy: y - 4 }],
    fill: coat, stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 2);
  renderer.ellipse({ x: x + 8, y: y - 3, radiusX: 6, radiusY: 5.2, fill: coat, stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 3);
  renderer.path({ points: [{ x: x + 11, y: y - 4 }, { x: x + 17, y: y - 1, cx: x + 16, cy: y - 4 }, { x: x + 11, y: y }],
    fill: dark, stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 4);
  renderer.circle({ x: x + 17, y: y - 1, radius: 1.2, fill: '#221e1b' }, RenderLayer.ENTITY, order + 5);
  renderer.polygon({ points: [{ x: x + 4, y: y - 7 }, { x: x + 5, y: y - 14 }, { x: x + 9, y: y - 8 }], fill: dark, stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 5);
  renderer.polygon({ points: [{ x: x + 9, y: y - 8 }, { x: x + 12, y: y - 14 }, { x: x + 13, y: y - 6 }], fill: dark, stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 5);
  renderer.circle({ x: x + 10, y: y - 4, radius: 1.5, fill: '#f0c463' }, RenderLayer.ENTITY, order + 6);
  renderer.circle({ x: x + 10, y: y - 4, radius: .7, fill: '#2a1d12' }, RenderLayer.ENTITY, order + 7);
}

function drawSkeleton(ctx, x, y, order, flash) {
  const { renderer } = ctx;
  const bone = flash ? '#fff' : '#cbc3ac';
  const shadow = flash ? '#fff' : '#9a927c';
  renderer.line({ x1: x - 2, y1: y + 7, x2: x - 6, y2: y + 15, stroke: bone, lineWidth: 2.4 }, RenderLayer.ENTITY, order);
  renderer.line({ x1: x + 2, y1: y + 7, x2: x + 6, y2: y + 15, stroke: bone, lineWidth: 2.4 }, RenderLayer.ENTITY, order);
  renderer.rect({ x: x - 5, y: y + 4, width: 10, height: 5, fill: shadow, radius: 2 }, RenderLayer.ENTITY, order + 1);
  renderer.line({ x1: x, y1: y - 4, x2: x, y2: y + 6, stroke: shadow, lineWidth: 2.6 }, RenderLayer.ENTITY, order + 2);
  for (let rib = 0; rib < 3; rib += 1) {
    renderer.path({ points: [{ x: x - 6, y: y - 3 + rib * 3 }, { x, y: y - 1 + rib * 3, cx: x - 3, cy: y + rib * 3 },
      { x: x + 6, y: y - 3 + rib * 3, cx: x + 3, cy: y + rib * 3 }], stroke: bone, lineWidth: 1.6, close: false }, RenderLayer.ENTITY, order + 3);
  }
  renderer.line({ x1: x - 5, y1: y - 4, x2: x - 11, y2: y + 4, stroke: bone, lineWidth: 2 }, RenderLayer.ENTITY, order + 3);
  renderer.line({ x1: x + 5, y1: y - 4, x2: x + 12, y2: y + 1, stroke: bone, lineWidth: 2 }, RenderLayer.ENTITY, order + 3);
  renderer.line({ x1: x + 12, y1: y + 1, x2: x + 17, y2: y - 9, stroke: '#8f9298', lineWidth: 2.4 }, RenderLayer.ENTITY, order + 4);
  renderer.ellipse({ x, y: y - 11, radiusX: 6, radiusY: 6.4, fill: bone, stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 5);
  renderer.rect({ x: x - 3, y: y - 6, width: 6, height: 3, fill: bone, radius: 1 }, RenderLayer.ENTITY, order + 6);
  renderer.ellipse({ x: x - 2.3, y: y - 12, radiusX: 1.7, radiusY: 2, fill: '#1d1a17' }, RenderLayer.ENTITY, order + 7);
  renderer.ellipse({ x: x + 2.3, y: y - 12, radiusX: 1.7, radiusY: 2, fill: '#1d1a17' }, RenderLayer.ENTITY, order + 7);
  renderer.circle({ x: x - 2.3, y: y - 12, radius: .7, fill: '#8fd0c6' }, RenderLayer.ENTITY, order + 8);
  renderer.circle({ x: x + 2.3, y: y - 12, radius: .7, fill: '#8fd0c6' }, RenderLayer.ENTITY, order + 8);
  for (let tooth = -2; tooth <= 2; tooth += 1) {
    renderer.line({ x1: x + tooth * 1.4, y1: y - 6, x2: x + tooth * 1.4, y2: y - 3.6, stroke: '#57503f' }, RenderLayer.ENTITY, order + 8);
  }
}

function drawBriar(ctx, x, y, order, radius, flash, elder) {
  const { renderer, clock } = ctx;
  const body = flash ? '#fff' : elder ? '#3b684d' : '#2f5439';
  const dark = flash ? '#fff' : elder ? '#24422f' : '#1e3a28';
  const sway = Math.sin(clock * 2.2 + x * .05) * 1.6;
  for (const root of [-1, 0, 1]) {
    renderer.line({ x1: x + root * 5, y1: y + radius - 3, x2: x + root * 11, y2: y + radius + 9, stroke: '#3e4e32', lineWidth: 3 }, RenderLayer.ENTITY, order);
  }
  renderer.ellipse({ x, y, radiusX: radius * 1.05, radiusY: radius, fill: dark, stroke: PALETTE.ink, lineWidth: 2 }, RenderLayer.ENTITY, order + 1);
  renderer.ellipse({ x: x - radius * .28, y: y - radius * .2, radiusX: radius * .68, radiusY: radius * .6, fill: body }, RenderLayer.ENTITY, order + 2);
  renderer.ellipse({ x: x - radius * .4, y: y - radius * .38, radiusX: radius * .3, radiusY: radius * .24, fill: elder ? '#5f9169' : '#4a7c52', alpha: .8 }, RenderLayer.ENTITY, order + 3);
  for (const side of [-1, 1]) {
    renderer.path({ points: [{ x: x + side * 5, y: y - radius + 2 },
      { x: x + side * (12 + sway * side), y: y - radius - 11, cx: x + side * 6, cy: y - radius - 7 }],
      stroke: '#6b5738', lineWidth: 3, close: false }, RenderLayer.ENTITY, order + 4);
    renderer.line({ x1: x + side * 9, y1: y - radius - 5, x2: x + side * 15, y2: y - radius - 8, stroke: '#6b5738', lineWidth: 2 }, RenderLayer.ENTITY, order + 5);
    if (elder) renderer.line({ x1: x + side * 11, y1: y - radius - 9, x2: x + side * 17, y2: y - radius - 16, stroke: '#7d6743', lineWidth: 2 }, RenderLayer.ENTITY, order + 5);
  }
  for (const eye of [-1, 1]) {
    renderer.circle({ x: x + eye * 3.4, y: y - 1, radius: elder ? 2.2 : 1.8, fill: '#f2d878' }, RenderLayer.ENTITY, order + 6);
    renderer.circle({ x: x + eye * 3.4, y: y - 1, radius: .9, fill: '#2b2415' }, RenderLayer.ENTITY, order + 7);
  }
  for (const thorn of [-1, 1]) {
    renderer.polygon({ points: [{ x: x + thorn * radius * .85, y: y + 2 }, { x: x + thorn * (radius + 6), y: y - 2 }, { x: x + thorn * radius * .85, y: y + 5 }],
      fill: '#5c4b34' }, RenderLayer.ENTITY, order + 6);
  }
}

function drawKnight(ctx, x, y, order, flash) {
  const { renderer } = ctx;
  const plate = flash ? '#fff' : '#8b929b';
  const mid = flash ? '#fff' : '#666e78';
  const dark = flash ? '#fff' : '#3f464e';
  // greaves and sabatons
  for (const leg of [-1, 1]) {
    renderer.rect({ x: x + leg * 4 - 2.5, y: y + 7, width: 5, height: 7, fill: mid, stroke: dark }, RenderLayer.ENTITY, order);
    renderer.rect({ x: x + leg * 4 - 3.5, y: y + 13, width: 7, height: 3, fill: dark, radius: 1 }, RenderLayer.ENTITY, order + 1);
  }
  // cuirass with a tabard
  renderer.path({ points: [{ x: x - 9, y: y + 9 }, { x: x - 10, y: y - 7, cx: x - 11, cy: y }, { x: x + 10, y: y - 7 },
    { x: x + 9, y: y + 9, cx: x + 11, cy: y }],
    fill: { type: 'linear', x0: x - 10, y0: 0, x1: x + 10, y1: 0, stops: [[0, plate], [.5, mid], [1, dark]] },
    stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 2);
  renderer.path({ points: [{ x: x - 4, y: y - 6 }, { x: x + 4, y: y - 6 }, { x: x + 3, y: y + 11 }, { x, y: y + 13 }, { x: x - 3, y: y + 11 }],
    fill: '#7a3336', stroke: '#3f1c1e' }, RenderLayer.ENTITY, order + 3);
  renderer.circle({ x, y: y + 1, radius: 2.4, fill: '#d9c07a' }, RenderLayer.ENTITY, order + 4);
  renderer.path({ points: [{ x: x - 9, y: y + 3 }, { x, y: y + 6, cx: x - 4, cy: y + 7 }, { x: x + 9, y: y + 3, cx: x + 4, cy: y + 7 }],
    stroke: 'rgba(196,204,208,.6)', lineWidth: 1.2, close: false }, RenderLayer.ENTITY, order + 5);
  // pauldrons
  for (const side of [-1, 1]) {
    renderer.ellipse({ x: x + side * 10, y: y - 6, radiusX: 5.4, radiusY: 4.4, fill: plate, stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 6);
    renderer.ellipse({ x: x + side * 10, y: y - 7.4, radiusX: 3.4, radiusY: 2, fill: 'rgba(228,236,240,.5)' }, RenderLayer.ENTITY, order + 7);
  }
  // great helm
  renderer.path({ points: [{ x: x - 7, y: y - 8 }, { x: x - 6.4, y: y - 17, cx: x - 7.6, cy: y - 14 },
    { x: x + 6.4, y: y - 17, cx: x, cy: y - 21 }, { x: x + 7, y: y - 8, cx: x + 7.6, cy: y - 14 }],
    fill: { type: 'linear', x0: x - 7, y0: 0, x1: x + 7, y1: 0, stops: [[0, plate], [1, mid]] }, stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 8);
  renderer.rect({ x: x - 6, y: y - 13.4, width: 12, height: 2.6, fill: '#1b2126' }, RenderLayer.ENTITY, order + 9);
  renderer.circle({ x: x - 2.6, y: y - 12.2, radius: .9, fill: '#f0c069' }, RenderLayer.ENTITY, order + 10);
  renderer.circle({ x: x + 2.6, y: y - 12.2, radius: .9, fill: '#f0c069' }, RenderLayer.ENTITY, order + 10);
  renderer.line({ x1: x, y1: y - 10.5, x2: x, y2: y - 8.5, stroke: '#20262b', lineWidth: 1.4 }, RenderLayer.ENTITY, order + 10);
  renderer.path({ points: [{ x: x - 2, y: y - 18 }, { x: x - 5, y: y - 27, cx: x - 5, cy: y - 22 },
    { x: x + 2, y: y - 19, cx: x + 1, cy: y - 24 }], fill: '#8d3e3a', stroke: '#4a1f1e' }, RenderLayer.ENTITY, order + 11);
  // kite shield
  renderer.path({ points: [{ x: x - 22, y: y - 9 }, { x: x - 9, y: y - 10, cx: x - 16, cy: y - 12 },
    { x: x - 14, y: y + 12, cx: x - 8, cy: y + 4 }, { x: x - 22, y: y - 9, cx: x - 23, cy: y + 3 }],
    fill: { type: 'linear', x0: x - 22, y0: 0, x1: x - 9, y1: 0, stops: [[0, '#4b5661'], [1, '#6d7783']] },
    stroke: '#c2cacd', lineWidth: 1.6 }, RenderLayer.ENTITY, order + 12);
  renderer.line({ x1: x - 21, y1: y - 4, x2: x - 11, y2: y - 4.6, stroke: '#8d3e3a', lineWidth: 2.4 }, RenderLayer.ENTITY, order + 13);
  renderer.line({ x1: x - 16, y1: y - 9.6, x2: x - 15, y2: y + 8, stroke: '#8d3e3a', lineWidth: 2.4 }, RenderLayer.ENTITY, order + 13);
  renderer.circle({ x: x - 16, y: y - 4, radius: 2, fill: '#c9d1d4', stroke: '#333b40' }, RenderLayer.ENTITY, order + 14);
  // longsword
  renderer.line({ x1: x + 10, y1: y - 3, x2: x + 23, y2: y - 16, stroke: '#7d7a6c', lineWidth: 4 }, RenderLayer.ENTITY, order + 14);
  renderer.line({ x1: x + 10, y1: y - 3, x2: x + 23, y2: y - 16, stroke: '#e5e0cc', lineWidth: 2 }, RenderLayer.ENTITY, order + 15);
  renderer.line({ x1: x + 7, y1: y - 5, x2: x + 13, y2: y + 1, stroke: '#9a7b3b', lineWidth: 2.4 }, RenderLayer.ENTITY, order + 16);
}

function drawGloam(ctx, enemy, x, y, order, radius, flash) {
  const { renderer, clock } = ctx;
  const boss = enemy.kind === 'boss';
  const body = flash ? '#fff' : boss ? '#2f5c68' : '#5b4a80';
  const dark = flash ? '#fff' : boss ? '#1e3f4b' : '#3d3059';
  for (let arm = -2; arm <= 2; arm += 1) {
    const wave = Math.sin(clock * 2.4 + arm * 1.1) * 4;
    renderer.path({ points: [{ x: x + arm * 4, y: y + radius * .4 },
      { x: x + arm * 9 + wave, y: y + radius + 13, cx: x + arm * 7, cy: y + radius + 4 }],
      stroke: dark, lineWidth: boss ? 5 : 3, close: false }, RenderLayer.ENTITY, order);
    renderer.circle({ x: x + arm * 9 + wave, y: y + radius + 13, radius: boss ? 2.4 : 1.6, fill: body }, RenderLayer.ENTITY, order + 1);
  }
  renderer.ellipse({ x, y, radiusX: radius * 1.08, radiusY: radius, fill: dark, stroke: PALETTE.ink, lineWidth: 2 }, RenderLayer.ENTITY, order + 2);
  renderer.ellipse({ x: x - radius * .26, y: y - radius * .26, radiusX: radius * .66, radiusY: radius * .56, fill: body }, RenderLayer.ENTITY, order + 3);
  renderer.ellipse({ x: x - radius * .4, y: y - radius * .44, radiusX: radius * .26, radiusY: radius * .18, fill: 'rgba(226,240,244,.3)' }, RenderLayer.ENTITY, order + 4);
  renderer.ellipse({ x, y: y - 2, radiusX: boss ? 6.4 : 5, radiusY: boss ? 5.4 : 4.2, fill: '#e6dfa8', stroke: '#232a2c', lineWidth: 1.4 }, RenderLayer.ENTITY, order + 5);
  renderer.ellipse({ x: x + Math.sin(clock * 1.6) * 1.4, y: y - 2, radiusX: boss ? 2.4 : 1.9, radiusY: boss ? 3.4 : 2.6, fill: '#1c1a22' }, RenderLayer.ENTITY, order + 6);
  renderer.circle({ x: x - 1.4, y: y - 3.4, radius: .9, fill: 'rgba(255,255,255,.75)' }, RenderLayer.ENTITY, order + 7);
  if (boss) {
    for (const chain of [-1, 1]) {
      for (let link = 0; link < 4; link += 1) {
        renderer.circle({ x: x + chain * (radius + 4 + link * 5), y: y + 6 + Math.sin(clock + link) * 2, radius: 2,
          stroke: '#8a8f8c', lineWidth: 1.4 }, RenderLayer.ENTITY, order + 8);
      }
    }
    renderer.ellipse({ x, y, radiusX: radius + 8, radiusY: radius + 6, fill: 'rgba(66,132,150,.14)' }, RenderLayer.ENTITY, order - 1);
  }
}

function drawBandit(ctx, x, y, order, flash) {
  const { renderer } = ctx;
  const cloth = flash ? '#fff' : '#75434a';
  renderer.rect({ x: x - 5, y: y + 6, width: 4, height: 7, fill: '#3d3028' }, RenderLayer.ENTITY, order);
  renderer.rect({ x: x + 1, y: y + 6, width: 4, height: 7, fill: '#4a3a30' }, RenderLayer.ENTITY, order);
  renderer.path({ points: [{ x: x - 9, y: y + 12 }, { x: x - 6, y: y - 7, cx: x - 9, cy: y - 1 }, { x: x + 6, y: y - 7 },
    { x: x + 9, y: y + 12, cx: x + 9, cy: y - 1 }],
    fill: { type: 'linear', x0: x - 9, y0: 0, x1: x + 9, y1: 0, stops: [[0, cloth], [1, '#4c2a30']] }, stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 1);
  renderer.line({ x1: x - 7, y1: y + 2, x2: x + 7, y2: y + 2, stroke: '#33241f', lineWidth: 2 }, RenderLayer.ENTITY, order + 2);
  renderer.circle({ x, y: y - 12, radius: 6, fill: '#b98b70', stroke: PALETTE.ink }, RenderLayer.ENTITY, order + 3);
  renderer.path({ points: [{ x: x - 7, y: y - 10 }, { x, y: y - 20, cx: x - 7, cy: y - 19 },
    { x: x + 7, y: y - 10, cx: x + 7, cy: y - 19 }, { x: x + 5, y: y - 11, cx: x + 5, cy: y - 8 },
    { x: x - 5, y: y - 11, cx: x, cy: y - 15 }], fill: '#3b3038', stroke: '#1e1a1e' }, RenderLayer.ENTITY, order + 4);
  renderer.rect({ x: x - 5, y: y - 12, width: 10, height: 3, fill: '#2a2226' }, RenderLayer.ENTITY, order + 5);
  renderer.circle({ x: x - 2, y: y - 10.6, radius: .8, fill: '#e8c06a' }, RenderLayer.ENTITY, order + 6);
  renderer.circle({ x: x + 2, y: y - 10.6, radius: .8, fill: '#e8c06a' }, RenderLayer.ENTITY, order + 6);
  renderer.line({ x1: x + 7, y1: y, x2: x + 16, y2: y + 9, stroke: '#6b5136', lineWidth: 3 }, RenderLayer.ENTITY, order + 6);
  renderer.line({ x1: x + 9, y1: y + 2, x2: x + 16, y2: y + 9, stroke: '#d5cfba', lineWidth: 2 }, RenderLayer.ENTITY, order + 7);
}

// ── weather, light, atmosphere ────────────────────────────────────────────────
function drawParticles(ctx) {
  const { renderer, particles, state, canvas, clock } = ctx;
  let index = 0;
  for (const particle of particles) {
    particle.phase += .004;
    index += 1;
    if (state.weather === 'rain') {
      particle.y += 1.6; particle.x -= .28;
      if (particle.y > canvas.height) particle.y = 0;
      renderer.line({ x1: particle.x, y1: particle.y, x2: particle.x - 2, y2: particle.y + 7, stroke: 'rgba(181,204,210,.32)' }, RenderLayer.WEATHER);
    } else if (state.weather === 'fog') {
      particle.x += .05;
      if (particle.x > canvas.width) particle.x = 0;
      renderer.ellipse({ x: particle.x, y: particle.y, radiusX: 9 + particle.phase % 7, radiusY: 4 + particle.phase % 4,
        fill: 'rgba(190,201,190,.07)' }, RenderLayer.WEATHER);
    } else if (state.weather === 'fireflies') {
      particle.y += .12; particle.x += Math.sin(particle.phase + state.hour) * .08;
      if (particle.y > canvas.height) particle.y = 0;
      const pulse = .35 + Math.abs(Math.sin(clock * 2 + particle.phase * 40)) * .65;
      if (index % 4 === 0) renderer.circle({ x: particle.x, y: particle.y, radius: 3.2, fill: 'rgba(241,211,104,.16)', alpha: pulse }, RenderLayer.WEATHER);
      renderer.circle({ x: particle.x, y: particle.y, radius: 1.1, fill: '#fbeba4', alpha: pulse }, RenderLayer.WEATHER, 1);
    } else {
      particle.y += .14; particle.x += Math.sin(particle.phase + state.hour) * .1;
      if (particle.y > canvas.height) particle.y = 0;
      renderer.ellipse({ x: particle.x, y: particle.y, radiusX: 1.8, radiusY: 1,
        rotation: particle.phase * 3, fill: 'rgba(199,155,76,.4)' }, RenderLayer.WEATHER);
    }
  }
}

// Smooth dusk curve: daylight ≈ .08, deep night ≈ .38, matching the original thresholds.
function nightAmount(hour) {
  if (hour >= 7 && hour <= 17) return 0;
  if (hour > 17 && hour < 20) return clamp01((hour - 17) / 3);
  if (hour >= 20 || hour < 4) return 1;
  return clamp01((6.5 - hour) / 2.5);
}

function drawAtmosphere(ctx) {
  const { renderer, canvas, state } = ctx;
  const night = nightAmount(state.hour);
  const darkness = .04 + night * .34;
  const tint = night > .55 ? '12,24,44' : '44,32,58';
  renderer.rect({ x: 0, y: 0, width: canvas.width, height: canvas.height, fill: `rgba(${tint},${darkness})` }, RenderLayer.LIGHTING, 0);
  // golden hour warms the whole frame before the night settles in
  const golden = Math.max(0, 1 - Math.abs(night - .3) / .42);
  if (golden > 0) {
    renderer.rect({ x: 0, y: 0, width: canvas.width, height: canvas.height, fill: {
      type: 'linear', x0: 0, y0: 0, x1: canvas.width, y1: canvas.height,
      stops: [[0, `rgba(255,186,102,${.14 * golden})`], [1, `rgba(196,110,86,${.05 * golden})`]],
    } }, RenderLayer.LIGHTING, 1);
  }
  drawLocalLights(ctx, night);
  renderer.rect({ x: 0, y: 0, width: canvas.width, height: canvas.height, fill: {
    type: 'radial', x0: canvas.width / 2, y0: canvas.height / 2, r0: canvas.height * .46,
    x1: canvas.width / 2, y1: canvas.height / 2, r1: canvas.width * .78,
    stops: [[0, 'rgba(10,14,18,0)'], [.66, 'rgba(10,14,18,.12)'], [1, 'rgba(8,11,16,.44)']],
  } }, RenderLayer.LIGHTING, 20);
}

function drawLocalLights(ctx, night) {
  const { state, obstacles, ox, oy } = ctx;
  const strength = .55 + night * .65;
  drawGlow(ctx, 258 + ox, 390 + oy, 40, '245,168,86', .9 * strength);
  for (const house of obstacles) {
    if (house.kind !== 'house') continue;
    for (const wx of [.22, .68]) drawGlow(ctx, house.x + house.width * wx + ox, house.y + house.height * .44 + oy, 20, '250,196,110', .7 * strength);
  }
  if (state.zone === 'gloam-cave') drawGlow(ctx, 1120 + ox, 610 + oy, 46, '107,171,189', .9);
  if (state.zone === 'sunken-ruin') drawGlow(ctx, 1145 + ox, 136 + oy, 34, '150,170,190', .5);
}

function drawGlow(ctx, x, y, radius, rgb, strength = 1) {
  const { renderer, canvas } = ctx;
  if (x < -radius || y < -radius || x > canvas.width + radius || y > canvas.height + radius) return;
  renderer.circle({ x, y, radius, fill: {
    type: 'radial', x0: x, y0: y, r0: 0, x1: x, y1: y, r1: radius,
    stops: [[0, `rgba(${rgb},${.4 * strength})`], [.45, `rgba(${rgb},${.16 * strength})`], [1, `rgba(${rgb},0)`]],
  } }, RenderLayer.LIGHTING, 10);
}

// ── opening cinematic (timings unchanged) ─────────────────────────────────────
export function drawOpening(ctx) {
  const { renderer, canvas, state, config, clock } = ctx;
  const t = state.openingTime;
  const w = canvas.width; const h = canvas.height;
  renderer.rect({ x: 0, y: 0, width: w, height: h, fill: '#050707' }, RenderLayer.GROUND);
  renderer.rect({ x: 0, y: 0, width: w, height: h, fill: {
    type: 'radial', x0: w / 2, y0: 150, r0: 0, x1: w / 2, y1: 150, r1: 190,
    stops: [[0, 'rgba(96,54,26,.5)'], [.5, 'rgba(46,26,16,.24)'], [1, 'rgba(5,7,7,0)']],
  } }, RenderLayer.GROUND, 1);
  if (t > 0.35 && t < 4.4) {
    const fade = Math.min(1, 4.4 - t);
    const glow = 20 + Math.sin(t * 9) * 3;
    renderer.circle({ x: w / 2, y: 164, radius: glow * 2.6, fill: {
      type: 'radial', x0: w / 2, y0: 164, r0: 0, x1: w / 2, y1: 164, r1: glow * 2.6,
      stops: [[0, 'rgba(240,150,74,.32)'], [.45, 'rgba(227,139,69,.12)'], [1, 'rgba(227,139,69,0)']],
    }, alpha: fade }, RenderLayer.DETAIL);
    for (let stone = 0; stone < 6; stone += 1) {
      const angle = stone / 6 * Math.PI * 2 + .5;
      renderer.ellipse({ x: w / 2 + Math.cos(angle) * 20, y: 190 + Math.sin(angle) * 7, radiusX: 5, radiusY: 3.4,
        fill: stone % 2 ? '#4b453b' : '#3b362e', alpha: fade }, RenderLayer.OBJECT);
    }
    renderer.line({ x1: w / 2 - 14, y1: 191, x2: w / 2 + 14, y2: 186, stroke: '#3a2519', lineWidth: 4, alpha: fade }, RenderLayer.OBJECT);
    renderer.line({ x1: w / 2 + 14, y1: 191, x2: w / 2 - 14, y2: 186, stroke: '#472f1f', lineWidth: 4, alpha: fade }, RenderLayer.OBJECT);
    renderer.ellipse({ x: w / 2, y: 189, radiusX: 12, radiusY: 4, fill: '#b8461f', alpha: fade * .6 }, RenderLayer.OBJECT, 1);
    drawFlame(ctx, w / 2, 189, 26 + Math.sin(t * 9) * 3, 11, clock, 2, RenderLayer.OBJECT);
    for (let ember = 0; ember < 7; ember += 1) {
      const life = (clock * .55 + ember * .143) % 1;
      renderer.circle({ x: w / 2 + Math.sin(life * 7 + ember * 2) * 7, y: 182 - life * 34, radius: 1.1 * (1 - life * .5),
        fill: '#ffbe6d', alpha: (1 - life) * .8 * fade }, RenderLayer.OBJECT, 8);
    }
  }
  if (t > .65 && t < 4.6) {
    const alpha = Math.min(1, (t - .65) * 1.4, 4.6 - t);
    renderer.text({ text: 'ELDRIC', x: 192, y: 51, align: 'center', fill: 'rgba(20,14,10,.85)', font: 'bold 18px Georgia', alpha });
    renderer.text({ text: 'ELDRIC', x: 192, y: 50, align: 'center', fill: '#e7c879', font: 'bold 18px Georgia', alpha });
    for (const side of [-1, 1]) {
      renderer.line({ x1: 192 + side * 44, y1: 45, x2: 192 + side * 72, y2: 45, stroke: 'rgba(199,166,104,.45)', alpha }, RenderLayer.UI, 1);
      renderer.polygon({ points: [{ x: 192 + side * 78, y: 45 }, { x: 192 + side * 74, y: 42 }, { x: 192 + side * 70, y: 45 }, { x: 192 + side * 74, y: 48 }],
        fill: 'rgba(199,166,104,.6)', alpha }, RenderLayer.UI, 1);
    }
  }
  if (t > .9 && t < 4.6) renderer.text({ text: 'THE LIVING CHRONICLE', x: 192, y: 66, align: 'center', fill: '#a99670', font: 'bold 8px Georgia', alpha: Math.min(1, (t - .9) * 1.4, 4.6 - t) });
  if (t > 1.45 && t < 4.6) renderer.text({ text: '“Gather close, and heed my tale.”', x: 192, y: 92, align: 'center', fill: PALETTE.parchment, font: 'italic 11px Georgia', alpha: Math.min(1, (t - 1.45) * 1.2, 4.6 - t) });
  if (t > 2.7 && t < 4.6) renderer.text({ text: 'A kingdom waits for the hand that will write its history.', x: 192, y: 109, align: 'center', fill: '#c2b28c', font: '8px Georgia', alpha: Math.min(1, (t - 2.7) * 1.5, 4.6 - t) });
  if (t > 3.55) {
    const progress = clamp01((t - 3.55) / 3.65);
    const eased = progress * progress * (3 - 2 * progress);
    const x = 44 * (1 - eased); const y = 31 * (1 - eased);
    const width = 296 + 88 * eased; const height = 167 + 49 * eased;
    // leather cover, page block, ribbon and corner ornaments
    renderer.rect({ x: x - 9, y: y - 9, width: width + 18, height: height + 18, fill: '#4a3220', stroke: '#2a1c12', lineWidth: 2, radius: 7 }, RenderLayer.GROUND, 2);
    renderer.rect({ x: x - 5, y: y - 5, width: width + 10, height: height + 10, fill: {
      type: 'linear', x0: 0, y0: y - 5, x1: 0, y1: y + height + 5,
      stops: [[0, '#d8bd88'], [.5, '#c7ad78'], [1, '#ab9066']],
    }, stroke: '#67492e', lineWidth: 2, radius: 5 }, RenderLayer.DETAIL);
    if (config.openingPlate?.complete) {
      renderer.sprite({ image: config.openingPlate, x, y, width, height }, RenderLayer.OBJECT);
      renderer.rect({ x, y, width, height, fill: {
        type: 'radial', x0: x + width / 2, y0: y + height / 2, r0: height * .3,
        x1: x + width / 2, y1: y + height / 2, r1: width * .7,
        stops: [[0, 'rgba(20,14,10,0)'], [1, 'rgba(24,16,10,.45)']],
      } }, RenderLayer.OVERHEAD, 0);
      renderer.rect({ x, y, width, height, stroke: '#8c714d', lineWidth: 2, radius: 4 }, RenderLayer.OVERHEAD, 1);
    } else {
      renderer.rect({ x, y, width, height, fill: '#c7ad78', stroke: '#57452f', radius: 4 }, RenderLayer.OBJECT);
      for (let rule = 18; rule < height - 10; rule += 13) {
        renderer.line({ x1: x + 14, y1: y + rule, x2: x + width - 14, y2: y + rule, stroke: 'rgba(120,94,60,.22)' }, RenderLayer.OBJECT, 1);
      }
    }
    for (const corner of [[x, y, 1, 1], [x + width, y, -1, 1], [x, y + height, 1, -1], [x + width, y + height, -1, -1]]) {
      const [cx, cy, sx, sy] = corner;
      renderer.path({ points: [{ x: cx + sx * 16, y: cy + sy * 2 }, { x: cx + sx * 2, y: cy + sy * 2 }, { x: cx + sx * 2, y: cy + sy * 16 }],
        stroke: '#e2c98f', lineWidth: 1.6, close: false, alpha: .8 }, RenderLayer.OVERHEAD, 2);
      renderer.circle({ x: cx + sx * 6, y: cy + sy * 6, radius: 1.4, fill: '#e2c98f', alpha: .8 }, RenderLayer.OVERHEAD, 2);
    }
    renderer.rect({ x: x + width * .5 - 4, y: y - 5, width: 8, height: height * .34, fill: '#8d3e3a', alpha: .85 }, RenderLayer.OVERHEAD, 3);
    renderer.polygon({ points: [{ x: x + width * .5 - 4, y: y - 5 + height * .34 }, { x: x + width * .5, y: y - 10 + height * .34 },
      { x: x + width * .5 + 4, y: y - 5 + height * .34 }], fill: '#6f2d2c', alpha: .85 }, RenderLayer.OVERHEAD, 3);
    if (progress > .55) renderer.text({ text: 'Press E / J to enter the page', x: 192, y: 204, align: 'center', fill: PALETTE.parchment, font: 'bold 8px Georgia', stroke: '#171314', lineWidth: 3 });
  }
  renderer.rect({ x: 0, y: 0, width: w, height: h, fill: {
    type: 'radial', x0: w / 2, y0: h / 2, r0: h * .3, x1: w / 2, y1: h / 2, r1: w * .74,
    stops: [[0, 'rgba(4,6,7,0)'], [1, 'rgba(3,5,6,.72)']],
  } }, RenderLayer.LIGHTING);
}

// ── interiors ─────────────────────────────────────────────────────────────────
const ROOMS = {
  tavern: ['THE HEARTH & THISTLE', '#6c4633'],
  apothecary: ['APOTHECARY', '#526751'],
  smithy: ['MILLHAVEN SMITHY', '#5f4a42'],
  mill: ['THE OLD MILL', '#6a5940'],
};

export function drawInterior(ctx) {
  const { renderer, state, clock } = ctx;
  const [title, accent] = ROOMS[state.interior] ?? ['MILLHAVEN', '#5b5044'];
  renderer.rect({ x: 0, y: 0, width: 384, height: 216, fill: '#140f0d' }, RenderLayer.GROUND);
  renderer.rect({ x: 30, y: 20, width: 324, height: 184, fill: {
    type: 'linear', x0: 0, y0: 20, x1: 0, y1: 204, stops: [[0, '#463a30'], [.55, '#3a3029'], [1, '#2b231e']],
  }, stroke: '#b08b5b', lineWidth: 3, radius: 8 }, RenderLayer.GROUND, 1);
  for (let y = 48; y < 196; y += 16) {
    renderer.line({ x1: 38, y1: y, x2: 346, y2: y, stroke: 'rgba(196,149,92,.2)' }, RenderLayer.DETAIL);
    renderer.line({ x1: 38, y1: y + 1, x2: 346, y2: y + 1, stroke: 'rgba(20,14,10,.25)' }, RenderLayer.DETAIL);
  }
  for (let x = 46; x < 348; x += 38) renderer.line({ x1: x, y1: 44, x2: x, y2: 200, stroke: 'rgba(20,14,10,.16)' }, RenderLayer.DETAIL);
  // rug, wall sconces and their pooled light
  renderer.ellipse({ x: 192, y: 150, radiusX: 96, radiusY: 34, fill: '#5b3b32', stroke: '#2c1f1c' }, RenderLayer.DETAIL, 2);
  renderer.ellipse({ x: 192, y: 150, radiusX: 82, radiusY: 27, stroke: 'rgba(214,170,110,.35)' }, RenderLayer.DETAIL, 3);
  renderer.ellipse({ x: 192, y: 150, radiusX: 40, radiusY: 13, fill: '#6d4839' }, RenderLayer.DETAIL, 3);
  for (const sconce of [72, 312]) {
    renderer.rect({ x: sconce - 3, y: 118, width: 6, height: 9, fill: '#41372c', stroke: '#221c16' }, RenderLayer.OBJECT);
    drawFlame(ctx, sconce, 120, 11, 4.6, clock + sconce, 1, RenderLayer.OBJECT);
    renderer.circle({ x: sconce, y: 114, radius: 34, fill: {
      type: 'radial', x0: sconce, y0: 114, r0: 0, x1: sconce, y1: 114, r1: 34,
      stops: [[0, 'rgba(255,186,96,.24)'], [1, 'rgba(255,186,96,0)']],
    } }, RenderLayer.LIGHTING, 1);
  }
  renderer.rect({ x: 54, y: 45, width: 276, height: 58, fill: accent, stroke: '#271f1d', radius: 5 }, RenderLayer.OBJECT);
  renderer.rect({ x: 54, y: 45, width: 276, height: 8, fill: 'rgba(255,226,168,.14)' }, RenderLayer.OBJECT, 1);
  for (let beam = 66; beam < 330; beam += 44) renderer.rect({ x: beam, y: 45, width: 4, height: 58, fill: 'rgba(30,22,18,.35)' }, RenderLayer.OBJECT, 1);
  if (state.interior === 'tavern') {
    renderer.rect({ x: 76, y: 64, width: 232, height: 18, fill: '#7c5939', stroke: '#2d2420', radius: 3 }, RenderLayer.OBJECT, 2);
    renderer.rect({ x: 76, y: 64, width: 232, height: 4, fill: '#a0784e' }, RenderLayer.OBJECT, 3);
    for (let x = 95; x < 300; x += 42) {
      renderer.ellipse({ x, y: 91, radiusX: 6, radiusY: 6, fill: '#b77746', stroke: '#39261f' }, RenderLayer.ENTITY);
      renderer.ellipse({ x, y: 89, radiusX: 4, radiusY: 2.4, fill: '#e2c07a' }, RenderLayer.ENTITY, 1);
    }
    drawFlame(ctx, 300, 100, 16, 7, clock, 2, RenderLayer.ENTITY);
    for (const table of [{ x: 108, y: 148 }, { x: 276, y: 152 }]) {
      renderer.ellipse({ x: table.x, y: table.y + 4, radiusX: 24, radiusY: 9, fill: 'rgba(10,8,6,.35)' }, RenderLayer.DETAIL, 4);
      renderer.ellipse({ x: table.x, y: table.y, radiusX: 22, radiusY: 11, fill: '#8a6039', stroke: '#3a281c' }, RenderLayer.OBJECT, 3);
      renderer.ellipse({ x: table.x - 5, y: table.y - 3, radiusX: 12, radiusY: 5, fill: 'rgba(216,178,120,.3)' }, RenderLayer.OBJECT, 4);
      for (const stool of [-31, 31]) {
        renderer.ellipse({ x: table.x + stool, y: table.y + 6, radiusX: 7, radiusY: 4, fill: '#6b4a2f', stroke: '#31221a' }, RenderLayer.OBJECT, 3);
      }
      renderer.ellipse({ x: table.x + 8, y: table.y - 2, radiusX: 4, radiusY: 3.4, fill: '#b77746', stroke: '#39261f' }, RenderLayer.OBJECT, 5);
    }
  } else if (state.interior === 'apothecary') {
    for (let x = 82; x < 310; x += 32) {
      renderer.rect({ x, y: 63, width: 12, height: 20, fill: x % 3 ? '#8b684d' : '#556d68', stroke: '#2b2826', radius: 3 }, RenderLayer.ENTITY);
      renderer.rect({ x: x + 3, y: 59, width: 6, height: 5, fill: '#4d4139', stroke: '#241f1c' }, RenderLayer.ENTITY, 1);
      renderer.rect({ x: x + 2, y: 70, width: 8, height: 9, fill: x % 3 ? 'rgba(226,180,110,.5)' : 'rgba(150,200,190,.4)' }, RenderLayer.ENTITY, 2);
    }
  } else if (state.interior === 'smithy') {
    renderer.circle({ x: 110, y: 76, radius: 18, fill: '#3a2b25', stroke: '#2c2523' }, RenderLayer.ENTITY);
    renderer.circle({ x: 110, y: 78, radius: 13, fill: '#b64f35' }, RenderLayer.ENTITY, 1);
    drawFlame(ctx, 110, 82, 22, 10, clock, 2, RenderLayer.ENTITY);
    renderer.rect({ x: 245, y: 68, width: 42, height: 14, fill: '#737879', stroke: '#25292a', radius: 4 }, RenderLayer.ENTITY, 5);
    renderer.rect({ x: 258, y: 82, width: 16, height: 18, fill: '#4d4c46', stroke: '#25292a' }, RenderLayer.ENTITY, 5);
    renderer.line({ x1: 200, y1: 60, x2: 216, y2: 92, stroke: '#8d949a', lineWidth: 3 }, RenderLayer.ENTITY, 5);
  } else {
    renderer.circle({ x: 105, y: 76, radius: 24, stroke: '#a58a5a', lineWidth: 5 }, RenderLayer.ENTITY);
    for (let spoke = 0; spoke < 8; spoke += 1) {
      const angle = spoke * Math.PI / 4 + clock * .3;
      renderer.line({ x1: 105, y1: 76, x2: 105 + Math.cos(angle) * 22, y2: 76 + Math.sin(angle) * 22, stroke: 'rgba(165,138,90,.6)', lineWidth: 2 }, RenderLayer.ENTITY, 1);
    }
    renderer.rect({ x: 230, y: 65, width: 58, height: 28, fill: '#927447', stroke: '#382d24' }, RenderLayer.ENTITY, 2);
    renderer.rect({ x: 236, y: 71, width: 46, height: 4, fill: 'rgba(232,210,162,.35)' }, RenderLayer.ENTITY, 3);
  }
  renderer.text({ text: title, x: 192, y: 36, align: 'center', fill: PALETTE.parchment, font: 'bold 10px Georgia', stroke: '#171314', lineWidth: 2.5 });
  renderer.text({ text: 'E near the back to investigate · E at the door to leave', x: 192, y: 197, align: 'center', fill: '#d4bf91', font: '8px Georgia', stroke: '#171314', lineWidth: 2 });
  drawInteriorHero(ctx);
  renderer.rect({ x: 172, y: 184, width: 40, height: 20, fill: '#2c2422', stroke: '#8c6844' }, RenderLayer.OBJECT, 4);
  renderer.rect({ x: 176, y: 186, width: 32, height: 16, fill: '#1c1614' }, RenderLayer.OBJECT, 5);
  renderer.rect({ x: 0, y: 0, width: 384, height: 216, fill: {
    type: 'radial', x0: 192, y0: 108, r0: 60, x1: 192, y1: 108, r1: 240,
    stops: [[0, 'rgba(6,8,8,0)'], [1, 'rgba(6,8,8,.6)']],
  } }, RenderLayer.LIGHTING);
}

function drawInteriorHero(ctx) {
  const { renderer, state } = ctx;
  const x = state.interiorX; const y = state.interiorY;
  renderer.ellipse({ x, y: y + 10, radiusX: 9, radiusY: 3.6, fill: 'rgba(12,14,13,.34)' }, RenderLayer.DETAIL);
  renderer.path({ points: [{ x: x - 9, y: y + 12 }, { x: x - 6, y: y - 6, cx: x - 11, cy: y + 2 },
    { x: x + 6, y: y - 6 }, { x: x + 9, y: y + 12, cx: x + 11, cy: y + 2 }], fill: '#7b2f36', stroke: '#3e1a1e' }, RenderLayer.ENTITY);
  renderer.path({ points: [{ x: x - 8, y: y + 11 }, { x: x - 5, y: y - 7, cx: x - 8, cy: y + 1 },
    { x: x + 5, y: y - 7 }, { x: x + 8, y: y + 11, cx: x + 8, cy: y + 1 }],
    fill: { type: 'linear', x0: x - 8, y0: 0, x1: x + 8, y1: 0, stops: [[0, '#4a6f8a'], [1, '#26404f']] }, stroke: PALETTE.ink }, RenderLayer.ENTITY, 1);
  renderer.rect({ x: x - 8, y: y + 2, width: 16, height: 3, fill: '#5b3f28' }, RenderLayer.ENTITY, 2);
  renderer.circle({ x, y: y - 12, radius: 6, fill: '#d6aa7f', stroke: PALETTE.ink }, RenderLayer.ENTITY, 3);
  renderer.path({ points: [{ x: x - 6.4, y: y - 13 }, { x, y: y - 20, cx: x - 5, cy: y - 20 },
    { x: x + 6.4, y: y - 13, cx: x + 5, cy: y - 20 }, { x: x + 5, y: y - 10, cx: x + 7.4, cy: y - 11 },
    { x: x - 5, y: y - 10, cx: x, cy: y - 15 }], fill: '#4b352c' }, RenderLayer.ENTITY, 4);
  renderer.circle({ x: x - 2.2, y: y - 12, radius: .9, fill: '#2f231e' }, RenderLayer.ENTITY, 5);
  renderer.circle({ x: x + 2.2, y: y - 12, radius: .9, fill: '#2f231e' }, RenderLayer.ENTITY, 5);
}

// ── UI: parchment and ink ─────────────────────────────────────────────────────
function ornateFrame(renderer, x, y, width, height, layer, order = 0, accent = '#b59a67', alpha = 1) {
  renderer.rect({ x: x + 2, y: y + 2, width, height, fill: 'rgba(8,8,10,.4)', radius: 4, alpha }, layer, order);
  renderer.rect({ x, y, width, height, fill: {
    type: 'linear', x0: 0, y0: y, x1: 0, y1: y + height,
    stops: [[0, 'rgba(46,40,42,.94)'], [1, 'rgba(26,22,24,.94)']],
  }, stroke: accent, radius: 4, alpha }, layer, order + 1);
  renderer.rect({ x: x + 2, y: y + 2, width: width - 4, height: height - 4, stroke: 'rgba(232,210,162,.16)', radius: 3, alpha }, layer, order + 2);
  for (const corner of [[x, y, 1, 1], [x + width, y, -1, 1], [x, y + height, 1, -1], [x + width, y + height, -1, -1]]) {
    const [cx, cy, sx, sy] = corner;
    renderer.path({ points: [{ x: cx + sx * 9, y: cy + sy * 2 }, { x: cx + sx * 2, y: cy + sy * 2 }, { x: cx + sx * 2, y: cy + sy * 9 }],
      stroke: accent, close: false, alpha }, layer, order + 3);
  }
}

export function drawHud(ctx) {
  const { renderer, state, player, canvas } = ctx;
  ornateFrame(renderer, 8, 8, 104, 24, RenderLayer.UI, 0);
  renderer.rect({ x: 13, y: 13, width: 90, height: 7, fill: 'rgba(12,10,10,.7)', radius: 2 }, RenderLayer.UI, 4);
  renderer.rect({ x: 14, y: 14, width: 88 * player.health / player.maxHealth, height: 5, fill: {
    type: 'linear', x0: 0, y0: 14, x1: 0, y1: 19, stops: [[0, '#c05852'], [1, PALETTE.blood]],
  } }, RenderLayer.UI, 5);
  renderer.rect({ x: 14, y: 14, width: 88 * player.health / player.maxHealth, height: 2, fill: 'rgba(255,214,196,.28)' }, RenderLayer.UI, 6);
  renderer.rect({ x: 13, y: 21, width: 90, height: 5, fill: 'rgba(12,10,10,.7)', radius: 2 }, RenderLayer.UI, 4);
  renderer.rect({ x: 14, y: 22, width: 88 * player.stamina / player.maxStamina, height: 3, fill: '#c0a65b' }, RenderLayer.UI, 5);
  // quest ribbon — suppressed while the boss banner holds the same slot
  if (!ctx.bossBanner) {
    const quest = ctx.questText;
    renderer.rect({ x: canvas.width / 2 - 108, y: 6, width: 216, height: 13, fill: 'rgba(24,20,22,.8)', radius: 2 }, RenderLayer.UI, 0);
    for (const side of [-1, 1]) {
      renderer.polygon({ points: [{ x: canvas.width / 2 + side * 108, y: 6 }, { x: canvas.width / 2 + side * 118, y: 6 },
        { x: canvas.width / 2 + side * 113, y: 12.5 }, { x: canvas.width / 2 + side * 118, y: 19 },
        { x: canvas.width / 2 + side * 108, y: 19 }], fill: 'rgba(24,20,22,.68)' }, RenderLayer.UI, 0);
    }
    renderer.line({ x1: canvas.width / 2 - 104, y1: 18, x2: canvas.width / 2 + 104, y2: 18, stroke: 'rgba(199,166,104,.5)' }, RenderLayer.UI, 1);
    renderer.text({ text: quest, x: 192, y: 15, align: 'center', fill: PALETTE.parchment, font: '8px Georgia' });
  }
  if (ctx.nearest && !state.dialogue) {
    const pillWidth = Math.max(90, Math.min(200, ctx.nearest.name.length * 4.6 + 44));
    renderer.rect({ x: 192 - pillWidth / 2, y: 187, width: pillWidth, height: 14, fill: 'rgba(22,18,20,.78)', radius: 7 }, RenderLayer.UI, 0);
    renderer.circle({ x: 192 - pillWidth / 2 + 12, y: 194, radius: 5.2, fill: '#2c2422', stroke: PALETTE.gold }, RenderLayer.UI, 1);
    renderer.text({ text: 'E', x: 192 - pillWidth / 2 + 12, y: 197, align: 'center', fill: PALETTE.gold, font: 'bold 7px Georgia' }, RenderLayer.UI, 2);
    renderer.text({ text: ctx.nearest.name, x: 192 + 11, y: 196, align: 'center', fill: PALETTE.parchment, font: 'bold 8px Georgia' }, RenderLayer.UI, 2);
  }
  if (state.toastTime > 0) {
    const alpha = Math.min(1, state.toastTime * 1.6);
    ornateFrame(renderer, 55, 154, 274, 30, RenderLayer.UI, 3, '#8d7853', alpha);
    renderer.text({ text: state.toast, x: 192, y: 165, align: 'center', fill: PALETTE.parchment, font: '8px Georgia',
      wrapWidth: 250, lineHeight: 10, maxLines: 2, alpha }, RenderLayer.UI, 7);
  }
  if (state.storyPending) renderer.text({ text: '✦ The storyteller is turning a page…', x: 192, y: 207, align: 'center', fill: '#e3a85e', font: 'italic 8px Georgia', stroke: '#171314', lineWidth: 2 });
  if (!ctx.touchControls) renderer.text({ text: 'TAB Chronicle · ? Help', x: 376, y: 210, align: 'right', fill: '#d2bf92', font: '7px Georgia', stroke: '#171314', lineWidth: 2 });
}

export function drawDialogue(ctx) {
  const { renderer, state } = ctx;
  ornateFrame(renderer, 20, 142, 344, 66, RenderLayer.UI, 10);
  if (state.dialogue === 'decision') {
    renderer.text({ text: 'Corven: Break the seal and the river may flood—or bind me here so Millhaven prospers.',
      x: 32, y: 156, fill: PALETTE.parchment, font: '8px Georgia', wrapWidth: 318, lineHeight: 10, maxLines: 3 }, RenderLayer.UI, 14);
    renderer.line({ x1: 32, y1: 190, x2: 352, y2: 190, stroke: 'rgba(199,166,104,.28)' }, RenderLayer.UI, 14);
    // The choice is deliberately deaf for a beat after the boss falls, so that a
    // mashed attack cannot answer it. Fade the options in over that beat: a
    // prompt that ignores the key without showing why reads as a frozen game.
    const ready = Math.max(0, Math.min(1, 1 - state.decisionLock / 1.5));
    renderer.text({ text: 'J — Break the seal', x: 112, y: 200, align: 'center', fill: '#e3a85e', font: 'bold 8px Georgia', alpha: .25 + ready * .75 }, RenderLayer.UI, 14);
    renderer.text({ text: 'K — Renew the binding', x: 272, y: 200, align: 'center', fill: '#e3a85e', font: 'bold 8px Georgia', alpha: .25 + ready * .75 }, RenderLayer.UI, 14);
    return;
  }
  renderer.circle({ x: 40, y: 153, radius: 9, fill: '#3a3230', stroke: PALETTE.gold }, RenderLayer.UI, 14);
  renderer.circle({ x: 40, y: 151, radius: 3.4, fill: '#d6aa7f' }, RenderLayer.UI, 15);
  renderer.path({ points: [{ x: 34, y: 161 }, { x: 40, y: 154, cx: 34, cy: 154 }, { x: 46, y: 161, cx: 46, cy: 154 }],
    fill: ctx.dialogueColor ?? '#7a6348' }, RenderLayer.UI, 15);
  renderer.text({ text: ctx.dialogueTitle ?? '', x: 54, y: 156, fill: '#e3a85e', font: 'bold 9px Georgia' }, RenderLayer.UI, 14);
  renderer.line({ x1: 54, y1: 160, x2: 352, y2: 160, stroke: 'rgba(199,166,104,.32)' }, RenderLayer.UI, 14);
  renderer.text({ text: ctx.dialogueLine ?? '', x: 32, y: 171, fill: PALETTE.parchment, font: '8px Georgia',
    wrapWidth: 304, lineHeight: 10, maxLines: 3 }, RenderLayer.UI, 14);
  renderer.text({ text: 'E', x: 348, y: 202, align: 'right', fill: PALETTE.gold, font: 'bold 8px Georgia' }, RenderLayer.UI, 14);
  renderer.polygon({ points: [{ x: 352, y: 198 }, { x: 356, y: 200 }, { x: 352, y: 202 }], fill: PALETTE.gold }, RenderLayer.UI, 14);
}

function pageSpread(renderer, x, y, width, height) {
  renderer.rect({ x: 0, y: 0, width: 384, height: 216, fill: '#171314' }, RenderLayer.GROUND);
  renderer.rect({ x: x - 6, y: y - 6, width: width + 12, height: height + 12, fill: '#4a3220', stroke: '#291b12', lineWidth: 2, radius: 8 }, RenderLayer.GROUND, 1);
  renderer.rect({ x, y, width, height, fill: {
    type: 'linear', x0: 0, y0: y, x1: 0, y1: y + height, stops: [[0, '#e2cb99'], [.5, '#d7c08d'], [1, '#c2a97c']],
  }, stroke: '#5b432e', radius: 4 }, RenderLayer.OBJECT);
  renderer.rect({ x: x + width / 2 - 9, y, width: 18, height, fill: {
    type: 'linear', x0: x + width / 2 - 9, y0: 0, x1: x + width / 2 + 9, y1: 0,
    stops: [[0, 'rgba(90,66,40,0)'], [.5, 'rgba(90,66,40,.3)'], [1, 'rgba(90,66,40,0)']],
  } }, RenderLayer.OBJECT, 1);
  renderer.line({ x1: x + width / 2, y1: y + 6, x2: x + width / 2, y2: y + height - 6, stroke: PALETTE.rule }, RenderLayer.OBJECT, 2);
  for (const corner of [[x, y, 1, 1], [x + width, y, -1, 1], [x, y + height, 1, -1], [x + width, y + height, -1, -1]]) {
    const [cx, cy, sx, sy] = corner;
    renderer.path({ points: [{ x: cx + sx * 18, y: cy + sy * 5 }, { x: cx + sx * 5, y: cy + sy * 5 }, { x: cx + sx * 5, y: cy + sy * 18 }],
      stroke: 'rgba(107,79,46,.6)', close: false }, RenderLayer.OBJECT, 3);
    renderer.circle({ x: cx + sx * 9, y: cy + sy * 9, radius: 1.4, fill: 'rgba(107,79,46,.55)' }, RenderLayer.OBJECT, 3);
  }
}

export function drawChronicle(ctx) {
  const { renderer, state } = ctx;
  pageSpread(renderer, 28, 12, 328, 192);
  // ruled lines sit under the actual text baselines of each column
  for (let line = 0; line < 9; line += 1) {
    renderer.line({ x1: 44, y1: 74 + line * 11, x2: 172, y2: 74 + line * 11, stroke: 'rgba(120,94,60,.16)' }, RenderLayer.OBJECT, 4);
  }
  for (let entry = 0; entry < 5; entry += 1) {
    renderer.line({ x1: 210, y1: 74 + entry * 24, x2: 340, y2: 74 + entry * 24, stroke: 'rgba(120,94,60,.16)' }, RenderLayer.OBJECT, 4);
    renderer.line({ x1: 210, y1: 84 + entry * 24, x2: 340, y2: 84 + entry * 24, stroke: 'rgba(120,94,60,.16)' }, RenderLayer.OBJECT, 4);
  }
  renderer.text({ text: 'THE LIVING CHRONICLE', x: 192, y: 34, align: 'center', fill: PALETTE.ink, font: 'bold 11px Georgia' });
  renderer.line({ x1: 104, y1: 40, x2: 184, y2: 40, stroke: PALETTE.rule }, RenderLayer.UI, 1);
  renderer.line({ x1: 200, y1: 40, x2: 280, y2: 40, stroke: PALETTE.rule }, RenderLayer.UI, 1);
  for (const dx of [-8, 0, 8]) {
    renderer.polygon({ points: [{ x: 192 + dx, y: 37 }, { x: 195 + dx, y: 40 }, { x: 192 + dx, y: 43 }, { x: 189 + dx, y: 40 }],
      fill: dx ? 'rgba(140,113,77,.6)' : PALETTE.rule }, RenderLayer.UI, 1);
  }
  renderer.text({ text: 'Rumor in Millhaven', x: 44, y: 57, fill: PALETTE.quill, font: 'bold 9px Georgia' });
  renderer.text({ text: state.rumor, x: 44, y: 72, fill: PALETTE.ink, font: 'italic 8px Georgia', wrapWidth: 128, lineHeight: 11, maxLines: 9 });
  renderer.text({ text: 'What Eldric did', x: 210, y: 57, fill: PALETTE.quill, font: 'bold 9px Georgia' });
  state.chronicle.slice(-5).forEach((entry, index) => {
    renderer.circle({ x: 205, y: 70 + index * 24, radius: 1.6, fill: PALETTE.quill }, RenderLayer.UI, 1);
    renderer.text({ text: entry, x: 210, y: 72 + index * 24, fill: PALETTE.ink, font: '8px Georgia', wrapWidth: 128, lineHeight: 10, maxLines: 2 });
  });
  renderer.text({ text: 'TAB to close', x: 192, y: 196, align: 'center', fill: PALETTE.quill, font: '7px Georgia' });
}

export function drawInventory(ctx) {
  const { renderer, state } = ctx;
  renderer.rect({ x: 0, y: 0, width: 384, height: 216, fill: '#131b1a' }, RenderLayer.GROUND);
  ornateFrame(renderer, 42, 22, 300, 172, RenderLayer.OBJECT, 0);
  renderer.text({ text: 'TRAVELER’S SATCHEL', x: 192, y: 46, align: 'center', fill: PALETTE.parchment, font: 'bold 11px Georgia' });
  renderer.line({ x1: 92, y1: 52, x2: 292, y2: 52, stroke: 'rgba(181,154,103,.5)' }, RenderLayer.UI, 1);
  state.inventory.forEach((item, index) => {
    const y = 65 + index * 36;
    renderer.rect({ x: 70, y, width: 244, height: 27, fill: {
      type: 'linear', x0: 70, y0: 0, x1: 314, y1: 0, stops: [[0, '#443b3a'], [1, '#332c2d']],
    }, stroke: '#6f6046', radius: 3 }, RenderLayer.UI);
    renderer.rect({ x: 76, y: y + 5, width: 17, height: 17, fill: '#241e1f', stroke: '#8d7853', radius: 2 }, RenderLayer.UI, 1);
    renderer.line({ x1: 80, y1: y + 19, x2: 89, y2: y + 9, stroke: '#e6e1cd', lineWidth: 2.4 }, RenderLayer.UI, 2);
    renderer.line({ x1: 79, y1: y + 15, x2: 84, y2: y + 20, stroke: PALETTE.gold, lineWidth: 2 }, RenderLayer.UI, 3);
    renderer.circle({ x: 79.5, y: y + 19.5, radius: 1.4, fill: PALETTE.gold }, RenderLayer.UI, 4);
    renderer.text({ text: item, x: 100, y: y + 17, fill: PALETTE.parchment, font: '9px Georgia' });
  });
  renderer.text({ text: 'I to close', x: 192, y: 181, align: 'center', fill: '#b59a67', font: '7px Georgia' });
}

function shade(hex, factor) {
  const value = hex.replace('#', '');
  const channel = (offset) => Math.max(0, Math.min(255, Math.round(parseInt(value.slice(offset, offset + 2), 16) * factor)));
  return `rgb(${channel(0)},${channel(2)},${channel(4)})`;
}
