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
- [ ] CI workflow running the test suite and `node scripts/l00prite-doctor.js .` on every PR.
      (`.github/workflows/**` is on the Autonomous-Edit Denylist — needs human sign-off.)
- [ ] Chapter two: a second region that inherits Chronicle state from the slice.
- [ ] Accessibility: remappable controls, colour-blind-safe UI, text scaling, subtitle options.

## Done
- Scaffolded by l00prite Planning Mode: repo trimmed of the imported l00prite protocol source,
  `l00prite/` blueprint + memory + prompts written, root pointers and vendor adapters placed,
  and the game directory structure created as stubs. No implementation yet.
