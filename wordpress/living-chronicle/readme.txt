=== Eldric: The Living Chronicle ===
Contributors: eldric-contributors
Tags: game, adventure, shortcode, canvas
Requires at least: 6.4
Requires PHP: 8.0
Stable tag: 0.1.0
License: MIT
License URI: https://opensource.org/licenses/MIT

An original top-down medieval storybook action-adventure, embedded on any page with the
[living_chronicle] shortcode.

== Description ==

Eldric: The Living Chronicle is a self-contained browser game that runs inside your WordPress
pages. Explore the village of Millhaven, investigate Blackwater Bridge, fight monsters, uncover
secrets, and write a persistent personal Chronicle of your deeds.

* Embed anywhere with the `[living_chronicle]` shortcode — posts, pages, multiple times on one page.
* Runs entirely in the visitor's browser (JavaScript + Canvas2D). No account, no API key, and no
  external service is required; the storyteller is a local, authored system bundled with the plugin.
* Progress saves automatically in the player's own browser (local storage). Each shortcode
  instance keeps its own save.
* Keyboard and touch controls; touch buttons appear automatically on mobile devices.
* Includes an optional, nonce-protected REST endpoint (`lc/v1/story`) reserved for future
  server-side storytelling. Normal play in this release never calls it, and the game falls back to
  its built-in authored storytelling if any story request fails.

Shortcode attributes (all optional):

* `profile` — a save-profile name, e.g. `[living_chronicle profile="family"]` (default `default`).
* `slot` — a durable name for this instance's save, useful if you reorder shortcodes on a page.
* `height` — embed height in pixels, 360 to 960 (default 720).

Controls: WASD or arrow keys move, Shift runs, J attacks, K heavy-attacks, L blocks, Space
dodges, E interacts, I opens the inventory, Tab opens the Chronicle, Esc opens the menu.

== Installation ==

1. In your WordPress dashboard go to **Plugins → Add New Plugin → Upload Plugin**.
2. Choose `eldric-living-chronicle-0.1.0.zip` and click **Install Now**.
3. Click **Activate Plugin**.
4. Edit any page or post and add the shortcode:
   * **Block editor (Gutenberg):** add a **Shortcode** block and type `[living_chronicle]`.
     (A plain Paragraph block containing the shortcode also works.)
   * **Classic editor:** type `[living_chronicle]` directly into the content.
5. Publish or update the page. The game appears where you placed the shortcode.

Manual install: unzip the file and upload the `living-chronicle` folder to
`wp-content/plugins/`, then activate it from the Plugins screen.

Optional settings live under **Settings → Eldric Storyteller**. Nothing there is required for
play: the provider is fixed to Local (offline), and the key field is a write-only, server-side
placeholder reserved for a future remote storyteller. It is never sent to visitors' browsers.

== Frequently Asked Questions ==

= Do I need an API key or any external service? =

No. This release plays entirely offline in the visitor's browser using the plugin's authored
local storyteller. The settings page's key field is reserved for a possible future provider and
is optional and unused today.

= Where is player progress saved? =

In each player's own browser (local storage), keyed per page, profile, and shortcode instance.
Clearing the browser's site data clears the save. Nothing is stored on your server.

= Can I put more than one game on the same page? =

Yes. Each shortcode instance is isolated with its own save. If you plan to reorder shortcodes
later, give each one a fixed `slot` attribute so its save follows it.

= Does it work with caching plugins? =

Yes for normal play — the game itself is static JavaScript and plays fine on fully cached pages.
The page markup includes a WordPress REST nonce for the optional `lc/v1/story` endpoint; on a
long-cached page that nonce can go stale, in which case a story request would be rejected and the
game silently continues with its built-in authored storytelling. Nothing breaks. If a future
release enables a remote storyteller and you want it active, exclude the game page from full-page
caching.

= The game area is blank. What should I check? =

Make sure the shortcode is exactly `[living_chronicle]`, that the plugin is active, and that
JavaScript is enabled. If you use a script-optimization plugin, exclude
`eldric-living-chronicle.js` from being removed; deferring or moving it is fine — the loader
handles both. The game requires a browser with Canvas2D (all modern browsers).

= What does uninstalling remove? =

Deleting the plugin removes its settings and its rate-limit transients from your database. It
cannot remove players' local browser saves; players can clear those via their browser's site-data
controls.

== Changelog ==

= 0.1.0 =
* First playable Millhaven vertical slice.
* `[living_chronicle]` shortcode with profile, slot, and height attributes.
* Local authored storyteller; nonce-protected, rate-limited `lc/v1/story` REST endpoint reserved
  for future providers.
* Settings page (Settings → Eldric Storyteller) with server-side, write-only key placeholder.
