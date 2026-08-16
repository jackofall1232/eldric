# Installing Eldric: The Living Chronicle

Requirements: WordPress 6.4+, PHP 8.0+, and a browser with JavaScript and Canvas2D.

## Install from the zip (recommended)

1. Get `eldric-living-chronicle-0.1.0.zip` (or build it yourself: run
   `npm install && ./scripts/build-wp-zip.sh` at the repository root; the zip lands in `build/`).
2. In the WordPress dashboard, go to **Plugins → Add New Plugin → Upload Plugin**, choose the
   zip, and click **Install Now**.
3. Click **Activate Plugin** (the plugin is named **Eldric: The Living Chronicle**).

For a source checkout instead of a zip, run `npm install && npm run build:wp` at the repository
root, then copy `wordpress/living-chronicle/` into `wp-content/plugins/living-chronicle/`.

## Add the game to a page

- **Block editor (Gutenberg):** edit any page or post, add a **Shortcode** block, and type
  `[living_chronicle]`. A plain Paragraph block containing the shortcode also works.
- **Classic editor:** type `[living_chronicle]` directly into the content.

Publish or update the page; the game renders where the shortcode sits.

Optional attributes: `[living_chronicle profile="family" slot="main" height="720" music="none"]`.

- `profile` — save-profile name (default `default`).
- `slot` — durable name for this instance's save. Multiple shortcodes on one page are isolated;
  give each a fixed `slot` when you want its local save to survive reordering the shortcodes later.
- `height` — embed height in pixels, clamped to 360–960 (default 720).
- `music` — the soundtrack. Leave it off to use the score bundled with the plugin; set
  `music="none"` for no music bed (the game's own synthesised region themes play instead); or
  give an `http(s)` URL to a file you host yourself. Players can set volume or mute in the
  game's **?** panel regardless, and those levels are remembered in their browser.

The current release uses the local authored storyteller and needs no API key or network request.

## The Eldric admin menu

Activation adds a top-level **Eldric** menu to the dashboard for administrators
(`manage_options`):

- **Eldric → Setup Guide** — in-dashboard instructions covering everything on this page:
  embedding the shortcode, its attributes, choosing the storyteller, controls, saves, caching
  and troubleshooting, plus a live status line showing the plugin version and which
  storyteller is currently serving.
- **Eldric → Storyteller** — the settings screen below.

## Settings (optional)

**Eldric → Storyteller** lets you pick the story provider. Nothing on this page is
required for play:

- **Local storyteller (default)** — authored offline storytelling; no key, no network.
- **Site AI — WordPress AI Client** — available on WordPress 7.0+ when the site has an AI
  connector configured for the built-in AI Client. Story beats are then narrated by your site's
  AI through the plugin's server-side proxy (nonce check, rate limiting, request/response
  validation, size limits). Any failure falls back to the local storyteller mid-play, invisibly.
  If the AI Client is missing, the option is disabled and the local storyteller serves.

### Which AI answers

With Site AI selected, a second dropdown picks the connector: **Anthropic (Claude)**, **OpenAI**,
**Google (Gemini)**, or **Site default**. Choose explicitly if you have more than one connector
keyed — on "Site default" WordPress uses the first provider it loads, and that order comes from
plugin load order, not from any preference you have expressed.

Connectors that cannot currently generate text are labelled "not connected". If the connector you
picked stops answering, the storyteller quietly uses the site default instead of failing. Keys are
entered in WordPress itself under **Settings → Connectors** — this plugin never stores or reads
them. `GET /wp-json/lc/v1/health` reports both the active story provider and the connector in use.

If **Eldric → Setup Guide** shows Site AI as "No connector", the AI Client is present but nothing
on the site can generate text yet; add a key under Settings → Connectors. WordPress validates a
key when you save it and silently blanks the field if it is rejected, so a field that comes back
empty means the key was refused.

The write-only key field is reserved for a future direct provider; Site AI does not use it.
A stored key stays server-side and is never sent to the browser.

## Saves

The game saves locally in the player's browser, keyed per page, profile, and slot. Clearing site
storage clears that save. The storage adapter is deliberately separate from gameplay so
account/cloud saves can replace it in a later release.

## WordPress caching and security

The optional `lc/v1/story` REST route accepts only schema-versioned narrative context, requires a
valid `X-WP-Nonce`, rate-limits the current WordPress user or direct client IP, validates request
and response sizes, and falls back to authored storytelling. It never receives movement or combat
authority. The 0.1 browser build uses the local provider by default, so this route is not needed
for normal play. There is also a public `lc/v1/health` route that reports readiness.

Full-page caching is safe for normal play. The page markup embeds a REST nonce; on a long-cached
page that nonce can go stale, and a story request would then be rejected with a 403 — the game
degrades silently to its built-in authored storytelling rather than breaking. If a future remote
provider is enabled and you want it active, exclude the page containing `[living_chronicle]` from
full-page caching so its nonce is not served stale. Never place a provider key in shortcode
attributes, page source, JavaScript, `wp_localize_script`, or a public cache. The settings field is
write-only and server-side; the stored key is reserved for a later provider implementation.

## Troubleshooting

- **Blank space where the game should be:** confirm the plugin is active and the shortcode is
  exactly `[living_chronicle]`. Check the browser console for a blocked or missing
  `eldric-living-chronicle.js`.
- **Script-optimization plugins:** deferring or moving the game script is fine — the loader works
  both before and after `DOMContentLoaded`. Do not let an optimizer strip or combine-away the
  `lc-eldric-game` handle.
- **Shortcode markup inserted via AJAX:** call
  `window.EldricLivingChronicle.mountAll(container)` after inserting it.
- **Rate-limit message ("The storyteller is resting"):** the optional story route allows 10
  requests per minute per user/IP; it does not affect normal (local) play.

## Uninstall

Uninstalling removes plugin settings and rate-limit transients. It cannot remove local browser
saves; players can remove those through their browser's site-data controls.

## Controls

Keyboard: WASD/arrow keys move, Shift runs, J attacks, K heavy-attacks, L blocks, Space dodges,
E interacts, I opens inventory, Tab opens the Chronicle, and Esc closes an open screen or
leaves a building interior. Touch controls
appear automatically on coarse-pointer/mobile devices.
