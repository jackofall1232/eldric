# Eldric assets

Every visual and sound source in this tree is original to **Eldric: The Living Chronicle**. The
0.1 vertical slice ships a painted Millhaven opening plate, renderer-native illustrated world and
character silhouettes, procedural weather/light effects, a scored music bed
(`audio/eldric-background.mp3`, supplied by the project owner), and original WebAudio synthesis
for effects — with a silent fallback throughout. It has no runtime CDN dependency: the soundtrack
is served from the same origin as the game, and the game stays complete without it.

`npm run build` copies this tree into `build/web/`; `npm run build:wp` copies it into the plugin’s
`assets/build/`. `manifest.json` identifies runtime assets and `LICENSES.md` records provenance.
Source art remains separate from deterministic game state so later atlas/animation passes do not
change combat, input, saves, or the Android platform seam.
