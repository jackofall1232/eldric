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

Optional attributes: `[living_chronicle profile="family" slot="main" height="720"]`.

- `profile` — save-profile name (default `default`).
- `slot` — durable name for this instance's save. Multiple shortcodes on one page are isolated;
  give each a fixed `slot` when you want its local save to survive reordering the shortcodes later.
- `height` — embed height in pixels, clamped to 360–960 (default 720).

The current release uses the local authored storyteller and needs no API key or network request.

## Settings (optional)

**Settings → Eldric Storyteller** shows the active provider — Local (offline) — and a write-only
key field reserved for a future server-side provider. Nothing on this page is required for play.
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
E interacts, I opens inventory, Tab opens the Chronicle, and Esc opens the menu. Touch controls
appear automatically on coarse-pointer/mobile devices.
