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
No browser bundle contains a production API key. The client uses the local provider unless the
administrator selects Site AI, in which case `class-lc-shortcode.php` emits `storyProvider:
'remote'` and the game calls this route.

## Choosing the AI connector

Site AI goes through core's `wp_ai_client_prompt()` (WordPress 7.0+). Left unconstrained, core's
`ModelResolver` resolves the first configured provider in registration order, so on a site with
several connectors the winner is decided by plugin load order. `LC_Provider_WP_AI` therefore
passes the administrator's choice through `using_provider()`, and `LC_Settings::active_ai_provider()`
downgrades to the site default when that connector stops answering.

Connector credentials belong to core (Settings → Connectors, options `connectors_ai_*_api_key`,
overridable by `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY` env vars or constants).
This plugin reads none of them. Availability is discovered by probing
`using_provider( $id )->is_supported_for_text_generation()`, cached in the `lc_wp_ai_probe`
transient for five minutes and never gathered during a front-end request, so a page render never
waits on connector metadata.

A front-end request with a cold cache therefore assumes the client can serve. That assumption is
self-correcting: when a generation attempt against the *site default* reports no usable model, the
provider writes the negative result to the same transient, so the site stops routing story beats
at a connector that cannot answer even if no administrator ever opens a plugin screen. A named
connector failing is not recorded — it says nothing about the connectors beside it. The TTL means
a repaired connector recovers on its own after one attempt.

Full-page caching must be bypassed for game pages before a remote provider is enabled, otherwise
a cached nonce can expire. Health responses use `no-store`. Uninstall removes settings and rate
transients but cannot erase browser local storage.
