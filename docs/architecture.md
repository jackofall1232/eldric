# Architecture

The dependency direction is deliberately one-way:

```text
WordPress host ─┐
Standalone web ─┴─> @eldric/game ─> @eldric/engine
Android wrapper (future) ──────────> @eldric/engine
```

`@eldric/engine` owns deterministic time, entities/scenes, rendering commands, input actions,
combat, quests, inventory, world memory, audio coordination, saves and the validated storyteller
contract. It knows nothing about Millhaven or WordPress. Browser APIs occur only in declared
render/input/audio/storage/network/platform seams, enforced by `engine-purity.test.js`.

`@eldric/game` owns Eldric content and composes the current vertical slice in
`runtime/game-runtime.js`. Movement, collision, damage and enemy state are synchronous code. The
story system receives compact facts asynchronously and may mutate only allowlisted narrative
state. Provider failure cannot pause or invalidate gameplay.

The standalone Vite build lands in `build/web/`. The WordPress configuration emits one IIFE plus
scoped CSS and copied original assets under `wordpress/living-chronicle/assets/build/`. WordPress
adds shortcode hosting and a server-only REST/provider boundary; the core never imports it.
