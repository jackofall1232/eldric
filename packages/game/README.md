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

Everything is a stub today. See `l00prite/.l00prite/todos.md` (milestones M2–M6).
