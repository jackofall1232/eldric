# Prioritized TODOs

Milestones are ordered so each one leaves the game playable. Work the top unchecked item in
**Next**; do not batch unrelated items into one iteration. Each item should be small enough to
implement and verify in a single loop.

## Next

### M1 — Engine skeleton (first playable: a grey box that moves)
- [x] Real build config: `package.json`, `vite.config.js`, `vite.config.wp.js` and `index.html`
      exist as stubs — fill them in, install dependencies, and get `npm run dev` serving a blank
      canvas (smallest useful step; nothing else runs until this does). The WordPress config must
      emit an IIFE bundle into `wordpress/living-chronicle/assets/build/`, never `dist/`.
- [x] `packages/engine/src/core/loop.js` — fixed-timestep update with interpolated render, pause
      and resume, no frame-rate-dependent movement.
- [x] `packages/engine/src/core/time.js`, `events.js`, `rng.js` (seeded — replays and procedural
      content must be deterministic).
- [x] `packages/engine/src/core/entity.js` and `scene/` scene stack (world / dialogue / menu /
      chronicle push and pop).
- [x] `packages/engine/src/render/renderer.js` + `canvas2d-backend.js` — the only files allowed to
      touch a 2D context.
- [x] `packages/engine/src/render/camera.js`, `sprite.js`, `spritesheet.js` and the asset loader.
- [x] `packages/engine/src/input/input.js` — abstract action map, with `keyboard.js`, `pointer.js`,
      `touch.js` sources behind it. Gameplay reads actions, never key codes.
- [x] `packages/engine/src/platform/platform.js` — the seam object bundling input sources, audio
      backend, save backend and transport. Nothing else in the codebase branches on platform.
- [x] Purity test asserting no engine file outside the declared seams references `window`,
      `document`, `localStorage` or `fetch`. Land this while it passes trivially.

### M2 — Player and world
- [ ] Tilemap loading and rendering; layered draw order.
- [x] Collision and spatial lookup.
- [x] Player entity with a state machine: idle, walk, run, dodge, block, attack, hurt.
- [ ] Camera follow with soft bounds; screen transitions between areas.
- [x] Interaction system (objects, doors, chests, NPCs); building interiors remain for a later pass.

### M3 — Combat (must feel good before anything else is added)
- [x] Light attack, heavy attack, hitboxes, damage application.
- [x] Health and stamina economy; block and dodge costs.
- [x] Hit feedback: flash, camera shake, knockback, particles; sound hooks remain.
- [x] Enemy attack telegraphs and recovery windows.
- [x] Six behaviour-distinct enemies: wolf (pack, circling), bandit (feints, flees at low health),
      skeleton (reassembles), forest creature (ambush), armored knight (guard break required),
      dungeon creature (ranged/area).
- [x] Mini-boss with a readable two-attack pattern.
- [x] Major boss with multiple phases and a pattern the player can learn.

### M4 — Content systems
- [x] Inventory: weapons, armor, consumables, keys, artifacts, quest items; equipment slots.
- [x] Dialogue system with authored trees for background NPCs.
- [x] Quest system: the nine objectives (`GO_TO`, `TALK_TO`, `FIND`, `COLLECT`, `DELIVER`,
      `DEFEAT`, `PROTECT`, `EXPLORE`, `CHOOSE`) and the compiler that every quest resolves through.
- [x] Encounter templates (e.g. `TRAVELER_IN_TROUBLE`) with narrative variables game code fills.
- [x] Save/load behind the `StorageAdapter` interface, with a versioned schema and migrations.

### M5 — Story layer
- [x] Storyteller output JSON schema (`narration`, `npc_dialogue`, `quest_changes`,
      `world_changes`, `rumors`, `chronicle_entry`, `memory_updates`, `schema_version`).
      **Freeze this before writing the PHP proxy** or the validator gets written twice.
- [x] Validator: allowlist keys, enforce string lengths and array sizes, reject unknown fields and
      unsupported actions. Plus a fixture corpus of malformed, oversized and injection-bearing
      responses.
- [x] The single apply module — the only place validated output mutates world state, structurally
      unable to reach health, damage, position, stamina or hitboxes.
- [x] `StoryProvider.generate(context)` interface and provider registry.
- [x] Local no-API-key provider driven by authored templates and seeded variation.
- [x] Context builder: compact structured facts about what the player did, plus relevant Chronicle
      entries.
- [x] Chronicle: event-key log, generated chapters, the illustrated in-game book that pauses play.
- [x] Reputation: seven traits (Honor, Mercy, Greed, Courage, Loyalty, Infamy, Mystery), read
      differently by different NPCs and factions.
- [x] NPC memory: promises, insults, gifts, debts, betrayals, rescues, prior conversations —
      dialogue evolves instead of resetting.
- [x] Rumor system generating true, exaggerated and false variants from real world state.
- [x] Story beat triggers: new region, campfire rest, important NPC, dungeon cleared, major
      decision, returning to a village, unusual artifact, new chapter.
- [x] Campfire rest: fade, legend summary, Chronicle entry.
- [x] Async story calls with a subtle storyteller indicator — never a frame stall, never a block.

### M6 — The Millhaven region (dense, not large)
- [x] Village of Millhaven: buildings, interiors, several NPCs with conflicting explanations.
- [x] Forest with ambient life and at least three discoveries off the path.
- [x] The dangerous road, the river, the ruined structure.
- [x] The cave and the dungeon, including an environmental puzzle and a key.
- [x] One hidden location, unmarked, gated on remembering something an NPC said.
- [x] Small discoveries every few screens: suspicious rock, abandoned wagon, footprints, statue,
      locked cellar, arguing travellers, smoke beyond the trees.
- [x] The Blackwater Bridge story: attacks on travellers, conflicting accounts, a truth the player
      uncovers, and one decision where neither option is obviously correct.
- [x] Consequences of that decision reaching later dialogue, rumors and the Chronicle.

### M7 — Presentation
- [x] Original art pass: player, NPCs, enemies, bosses, terrain, trees, buildings, water, roads,
      bridges, caves, dungeon tiles, weapons, items, chests, UI, Chronicle book, portraits,
      effects, title screen. One coherent hand-painted storybook direction.
      (2026-08-16: procedural storybook art in `packages/game/src/render/art.js` — gradients,
      timber-framed buildings, layered trees, detailed characters, parchment UI; verified via
      browser screenshots. Judgment of "exceptionally good" remains a human call.)
- [x] The opening: black screen, fire, "Gather close, and heed my tale.", the book, the camera
      descending into a moving illustration, control within seconds.
- [x] Audio: ambience, wind, rain, birds, footsteps, impacts, fire, village chatter, dungeon
      echoes, water, doors, treasure — with graceful fallbacks when assets are missing.
- [x] Music states: exploration, danger, combat, village, dungeon, story moments.
- [x] Particles (leaves, rain, fog, sparks, fireflies) with a dynamic budget on slower devices.
- [x] Lighting around fires, windows, magic and moonlight; day/night cycle; weather.

### M8 — WordPress and ship
- [x] Plugin bootstrap, header, constants; `[living_chronicle]` shortcode with per-instance config
      on a data attribute (multiple shortcodes on one page must not collide).
- [x] Scoped asset enqueue inside the render callback, `lc-` prefixed handles, CSS scoped under a
      single root, one global exposing `mount`/`unmount`.
- [x] REST proxy (`lc/v1/story`, `lc/v1/health`): nonce and permission checks, request validation,
      per-user and per-IP rate limiting, timeouts, maximum prompt and response sizes, PHP-side
      response validation, authored fallback on every failure path. **Human review gate.**
- [x] Settings page with the API key stored write-only server-side and masked on render.
      **Human review gate.**
- [x] PHP/JS schema parity test.
- [x] Nonce lifetime under page caching: verified the client degrades to the local story fallback
      on any REST failure (403 included), and 0.1 hardcodes the local provider so no live nonce is
      required; caching behavior documented in readme.txt/INSTALL.md.
- [x] Build to `wordpress/living-chronicle/assets/build/` — never `dist/`, which `.gitignore`
      silently swallows, leaving the plugin 404ing in production.
- [x] `INSTALL.md` and `readme.txt` are complete and the zip structure is tested
      (`scripts/build-wp-zip.sh`, 39 files, no maps, no secrets, shortcode render simulated with a
      WP-stub harness); installation on a clean WordPress site remains a manual release check.
- [ ] Local bundle/particle/light/audio budgets pass (63,914-byte JS, bounded effects, lazy audio);
      sprite atlases/region streaming and measurement on a mid-range Android phone remain manual.
- [x] Verify no key or secret appears anywhere in the built client bundle.

## Later
- [ ] Android wrapper: replace the platform seams (input source, audio backend, save backend,
      network transport), package assets, ship the local provider offline-first.
- [ ] Cloud saves through WordPress accounts, behind the existing storage adapter.
- [x] A remote LLM story provider behind the same proxy (2026-08-16: `LC_Provider_WP_AI` routes
      through the WordPress 7.0 built-in AI Client — the site's own AI connector — selectable in
      Settings → Eldric Storyteller; proxy rate limits and validation unchanged; local fallback
      on every failure). Cost controls beyond rate limiting remain future work.
- [x] Let the administrator name *which* AI connector answers rather than inheriting core's
      load-order default (2026-08-16: `using_provider()` carries the choice; connectors are
      offered only when a cached support probe says they can generate text; Site AI degrades to
      local when none can, instead of reporting itself available). Connector ids are still
      unverified against a live WP 7.0 install — see manual QA below.
- [ ] Manual QA: WP 7.0+ site with both the Anthropic and OpenAI connector plugins keyed —
      confirm both appear in "Which AI answers", that switching changes `lc/v1/health`, and that
      removing a key flips the connector to "not connected".
- [ ] CI workflow running the test suite and `node scripts/l00prite-doctor.js .` on every PR.
      (`.github/workflows/**` is on the Autonomous-Edit Denylist — needs human sign-off.)
- [ ] Accessibility: remappable controls, colour-blind-safe UI, text scaling, subtitle options.

## M9 — The ten-chapter world map

Full design in `docs/world-map.md`. Chapter one ships; the nine below each measure roughly the
whole of it (see the per-chapter budget in §3 of that doc). **The map is built in horizontal
layers, not chapter by chapter** — the game stays playable end to end at every stage.

The rule that makes it one world rather than ten corridors: **each chapter unlocks one traversal
verb, and every verb retro-opens content in at least two earlier chapters.** No verb may ever be
required to finish an earlier chapter, and the player never loses one.

### Layer 0 — systems the map needs before any chapter of it
- [ ] Region streaming and a world graph: regions load/unload; the map is bigger than memory.
- [ ] The verb/gate system in the engine (a verb is a flag; gates query it; content is authored
      behind one). Engine-side — it must not learn what a "Ferryman's Token" is.
- [ ] Retro-content authoring: a region declares what it exposes at each verb, so a later
      chapter's author adds to chapter one without editing chapter one.
- [ ] Chapter-boundary save and Chronicle carry-over, plus a chapter-select for testing.
- [ ] Region-scoped music beds and cross-fade, now that a scored bed exists.

### Layer 1 — the skeleton
- [ ] All ten regions blocked out at final size with real geometry, zone names, gates and
      connections, and nothing else. Walkable end to end in an hour. The map's shape is proved or
      thrown away here, before art or writing is spent on it.

### Layer 2 — the spine (per chapter: critical path, mini-boss, boss, decision, verb)
| # | Chapter | Unlocks | Retro-opens |
|---|---|---|---|
| 1 | Millhaven & Blackwater ✅ | The River Key | oath-iron locks |
| 2 | Fenmarch, the drowned road | **The Ferryman's Token** — deep water | ch.1 far bank, river cave, drowned fields; every river on the map becomes a road |
| 3 | Ashfoot Wood | **The Warden's Brand** — carried flame | ch.1 lower ruin and deep Gloam Cave, ch.2 barrows; night becomes playable everywhere |
| 4 | The Broken King's Watch | **The Oathglass** — see oath-marks | marks and hidden truths in *every* region so far; ch.1 NPCs become re-readable |
| 5 | Greyhollow | **The Writ of Passage** — faction roads | ch.2 toll road, ch.3 guildhall; the road network becomes the map's spine |
| 6 | The Drowned Chapel & Saltmarsh | **The Litany** — undo a minor oath | every oath-sealed door the Oathglass revealed in ch.1–5 — a chapter's worth in one moment |
| 7 | Coldreach Pass | **The Stormcloak** — survive killing weather | ch.2 storm marsh, ch.3 night-frost, ch.6 high tide |
| 8 | The Iron Assize | **The King's Seal** — authority | royal doors in ch.1/4/5/6; a second dialogue pass for every named NPC |
| 9 | The Undercourt | **The Unmaking Key** — undo a *major* oath | every major decision in ch.1–8 becomes reversible, at a cost. Author last. |
| 10 | The Broken King | **The New Chronicle** (post-game) | all ten regions reflect all ten decisions |

- [ ] Ch.2 Fenmarch — opens in two skins depending on the chapter-one decision (flooded / drought).
- [ ] Ch.3 Ashfoot Wood — first coordinated group enemies; a boss fought in total darkness.
- [ ] Ch.4 The Broken King's Watch — the ch.1 ruin opened into a full region; the oath ledger.
- [ ] Ch.5 Greyhollow — the reputation chapter; Infamy finally has teeth. Boss reads the Chronicle.
- [ ] Ch.6 The Drowned Chapel — tide changes the walkable map. Pairs with ch.4: **author 4 and 6
      as one arc** (4 sees the sealed doors, 6 opens them).
- [ ] Ch.7 Coldreach Pass — vertical region; visibility is the boss mechanic.
- [ ] Ch.8 The Iron Assize — the Chronicle payoff: every prior decision quoted back as evidence.
      Nothing generated; this is the reward for the Chronicle having been honest all along.
- [ ] Ch.9 The Undercourt — the oath-engine is bound people. Deepest content; author last.
- [ ] Ch.10 The Broken King — three unranked endings: restore, unmake, inherit.

### Layer 3 — the depth pass
- [ ] Retro-content for every verb, region by region, oldest first. This is what makes it a world
      and it is the first thing scope pressure will try to cut. Protect it.

### Layer 4 — art and audio, per region, in ship order
- [ ] Per-region scored beds, painted plates, and enemy art for chapters 2–10.

### Layer 5 — the Chronicle payoff (only once every decision above is final)
- [ ] Ch.8's evidence scene and ch.10's New Chronicle.

### Standing rules for every chapter
- [ ] Completable with the AI provider disabled — the storyteller decorates, never carries.
- [ ] Shippable on its own, and a satisfying stopping point, not just chapter ten.
- [ ] The engine never learns Eldric content; regions are data, the verb/gate system is engine.

## Done
- Scaffolded by l00prite Planning Mode: repo trimmed of the imported l00prite protocol source,
  `l00prite/` blueprint + memory + prompts written, root pointers and vendor adapters placed,
  and the game directory structure created as stubs. No implementation yet.
