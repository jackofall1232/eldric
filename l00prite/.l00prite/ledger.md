# Run Ledger

Append one entry per agent run. Do not overwrite prior runs.

## Entry Template

### Run YYYY-MM-DDTHH:MM:SSZ — <agent name>
- **Goal:** What this run attempted.
- **Triggering event:** Event id/type/source, or `none` for normal roadmap work.
- **Reviewer/comment reference:** PR, issue, CI run, reviewer, URL, file/line, or `none`.
- **Decision:** Valid, already fixed, unclear, unsafe, blocked, deferred, stale-lock-recovery, or normal work; include why.
- **Completed work:** What changed or was learned.
- **Fix implemented:** The smallest fix made for the event, or `none` with reason.
- **Changed files:** Files created, modified, deleted, or intentionally left untouched.
- **Tests run / Verification:** One entry per check run, each with `command`, `exit_code`,
  `summary`, `evidence_path` (optional), and `timestamp`. Do not write vague statements like
  "tests passed" without at least `command`, `exit_code`, and `summary`.
- **Response drafted/sent:** Reviewer, issue, or human response status and summary.
- **Event status:** Pending, processing, completed, blocked, deferred, or not applicable.
- **Failures:** Errors, blockers, failed approaches, or skipped checks.
- **Decisions:** Durable decisions made during the run.
- **Confidence:** Low/medium/high plus a short reason.
- **Next action:** The next smallest useful step.
- **Do-not-retry notes:** Failed approaches that should not be repeated unless conditions change.
- **Lock:** `lock_id` acquired/released this run, or `none` if no protected-path write occurred. Note stale-lock reclamation here if applicable.

---

### Run 2026-08-16T01:58:07Z — Codex (Execution Mode, iteration 1)
- **Goal:** Make Eldric boot as a real standalone and WordPress-targeted canvas application.
- **Triggering event:** none — confirmed roadmap execution.
- **Reviewer/comment reference:** user confirmed `EXECUTE`; canonical title corrected to
  "Eldric: The Living Chronicle."
- **Decision:** Normal work; completed the first M1 build-and-canvas unit before deeper systems.
- **Completed work:** Added real Vite standalone and IIFE WordPress builds, responsive scoped
  canvas mounting/unmounting, validated boot configuration, initial storybook boot plate, and a
  non-stub smoke test. Installed the already-declared Vite dependency and corrected Node 24 test
  discovery.
- **Fix implemented:** Build output now targets `build/web/` and
  `wordpress/living-chronicle/assets/build/`; the WordPress bundle exposes the single
  `EldricLivingChronicle` namespace.
- **Changed files:** `.gitignore`, `package.json`, `package-lock.json`, `vite.config.js`,
  `vite.config.wp.js`, `index.html`, `packages/game/src/{main.js,embed.js,boot/bootstrap.js,boot/config.js,ui/game.css}`,
  `tests/integration/smoke-boot.test.js`, generated WordPress build assets, and l00prite memory.
- **Tests run / Verification:**
  - `npm run build`, exit_code `0`, standalone production build completed, 2026-08-16T01:57:35Z.
  - `npm run build:wp`, exit_code `0`, IIFE JS and scoped CSS emitted under plugin `assets/build/`,
    2026-08-16T01:57:35Z.
  - `npm test`, exit_code `0`, 25 test files passed including the real smoke boot assertions,
    2026-08-16T01:57:35Z.
  - `npm run doctor`, exit_code `0`, 24 checks OK and HEALTHY, 2026-08-16T01:55:38Z.
- **Response drafted/sent:** Progress update sent; no external publish action taken.
- **Event status:** not applicable.
- **Failures:** Sandboxed dependency fetch failed with `EAI_AGAIN`; approved network retry
  succeeded. Initial test command used incompatible directory arguments; corrected and rerun.
- **Decisions:** Fixed logical canvas is 384×216; WordPress output is an IIFE with one public
  namespace; all player-facing branding uses "Eldric: The Living Chronicle."
- **Confidence:** High — both build targets and the full discovered test set pass.
- **Next action:** Commit this unit, then implement the deterministic fixed-step loop.
- **Do-not-retry notes:** Do not restore directory arguments to `node --test`; do not emit plugin
  bundles to `dist/`.
- **Lock:** `codex-eldric-20260816T015338Z` active for the confirmed execute-loop run.

### Run 2026-08-16T02:00:28Z — Codex (Execution Mode, iteration 2)
- **Goal:** Establish deterministic engine time primitives before gameplay is attached.
- **Triggering event:** none — confirmed roadmap execution.
- **Decision:** Normal work; treated loop, game time, event bus, and seeded RNG as one cohesive
  deterministic-core unit.
- **Completed work:** Implemented a 60 Hz fixed-step loop with interpolation, catch-up cap,
  pause/resume and injected scheduler; added scaled game time, framework-neutral event bus, and
  snapshot-capable seeded xorshift RNG.
- **Fix implemented:** Replaced core stubs and their loop/RNG test stubs with real deterministic
  behavior and assertions.
- **Changed files:** `packages/engine/src/core/{loop,time,events,rng}.js`, engine public barrel,
  fake clock helper, loop/RNG unit tests, and l00prite memory.
- **Tests run / Verification:** `node --test tests/unit/engine/loop.test.js tests/unit/engine/rng.test.js`,
  exit_code `0`, 5 assertions/tests passed; `npm run build`, exit_code `0`; `npm run build:wp`,
  exit_code `0`; all at 2026-08-16T02:00:12Z.
- **Response drafted/sent:** Progress update sent; no external publish action taken.
- **Event status:** not applicable.
- **Failures:** none.
- **Decisions:** Scheduler is injected so the engine remains platform-neutral; simulation caps at
  eight catch-up steps; gameplay randomness must use serializable seeded state.
- **Confidence:** High — deterministic behavior and pause/catch-up edge cases are directly tested.
- **Next action:** Commit the unit, then build entity and scene lifecycle.
- **Do-not-retry notes:** Do not introduce `Math.random` or browser scheduling into gameplay code.
- **Lock:** `codex-eldric-20260816T015338Z` active.

### Run 2026-08-16T02:03:10Z — Codex (Execution Mode, iteration 3)
- **Goal:** Add deterministic entity, state-machine, scene-stack, and engine lifecycle primitives.
- **Decision:** Normal work; one cohesive lifecycle unit.
- **Completed work:** Implemented component entities, reusable state machines, layered scene stack,
  and an async-safe engine lifecycle around the fixed loop.
- **Changed files:** engine core/scene/lifecycle modules, public exports, purity tests, memory.
- **Tests run / Verification:** `node --test tests/unit/engine/engine-purity.test.js tests/unit/engine/loop.test.js tests/unit/engine/rng.test.js`, exit_code `0`; `npm run build`, exit_code `0`; 2026-08-16T02:02:58Z.
- **Failures:** none.
- **Decisions:** Modal scenes pause the scene beneath but can render transparently; systems and
  platform services are disposed in reverse lifecycle order.
- **Confidence:** High — stack semantics, state transitions, and purity boundary are exercised.
- **Next action:** Commit, then implement Canvas2D renderer/camera.
- **Do-not-retry notes:** Keep DOM APIs in declared seams only.
- **Lock:** `codex-eldric-20260816T015338Z` active.

### Run 2026-08-16T02:06:02Z — Codex (Execution Mode, iteration 4)
- **Goal:** Establish a layered Canvas2D renderer and soft camera without leaking canvas context
  access into gameplay.
- **Decision:** Normal work; renderer, camera, sprites, and draw layers are one rendering unit.
- **Completed work:** Added sorted draw-command renderer, Canvas2D backend, camera follow/bounds/
  shake/transforms, render layers, sprite animation helpers, and public exports.
- **Changed files:** `packages/engine/src/render/{renderer,canvas2d-backend,camera,layer,sprite,spritesheet}.js`,
  public barrel, memory.
- **Tests run / Verification:** engine purity test, standalone build, and WordPress build all exited
  `0` at 2026-08-16T02:05:43Z.
- **Failures:** none.
- **Decisions:** Context access stays in `canvas2d-backend.js`; gameplay submits typed draw commands.
- **Confidence:** High — both bundle targets compile and purity enforcement passes.
- **Next action:** Commit, then add abstract keyboard/touch/gamepad input.
- **Do-not-retry notes:** Do not draw directly from game scenes via a 2D context.
- **Lock:** `codex-eldric-20260816T015338Z` active.

### Run 2026-08-16T02:09:20Z — Codex (Execution Mode, iteration 5)
- **Goal:** Add platform-neutral action input and the browser platform adapter.
- **Decision:** Normal work; input sources and platform composition form one seam unit.
- **Completed work:** Implemented action constants/bindings, edge-aware normalized input manager,
  keyboard/pointer/touch/gamepad sources, browser scheduler, capability budgets, and platform root.
- **Tests run / Verification:** input and purity tests plus standalone build exited `0` at
  2026-08-16T02:09:02Z.
- **Failures:** none.
- **Decisions:** Touch UI writes into `TouchSource`; Android/gamepads attach through identical
  action state; gameplay never reads key codes.
- **Confidence:** High — normalized diagonal movement and pressed/released edges are tested.
- **Next action:** Commit, then make the Millhaven world immediately playable.
- **Do-not-retry notes:** Do not route touch buttons directly into player code.
- **Lock:** `codex-eldric-20260816T015338Z` active.

### Run 2026-08-16T02:12:44Z — Codex (Execution Mode, iteration 6)
- **Goal:** Replace the boot plate with a substantial offline-playable Millhaven action-adventure.
- **Decision:** Normal work; the authored world runtime is the smallest player-visible vertical
  slice unit connecting the completed engine seams.
- **Completed work:** Added the skippable narrated opening; dense Millhaven/forest/road/river/
  bridge/ruin/cave world; collision, NPCs, clues, secret, campfire, quest progression, combat,
  enemy telegraphs, mini-boss, gated boss, ambiguous ending, rumors, and Chronicle pages. Added an
  original generated illuminated-book opening plate plus manifest/license provenance.
- **Changed files:** game runtime/world content/bootstrap/config, asset manifest/licenses/opening
  art, Vite public-asset handling, region/content tests, generated WordPress assets, memory.
- **Tests run / Verification:** standalone and WordPress builds exited `0`; full `npm test` passed
  25 files; focused real content tests passed 2 files; secret grep found no client key pattern;
  2026-08-16T02:12:44Z.
- **Failures:** Dev server initially needed port approval and then started; visual automation was
  unavailable because `agent-browser` is not installed. This remains unverified, not claimed.
- **Decisions:** Opening asset was generated with the built-in image tool from the original
  Millhaven prompt and saved at `assets/opening/millhaven-book-source.png`; deterministic code
  constructs all combat and world state.
- **Confidence:** Medium-high — build/data/runtime integration is strong, but browser visual
  automation is still outstanding.
- **Next action:** Commit, then add mobile touch controls and persistence.
- **Do-not-retry notes:** Do not inline the 2.8 MB opening image into the IIFE; library-mode asset
  imports do that, so it is shipped via the public asset base.
- **Lock:** `codex-eldric-20260816T015338Z` active.

### Run 2026-08-16T02:17:22Z — Codex (Execution Mode, iteration 7)
- **Goal:** Make the playable slice mobile-controllable and persistent without coupling gameplay
  to browser storage or touch events.
- **Decision:** Normal work; touch and storage are platform seams supporting the same playable flow.
- **Completed work:** Added virtual stick/action buttons with pointer cancellation, inventory view,
  versioned storage adapter, localStorage-to-memory fallback, legacy migration, and persistence of
  position, quest, discoveries, Chronicle, rumors, outcome, and inventory.
- **Tests run / Verification:** focused input/save tests, both builds, and full 25-file test run all
  exited `0` at 2026-08-16T02:17:08Z.
- **Failures:** none.
- **Decisions:** Quota/private-mode failures degrade to memory; mobile UI writes only to
  `TouchSource`; autosave occurs on discoveries, campfire, decisions, opening completion, teardown.
- **Confidence:** High for seams and compilation; physical-device feel remains a later playtest.
- **Next action:** Commit, then make the shortcode host installable.
- **Do-not-retry notes:** Do not access localStorage from game runtime directly.
- **Lock:** `codex-eldric-20260816T015338Z` active.

### Run 2026-08-16T00:00:00Z — Claude Code (Planning Mode scaffold)
- **Goal:** Turn the `eldric` repo — which was created by copying the entire l00prite protocol
  source repo — into a properly scaffolded l00prite target for the game "Vibe Code: The Living
  Chronicle": blueprint, memory, todos, READMEs, and directory scaffolding. Explicitly **not**
  building the game.
- **Triggering event:** none — human request, initial project setup.
- **Reviewer/comment reference:** none.
- **Decision:** Normal Planning Mode work. The repo was in l00prite's *source* layout (memory at
  root, self-sufficient root context files, `cli-os/`, `templates/`, `examples/`) rather than the
  *target* layout. Converted to the target layout and trimmed the protocol source, with the human
  choosing the trim scope, the module layout, and the stack up front.
- **Completed work:**
  - Scaffolded `l00prite/` from `templates/l00prite/`: filled `CLAUDE.md` (mission, architecture,
    24 requirements, definition of done, operating loop, heartbeat rules, empty run ledger,
    completion criteria), generated `AGENTS.md`, filled `blueprint.md`, `constraints.md`,
    `state.json`, `todos.md`; copied everything else verbatim including `prompts/`.
  - Wrote the M1–M8 milestone backlog in `todos.md`, ordered so each milestone leaves the game
    playable.
  - Created the game scaffolding as stubs only: `packages/engine/` (with the Android platform
    seams made explicit), `packages/game/`, `packages/platform-android/`,
    `wordpress/living-chronicle/`, `assets/`, `docs/` (18 docs + 5 ADRs), `tests/`.
  - Replaced the five root context files with the thin target-layout pointers; left the four
    self-sufficient dot-folder adapters untouched (already byte-identical to the templates).
  - Rewrote the empty root `README.md` as the project front door, stating plainly that the game is
    not playable yet.
  - Trimmed `cli-os/`, `templates/`, `examples/`, `scripts/validate-l00prite.js`, `.claude/`,
    `.codex/`, root `.l00prite/`, `HANDOFF.md`, `RELEASE.md`, `GETTING_STARTED.md`.
  - Moved l00prite's loop-wisdom docs to `l00prite/docs/` and fixed their stale path references.
- **Fix implemented:** Two real defects found and fixed rather than inherited:
  1. `.gitignore` line 83 has a bare `dist` rule; confirmed with `git check-ignore` that it
     silently swallows any `dist/` build output. A WordPress plugin must ship its built assets, so
     the bundle path is `wordpress/living-chronicle/assets/build/`, and the tracked/ignored status
     of both paths was re-verified.
  2. The root `package.json` sets `"type": "module"`, which made node refuse to run the CommonJS
     `scripts/l00prite-doctor.js`. Added `scripts/package.json` with `"type": "commonjs"` rather
     than modifying the doctor or the documented command.
- **Changed files:** Created `l00prite/**`, `packages/**`, `wordpress/**`, `docs/**`, `tests/**`,
  `assets/**`, `package.json`, `vite.config.js`, `vite.config.wp.js`, `index.html`,
  `scripts/package.json`, `.github/workflows/{ci,integration}.yml`. Rewrote `README.md` and the
  five root pointer files; appended to `.gitignore`. Deleted the l00prite protocol source listed
  above. Left untouched: `LICENSE`, `.github/copilot-instructions.md`, `.cursor/rules/l00prite.mdc`,
  `.windsurf/rules/l00prite.md`, `.grok/GROK.md`, and all files under `l00prite/.l00prite/prompts/`.
- **Tests run / Verification:**
  - `command: node scripts/l00prite-doctor.js .` · `exit_code: 0` · `summary: 24 ok, 0 warn,
    0 fail — HEALTHY; resolved l00prite/.l00prite/, confirming target layout` ·
    `timestamp: 2026-08-16T00:00:00Z`
  - `command: diff <protocol section of templates/CLAUDE.md.template> <same section of
    l00prite/CLAUDE.md>` · `exit_code: 0` · `summary: fixed protocol section byte-identical` ·
    `timestamp: 2026-08-16T00:00:00Z`
  - `command: cmp l00prite/README.md templates/l00prite/README.md` and `cmp` of each of the four
    dot-folder adapters against `templates/adapters/` · `exit_code: 0` · `summary: all five
    byte-identical` · `timestamp: 2026-08-16T00:00:00Z`
  - `command: grep -rn '{{' l00prite/CLAUDE.md l00prite/AGENTS.md` · `exit_code: 1` ·
    `summary: no template tokens remain` · `timestamp: 2026-08-16T00:00:00Z`
  - `command: node -e '<parse heartbeat.json, state.json, lock.json>'` · `exit_code: 0` ·
    `summary: all parse; execution.enabled=false, preflight_confirmed=false, 9 run boundaries,
    lock status unlocked` · `timestamp: 2026-08-16T00:00:00Z`
  - `command: <walk packages/ and wordpress/, parse every .json, flag files over 12 lines>` ·
    `exit_code: 0` · `summary: 189 files walked, 0 invalid JSON, 0 files exceed 12 lines — stub
    discipline holds` · `timestamp: 2026-08-16T00:00:00Z`
  - `command: git check-ignore -v wordpress/living-chronicle/assets/build/living-chronicle.js` ·
    `exit_code: 1` · `summary: plugin build output is tracked (packages/*/dist/ correctly ignored)`
    · `timestamp: 2026-08-16T00:00:00Z`
  - `command: git ls-files '*.go' | wc -l` · `exit_code: 0` · `summary: 0 — the Go gateway is
    fully removed; 325 files, ~185 KB of content remain` · `timestamp: 2026-08-16T00:00:00Z`
  - **Not run:** the game's own test suite and any build. Nothing is implemented yet, `npm install`
    was never run, and no test file contains a test. No claim is made that the game builds or runs.
- **Response drafted/sent:** Summary delivered to the human in session.
- **Event status:** not applicable.
- **Failures:** None. Two defects found and fixed (see Fix implemented).
- **Decisions:**
  - Trim l00prite's protocol source rather than vendoring it; keep only `l00prite-doctor.js`.
  - Engine core plus thin WordPress host, with platform seams declared up front so the Android
    port swaps seams instead of rewriting systems.
  - Vanilla JS ES modules, Canvas2D, Vite; no game framework.
  - Freeze the storyteller JSON schema before writing the PHP proxy, so the validator is not
    written twice; validate server-side and client-side both.
  - Build to `assets/build/`, never `dist/`.
- **Confidence:** High for the scaffold — every structural claim above was mechanically verified.
  The blueprint's requirements are a faithful transcription of the human's brief, but they have not
  been tested against an implementation, so scope and feasibility remain unproven.
- **Next action:** M1, first item — fill in the build config, install dependencies, and get
  `npm run dev` serving a blank canvas.
- **Do-not-retry notes:** Do not put build output in any `dist/` directory. Do not rename or
  convert `scripts/l00prite-doctor.js` to fix module-type errors; the `scripts/package.json`
  marker is the fix.
- **Lock:** none — no other agent was active, and `lock.json` remains `unlocked` as shipped.
