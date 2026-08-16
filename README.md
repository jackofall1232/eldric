# Eldric: The Living Chronicle

> A black screen. A fire crackling. *"Gather close, and heed my tale."*
> An old storyteller begins. A book opens. The camera falls into the illustration —
> and the illustration starts moving.

A top-down medieval fantasy action-adventure that runs in the browser and embeds in WordPress
through a `[living_chronicle]` shortcode. Sword combat, villages, forests, ruins, caves, a
dungeon, weather, day and night — and an AI storyteller that watches what you actually did and
tells the story back to you.

> **Status: playable 0.1 vertical slice.** Millhaven, the Whisperwood, Blackwater Road, the
> Sunken Ruin and Gloam Cave are playable now, including combat, two bosses, a consequential
> ending, local saves, touch controls and the Chronicle. The local storyteller is the default and
> requires no account, API key or network connection.

## The idea

Most "AI games" are AI demonstrations. This one is a game first. Movement, combat, collision and
enemy behaviour are ordinary deterministic code, and the whole thing is designed to be genuinely
fun with the AI switched off entirely.

What the storyteller does instead is *remember*. The game sends it compact facts about what
happened — you spared the bandit leader, you stole medicine from the apothecary, you promised
Elara you'd find her brother — and it returns dialogue, rumors, consequences, quests and entries
in your Chronicle. Spare someone and word spreads. Steal from a village and people stop trusting
you. Help enough travellers and stories about a mysterious wandering knight start turning up in
taverns, gradually less accurate than what really happened.

Reputation isn't a good/evil slider; it's seven traits — Honor, Mercy, Greed, Courage, Loyalty,
Infamy, Mystery — that different people read differently. Mercy earns respect in a village and
looks like weakness to a warlord.

The first region is the village of Millhaven, and something attacking travellers near Blackwater
Bridge. The villagers think it's a monster. The evidence is more complicated than that. There's
one decision in it where neither choice is obviously right.

## Repo layout

```
packages/engine/          vendor-neutral game core — loop, render, input, audio, save, net, story
packages/game/            Eldric itself: systems, scenes, entities, Millhaven content
packages/platform-android/ placeholder for the Android platform object
wordpress/living-chronicle/ the installable WordPress plugin (shortcode + server-side AI proxy)
assets/                   original art and audio
docs/                     game design and architecture documentation
tests/                    unit, integration and contract tests
l00prite/                 the project blueprint and durable agent memory (see below)
scripts/                  l00prite-doctor.js, the read-only project health check
```

Vanilla JavaScript ES modules, Canvas2D, Vite. No game framework.

## Run and test it

Node.js 20.19+ (or 22.12+) is required for the Vite toolchain.

```bash
npm install
npm run dev        # standalone game at http://localhost:4173
npm run build      # production browser build -> build/web/
npm run build:wp   # plugin bundle -> wordpress/living-chronicle/assets/build/
npm test           # deterministic unit, integration, security and playthrough tests
npm run doctor     # project health check
```

For WordPress, upload the release zip or copy `wordpress/living-chronicle/` into
`wp-content/plugins/`, activate **Eldric: The Living Chronicle**, and put `[living_chronicle]` on
a page. See [INSTALL.md](wordpress/living-chronicle/INSTALL.md).

Keyboard controls: WASD/arrows move, Shift runs, J attacks, K performs a heavy attack, L blocks,
Space dodges, E interacts, I opens inventory, and Tab opens the Chronicle. Touch controls appear
automatically on mobile/coarse-pointer devices.

## The AI storyteller

- **It never touches real-time systems.** Movement, physics, collision, combat math, enemy
  behaviour and damage are game code. The AI writes words, not mechanics.
- **It can't return code.** Output is structured JSON — `narration`, `npc_dialogue`,
  `quest_changes`, `world_changes`, `rumors`, `chronicle_entry`, `memory_updates` — validated
  field by field, twice (server-side and client-side), with unknown fields and unsupported
  actions dropped rather than clamped.
- **Generated quests compile down to nine objectives** (`GO_TO`, `TALK_TO`, `FIND`, `COLLECT`,
  `DELIVER`, `DEFEAT`, `PROTECT`, `EXPLORE`, `CHOOSE`), and generated encounters fill variables in
  authored templates. The AI can describe anything; it can't invent a mechanic.
- **The default provider needs no API key and no network.** A local template-driven provider ships
  with the game, and it keeps everything playable.
- **No API key ever reaches the browser.** WordPress proxies AI calls server-side with rate
  limiting, validation, timeouts and size caps. If the AI fails, gameplay continues on authored
  content.

## How this repo is built

This project uses the [l00prite](https://github.com/jackofall1232/l00prite) protocol: durable,
file-based project memory so that AI agents — Claude, Codex, Gemini, Cursor, Copilot, and the rest
— can hand work off to each other across sessions without losing context.

- **[`l00prite/CLAUDE.md`](l00prite/CLAUDE.md)** — the blueprint: mission, architecture,
  requirements, definition of done.
- **[`l00prite/AGENTS.md`](l00prite/AGENTS.md)** — the operating rules for any agent working here.
- **`l00prite/.l00prite/`** — the memory: ledger, todos, constraints, failures, state.

The files at the repo root (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `QWEN.md`, `CONVENTIONS.md`,
`.github/copilot-instructions.md`, `.cursor/`, `.windsurf/`, `.grok/`) are thin pointers that route
each tool into `l00prite/`. Run `npm run doctor` to check the protocol state.

Execution Mode ships disarmed. An autonomous run requires the pre-flight display in
`l00prite/.l00prite/prompts/execute-loop.md` plus explicit human confirmation, every time.

## License

MIT — see [LICENSE](LICENSE).
