# Assets

Source art and audio for the game. Every asset must be **original** work created for this
project — original characters, monsters, locations, lore, UI and music. No third-party assets, no
work derived from existing IP.

```
sprites/{player,npc,enemy,boss,items,effects}/   character and object art
tilesets/                                        terrain, buildings, cave and dungeon tiles
maps/                                            map sources
ui/{hud,book,icons,fonts}/                       interface and the Chronicle book
chronicle/                                       illustration plates
audio/{music,sfx,ambient}/                        music states, effects, ambience
```

Runtime loading goes through a generated manifest and sprite atlases — see
`docs/asset-pipeline.md`. Record provenance for every asset in `LICENSES.md` as it arrives, not
at ship time.

Empty today. The shipped region must contain no placeholder rectangles.
