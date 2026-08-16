# WordPress host

`living-chronicle/` is the installable plugin. It hosts the web build and provides optional
backend services; it is not the game. Nothing in `packages/engine/` may depend on anything here.

- `[living_chronicle]` embeds the game. Config is passed per shortcode instance on a data
  attribute, so two shortcodes on one page cannot collide.
- CSS is scoped under a single root class; the bundle exposes one global with `mount`/`unmount`.
- **The REST proxy (`lc/v1`) is the only place an AI API key exists.** It enforces nonce and
  permission checks, request validation, per-user and per-IP rate limiting, timeouts, maximum
  prompt and response sizes, response validation, and an authored fallback on every failure path.
- Built assets land in `living-chronicle/assets/build/` — **never** a `dist/` directory, which the
  repo `.gitignore` silently swallows.

Files here that touch the proxy, providers, settings or the response validator are on the
Autonomous-Edit Denylist in `l00prite/.l00prite/constraints.md` and need human review.

The 0.1 plugin is implemented and installable. Build it with `npm run build:wp`; installation and
page-cache guidance live in `living-chronicle/INSTALL.md`.
