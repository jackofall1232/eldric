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
* Includes an optional, nonce-protected REST endpoint (`lc/v1/story`) used only when the
  administrator switches the story provider to Site AI. With the default local storyteller it is
  never called, and the game falls back to its built-in authored storytelling if any story
  request fails.

Shortcode attributes (all optional):

* `profile` — a save-profile name, e.g. `[living_chronicle profile="family"]` (default `default`).
* `slot` — a durable name for this instance's save, useful if you reorder shortcodes on a page.
* `height` — embed height in pixels, 360 to 960 (default 720).
* `music` — soundtrack. Omit for the score bundled with the plugin, `none` for no music bed,
  or an http(s) URL to your own file. Players can adjust volume and mute in the "?" panel.

Controls: WASD or arrow keys move, Shift runs, J attacks, K heavy-attacks, L blocks, Space
dodges, E interacts, I opens the inventory, Tab opens the Chronicle, Esc closes an open
book or screen and steps back outside from a building interior.

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

After activation a top-level **Eldric** menu appears in the dashboard. **Eldric → Setup Guide**
walks through embedding the game, shortcode attributes, controls, saves, caching, and
troubleshooting. Optional settings live under **Eldric → Storyteller**. Nothing there is
required for play. You can pick the story provider:

* **Local storyteller (default)** — authored offline storytelling, no key, no network.
* **Site AI — WordPress AI Client** — on WordPress 7.0+ with a configured AI connector, the
  storyteller's dramatic beats are narrated by your site's own AI connector. Requests go through
  the plugin's server-side proxy (rate limiting, validation, size limits); if the AI is slow,
  unavailable, or returns something invalid, the game continues seamlessly with the local
  storyteller. No AI credential is ever sent to visitors' browsers.

When Site AI is selected, a second setting picks **which** connector answers — Anthropic, OpenAI,
Google, or the site default. This matters on a site with more than one connector keyed: left to
itself, WordPress uses the first provider it happens to load, which is decided by plugin order
rather than by you. Connectors that cannot currently generate text are marked "not connected",
and a connector that stops answering falls back to the site default rather than breaking play.
Keys themselves live in WordPress under Settings → Connectors; this plugin never stores them.

The key field is a write-only, server-side placeholder reserved for future direct providers; the
Site AI option does not use it.

== Frequently Asked Questions ==

= Do I need an API key or any external service? =

No. By default the game plays entirely offline in the visitor's browser using the plugin's
authored local storyteller. Optionally, on WordPress 7.0+ you can switch the story provider to
Site AI, which uses an AI connector your site already has configured under Settings → Connectors
— the plugin itself still stores no AI credential, and the game always falls back to the local
storyteller if the AI is unavailable.

= I have both OpenAI and Anthropic connectors installed. Which one does the game use? =

Whichever you pick under **Eldric → Storyteller → Which AI answers**. If you leave that on "Site
default", WordPress chooses for you — and its choice is the first configured provider it loads,
which comes down to plugin order rather than any preference of yours. Choose explicitly if it
matters. `GET /wp-json/lc/v1/health` reports the connector actually in use.

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
* `[living_chronicle]` shortcode with profile, slot, height, and music attributes.
* Local authored storyteller; nonce-protected, rate-limited `lc/v1/story` REST endpoint reserved
  for future providers.
* Top-level Eldric admin menu with an in-dashboard Setup Guide and a Storyteller settings page
  (server-side, write-only key placeholder).
