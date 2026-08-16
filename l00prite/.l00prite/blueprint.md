# Project Blueprint

## Mission
**Vibe Code: The Living Chronicle** (repo `eldric`) is a top-down medieval fantasy
action-adventure game, playable in the browser and embedded in WordPress through a
`[living_chronicle]` shortcode. The target is a polished 15–30 minute vertical slice around the
village of Millhaven and whatever lives beneath Blackwater Bridge — dense, not large. An AI
storyteller wraps the game, watching what the player actually did and generating dialogue,
rumors, quests, consequences and Chronicle entries so the world remembers them. Success is a
player finishing the slice and thinking *"this isn't the story of the hero, this is the story of
what I did."*

Two conditions are non-negotiable: the game must be fully playable and still delightful with AI
completely disabled (a local no-API-key story provider is the default), and the game core must
stay independent of WordPress so the same core can later run inside an Android wrapper.

The full blueprint — requirements, definition of done, operating loop, heartbeat rules — lives in
`../CLAUDE.md`. This file is the short version for agents loading memory.

## Architecture
Vanilla JavaScript ES modules, Canvas2D, Vite. No game framework. Two npm workspaces plus a thin
PHP host:

- `packages/engine/` — vendor-neutral core. Knows nothing about Eldric content and nothing about
  WordPress. Subsystems separated for the Android path: `core/` (fixed-timestep loop, scenes,
  entities, seeded RNG), `render/`, `input/` (abstract action map behind keyboard/pointer/touch
  backends), `audio/`, `save/` (`StorageAdapter` interface), `net/` (transport seam), `story/`
  (`StoryProvider` interface, local provider, response schema + validator), `ui/`.
- `packages/game/` — Eldric itself. Imports the engine; the engine never imports it. Rule systems
  (combat, quests, reputation, NPC memory, rumors, encounters, weather, day/night) and all
  Millhaven content data.
- `wordpress/living-chronicle/` — the installable plugin: shortcode, scoped asset enqueue, settings
  page, and the server-side REST proxy that is the only place an AI API key ever exists. Built
  bundle lands in `assets/build/` (never `dist/` — the root `.gitignore` swallows that path).
- `assets/` source art and audio, `docs/` game design docs, `tests/{unit,integration}/`.

Hard line: **the AI never touches real-time systems.** Movement, physics, collision, combat math,
enemy behaviour and damage are deterministic game code. The game sends compact structured facts;
the storyteller returns structured JSON (`narration`, `npc_dialogue`, `quest_changes`,
`world_changes`, `rumors`, `chronicle_entry`, `memory_updates`) validated field by field before
anything is applied. Unknown actions are ignored, AI output is never executable, and an AI failure
or timeout never blocks gameplay. Generated quests compile to nine objectives (`GO_TO`, `TALK_TO`,
`FIND`, `COLLECT`, `DELIVER`, `DEFEAT`, `PROTECT`, `EXPLORE`, `CHOOSE`); generated encounters fill
narrative variables in authored templates.

Player history lives in a compact Chronicle of event keys, plus seven reputation traits (Honor,
Mercy, Greed, Courage, Loyalty, Infamy, Mystery — never a single good/evil meter) and per-NPC
memory, fed back into later prompts for consistency.

## Requirements
- [ ] Opening sequence: fire, storyteller, book opening, camera into the illustration, control in
      seconds.
- [ ] Core verbs (walk, run, attack, heavy, block, dodge, interact, talk, collect, equip, use).
- [ ] Combat with health, stamina, feedback, knockback, telegraphs, and behaviour-distinct enemies.
- [ ] The Millhaven region: village, forest, road, river, ruin, cave, dungeon, hidden location,
      NPCs, mini-boss, multi-phase major boss.
- [ ] Secrets and puzzles that are not marked on the map.
- [ ] `StoryProvider.generate(context)` with a local provider requiring no API key.
- [ ] Schema-validated storyteller output with authored fallback on any failure.
- [ ] Chronicle book, seven reputation traits, NPC memory, rumors (true, exaggerated and false).
- [ ] Quest system compiling everything to the nine supported objectives.
- [ ] Inventory across weapons, armor, consumables, keys, artifacts, quest items.
- [ ] Atmospheric audio and context-driven music with graceful fallbacks.
- [ ] WordPress plugin with scoped CSS, no global JS leakage, and a rate-limited, validated,
      timeout-bounded server-side AI proxy. No API key in browser JavaScript, ever.
- [ ] Local saves behind a storage adapter; original art throughout; smooth on ordinary Android
      phones.

The full, itemised requirement list is Section 3 of `../CLAUDE.md`.

## Definition of Done
- [ ] `[living_chronicle]` plays on a stock WordPress install with a third-party theme, no console
      errors, no theme damage.
- [ ] The slice is completable start to major boss in 15–30 minutes **with AI disabled**.
- [ ] Malformed, oversized and injection-bearing AI responses are rejected without affecting
      gameplay, covered by tests.
- [ ] No API key or provider secret appears in the built client bundle (verified by grep).
- [ ] Stable frame rate on a mid-range Android phone browser; AI calls demonstrably off the frame
      path.
- [ ] No placeholder rectangles in the shipped region.
- [ ] `node scripts/l00prite-doctor.js .` reports HEALTHY, and each check above is recorded in
      `ledger.md` with command, exit code, summary and timestamp.

## Non-Execution Boundary
This blueprint is guidance for later implementation loops. Scaffolding tools must not execute the project unless a human explicitly starts an implementation session.
