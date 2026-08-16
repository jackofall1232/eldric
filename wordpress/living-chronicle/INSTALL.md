# Installing Eldric: The Living Chronicle

Requirements: WordPress 6.4+, PHP 8.0+, and a browser with JavaScript and Canvas2D.

1. Use the prebuilt `eldric-living-chronicle-0.1.0.zip`, or run `npm install && npm run build:wp`
   at the repository root to rebuild the browser assets.
2. Upload the zip from **Plugins → Add New → Upload Plugin**. For a source checkout, copy
   `wordpress/living-chronicle/` into `wp-content/plugins/living-chronicle/` instead.
3. Activate **Eldric: The Living Chronicle**.
4. Add `[living_chronicle]` to a post or page.

Optional attributes: `[living_chronicle profile="family" slot="main" height="720"]`. Multiple
shortcodes on one page are isolated. Give each a durable `slot` when you want its local save to
survive reordering the shortcodes later. The current release uses the local authored storyteller
and needs no API key or network request.

The game saves locally in the player’s browser. Clearing site storage clears that save. The
storage adapter is deliberately separate from gameplay so account/cloud saves can replace it in a
later release.

## WordPress caching and security

The optional `lc/v1/story` REST route accepts only schema-versioned narrative context, requires a
valid `X-WP-Nonce`, rate-limits the current WordPress user or direct client IP, validates request
and response sizes, and falls back to authored storytelling. It never receives movement or combat
authority. The 0.1 browser build uses the local provider by default, so this route is not needed
for normal play.

If a future remote provider is enabled, exclude the page containing `[living_chronicle]` from
full-page caching so its REST nonce is not served stale. Never place a provider key in shortcode
attributes, page source, JavaScript, `wp_localize_script`, or a public cache. The settings field is
write-only and server-side; the stored key is reserved for a later provider implementation.

Optimization plugins may move or defer the game script; the loader works both before and after
`DOMContentLoaded`. For a shortcode inserted later through AJAX, call
`window.EldricLivingChronicle.mountAll(container)` after inserting its markup.

Uninstall removes plugin settings and rate-limit transients. It cannot remove local browser saves;
players can remove those through their browser’s site-data controls.

Keyboard: WASD/arrow keys move, Shift runs, J attacks, K heavy-attacks, L blocks, Space dodges,
E interacts, I opens inventory, and Tab opens the Chronicle. Touch controls appear automatically
on coarse-pointer/mobile devices.
