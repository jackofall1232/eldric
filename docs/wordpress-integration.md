# WordPress integration

WordPress is a host and optional narrative backend, not a game-engine dependency. The plugin root
is `wordpress/living-chronicle/`; `npm run build:wp` emits its IIFE and scoped CSS directly into
`assets/build/`.

`[living_chronicle profile="default" slot="main" height="720"]` renders one isolated mount. The
page id, profile and durable slot form the browser-save key. If `slot` is omitted, render order is
used; set it whenever multiple embeds may be reordered. Assets enqueue only when the shortcode
renders. Every stylesheet selector is scoped under `.living-chronicle`, and JavaScript exposes
only `window.EldricLivingChronicle.{mount,mountAll,unmount}`.

The loader is safe whether optimization plugins execute it before or after `DOMContentLoaded`.
AJAX-inserted markup must call `mountAll(container)` explicitly.

## Story REST boundary

`POST /wp-json/lc/v1/story` requires a `wp_rest` nonce in `X-WP-Nonce`. PHP validates the compact
context, enforces size limits and a direct-IP/current-user rate bucket, calls a server provider,
validates the exact response contract, and returns authored fallback JSON on provider failure.
No browser bundle contains a production API key. The 0.1 client deliberately uses the local
provider; the endpoint and write-only future key are present for a later remote-provider release.

Full-page caching must be bypassed for game pages before a remote provider is enabled, otherwise
a cached nonce can expire. Health responses use `no-store`. Uninstall removes settings and rate
transients but cannot erase browser local storage.
