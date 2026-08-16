# WordPress host

`living-chronicle/` is the installable plugin. It hosts the web build and provides optional
backend services; it is not the game. Nothing in `packages/engine/` may depend on anything here.

- `[living_chronicle]` embeds the game. Config is passed per shortcode instance on a data
  attribute, so two shortcodes on one page cannot collide.
- CSS is scoped under a single root class; the bundle exposes one global
  (`EldricLivingChronicle`) with `mount`/`mountAll`/`unmount`, and an inline loader calls
  `mountAll` once per page.
- **The REST proxy (`lc/v1`) is the only place an AI API key may ever exist** (0.1 stores no key
  and its runtime plays fully locally without calling the proxy). It enforces nonce and
  permission checks, request validation, per-user and per-IP rate limiting, timeouts, maximum
  prompt and response sizes, response validation, and an authored fallback on every failure path.
- Built assets land in `living-chronicle/assets/build/` — **never** a `dist/` directory, which the
  repo `.gitignore` silently swallows.

Files here that touch the proxy, providers, settings or the response validator are on the
Autonomous-Edit Denylist in `l00prite/.l00prite/constraints.md` and need human review.

The 0.1 plugin is implemented and installable. Build the bundle with `npm run build:wp`, or run
`scripts/build-wp-zip.sh` to produce the installable `build/eldric-living-chronicle-0.1.0.zip`;
installation and page-cache guidance live in `living-chronicle/INSTALL.md`.
