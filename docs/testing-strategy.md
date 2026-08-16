# Testing strategy

Run `npm test` for recursive Node tests, `npm run build` and `npm run build:wp` for both production
targets, and PHP lint over `wordpress/living-chronicle/**/*.php`.

Unit tests cover deterministic loop/RNG/input/combat, every quest objective, inventory, saves,
reputation, NPC memory, rumors, Chronicle, time/weather, audio fallback, story validation and
platform purity. Contract fixtures include malformed, oversized, markup-bearing and real-time
authority attempts. PHP/JS parity prevents the two validators drifting.

Integration tests boot the game without a DOM framework, inspect the installable WordPress host,
and complete the Blackwater quest offline through combat, story consequence and save reload.
Browser/device feel and screenshot quality remain manual release gates when no headless browser is
available in the execution environment.
