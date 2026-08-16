# @eldric/engine

The vendor-neutral game core. It knows nothing about Eldric's content and nothing about
WordPress, so the same core can later run inside an Android wrapper.

**Rules for this package**

- Never import `@eldric/game`. The dependency direction is game → engine, one way.
- Never reference WordPress, or any WordPress-specific global.
- Never touch `window`, `document`, `localStorage` or `fetch` outside a declared platform seam.
  `tests/unit/engine/engine-purity.test.js` enforces this.
- The storyteller never drives movement, physics, collision, combat math, enemy behaviour or
  damage. Those live here as deterministic code and stay that way.

**Platform seams** — the only files an Android build replaces:

| Seam | Files |
|---|---|
| Render | `src/render/canvas2d-backend.js` |
| Input | `src/input/sources/*` |
| Audio | `src/audio/backends/*` |
| Save | `src/save/backends/*` |
| Network | `src/net/transports/*` |
| Platform object | `src/platform/web-platform.js` |

The 0.1 engine implements the deterministic loop, scene/entity lifecycle, Canvas2D command
renderer, camera, abstract input, combat, quests, inventory, reputation, NPC memory, rumors,
Chronicle, time/weather/lighting, audio fallbacks, story validation and storage adapters.
