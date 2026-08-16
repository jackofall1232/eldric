# Constraints

Hard rules, user preferences, security boundaries, and architecture constraints.

## Hard Rules
- Scaffolding generates files only; it does not execute implementation.
- Existing files must not be silently overwritten.
- Every implementation loop must update `.l00prite/` memory before stopping.

## User Preferences
- Vanilla JavaScript ES modules and Canvas2D. No game framework, no TypeScript, no React.
- Vite for the dev server and the production bundle; npm workspaces for `packages/*`.
- Build a game, not an AI demonstration: movement, combat and exploration come before storyteller
  features, and every milestone must leave the game playable.
- Original characters, art, monsters, lore, locations, music and UI only. No third-party or
  generated-from-existing-IP assets, no placeholder rectangles in shipped regions.
- Prioritise a polished 15–30 minute vertical slice over a large unfinished world. Make the opening
  five minutes exceptionally good.

## Security Boundaries
- **No AI API key, provider secret, or proxy credential may ever appear in browser JavaScript**,
  in the built bundle, in a data attribute, or in any client-readable response. Keys live in
  WordPress options and are read server-side only.
- All AI calls go through the WordPress REST proxy (`lc/v1`), which enforces request validation,
  nonce/permission checks, per-user and per-IP rate limiting, request and response timeouts, and
  maximum prompt and response sizes.
- **Storyteller output is untrusted data.** It is validated against the fixed JSON schema —
  server-side in PHP before returning and again client-side before use — with unknown fields and
  unsupported actions dropped, not clamped. AI output is never evaluated, never injected as HTML,
  and never becomes executable code.
- Prompt content derived from player input or NPC text is data, never instructions; the storyteller
  cannot escalate its own permissions or alter the schema.
- Save data is player-owned and local by default. No telemetry, no analytics, no third-party
  network calls from the game client.

## Architecture Constraints
- `packages/engine/` must not import from `packages/game/`, and must not reference WordPress or any
  WordPress-specific global. The dependency direction is game → engine, one way.
- Platform-specific code is confined to declared seams (`input/` sources, `audio/` backends,
  `save/` backends, `net/` transports, the Canvas2D render backend). Gameplay code reads abstract
  actions and interfaces, never `document`, `localStorage` or `fetch` directly, so the Android
  wrapper swaps seams instead of rewriting systems.
- The AI storyteller may never drive movement, physics, collision detection, combat calculations,
  enemy movement, damage numbers, positions, stamina, or any other real-time system. Applying
  validated output happens in exactly one module, which structurally cannot reach those systems.
- Every quest, authored or generated, compiles into the nine supported objectives (`GO_TO`,
  `TALK_TO`, `FIND`, `COLLECT`, `DELIVER`, `DEFEAT`, `PROTECT`, `EXPLORE`, `CHOOSE`). Encounters
  come from authored templates whose narrative variables the storyteller fills.
- The game must remain fully playable with the AI provider disabled or unreachable; the local
  no-API-key provider is the default and gameplay never blocks on a story call.
- WordPress plugin CSS is scoped under a single root class, and the bundle exposes at most one
  global, mounted into the shortcode's container. Multiple shortcodes on one page must not collide.
- **Built bundles go to `wordpress/living-chronicle/assets/build/`, never any `dist/` directory** —
  the repo `.gitignore` ignores bare `dist`, and a WordPress plugin must ship its built assets.
- The JS schema and its PHP mirror must stay in sync, enforced by a parity test and a
  `schema_version` field.

## Autonomous-Edit Denylist

Machine-readable glob list of paths an Execution Mode run must **never** auto-edit. A file
about to be edited that matches any glob below is treated as the
`destructive_operation_required` run boundary: the loop stops and asks for explicit per-action
human permission. This block is **protocol-adjacent and loop-immutable** — a run may never
remove or loosen an entry to get past a stop (doing so is itself the `human_review_gate`
boundary). Edit it yourself, before you arm a run. `scripts/l00prite-doctor.js` warns if this
block is missing.

```gitignore
# Secrets & credentials
.env
.env.*
**/secrets/**
**/credentials/**
**/*_key*
**/*_secret*
# AI proxy, settings, and anything that handles a provider key
wordpress/living-chronicle/includes/class-lc-rest.php
wordpress/living-chronicle/includes/class-lc-story-controller.php
wordpress/living-chronicle/includes/class-lc-settings.php
wordpress/living-chronicle/includes/class-lc-rate-limiter.php
wordpress/living-chronicle/includes/providers/**
# The storyteller contract — schema and validators are a human review gate
packages/engine/src/story/schema/**
packages/engine/src/story/validator.js
wordpress/living-chronicle/includes/class-lc-validator.php
wordpress/living-chronicle/includes/schema/**
# CI / packaging — human review before changing how this ships
.github/workflows/**
# Protocol files (never agent-edited during a loop) — both layouts:
# memory at l00prite/.l00prite/ (standard scaffold) or .l00prite/ at repo root
l00prite/.l00prite/prompts/**
l00prite/.l00prite/LOCKING.md
l00prite/AGENTS.md
.l00prite/prompts/**
.l00prite/LOCKING.md
```

### Auto-merge allowlist (default: none)

Nothing is auto-merged by default — push/merge/deploy always need per-action human permission.
If you ever allow auto-merge for trivial changes, list the exact safe paths here (e.g. docs or
comment-only edits). Behavior changes, dependency bumps, lockfile edits, and any denylisted
path are never eligible.
