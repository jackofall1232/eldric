# Tests

`node --test` (no test framework dependency). Files are named `*.test.js`.

- `unit/engine/` — engine subsystems. `engine-purity.test.js` asserts no engine file outside the
  declared platform seams touches `window`, `document`, `localStorage` or `fetch`. Land it early,
  while it passes trivially.
- `unit/game/` — content integrity: every quest compiles to a supported objective, every referenced
  asset and string exists.
- `integration/` — boot smoke test, the storyteller contract, JS/PHP schema parity, and an
  offline playthrough proving the game works with the AI provider disabled.
- `fixtures/story/` — the corpus of valid, malformed, oversized and injection-bearing storyteller
  responses. Malicious fixtures attempting to set health, damage, position or stamina must be
  **dropped, not clamped**.

All stubs today.
