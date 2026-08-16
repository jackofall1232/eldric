# @eldric/game

Eldric itself: rule wiring, scenes, entities and all content for the Millhaven region.
Imports `@eldric/engine`; the engine never imports this package.

- `src/main.js` — standalone web entry (used by the root `index.html` dev host).
- `src/embed.js` — WordPress entry, exporting `mount(element, config)` / `unmount(element)`.
- `src/content/` — items, enemies, NPCs, quests, dialogue, encounter templates, the local story
  corpus and authored fallbacks. Authored content must keep the game fully playable with the AI
  provider disabled.
- `src/regions/millhaven/` — village, forest, dangerous road, river, ruin, cave, dungeon and one
  hidden location. Dense, not large: every few screens should hold something worth noticing.

The 0.1 content package ships the complete authored Millhaven/Blackwater vertical slice and local
story corpus. `src/runtime/game-runtime.js` currently composes the playable web slice while the
smaller scene/entity modules remain the extraction seam for later regional expansion.
