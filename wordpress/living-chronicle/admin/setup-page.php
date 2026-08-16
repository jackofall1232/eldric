<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
/**
 * Setup Guide screen. Provided by LC_Admin::render_setup():
 *
 * @var string $chosen_provider    Provider the administrator selected.
 * @var string $active_provider    Provider actually serving right now.
 * @var bool   $wp_ai_available    Whether the WordPress AI Client exists here.
 * @var bool   $wp_ai_configured   Whether any AI connector can actually serve.
 * @var string $active_ai_provider Connector actually answering; empty means site default.
 * @var string $settings_url       URL of the Storyteller settings screen.
 */
?>
<div class="wrap lc-admin">
    <header class="lc-hero">
        <p class="lc-hero-kicker"><?php esc_html_e( 'Eldric', 'living-chronicle' ); ?></p>
        <h1><?php esc_html_e( 'The Living Chronicle', 'living-chronicle' ); ?></h1>
        <p class="lc-hero-lede"><?php esc_html_e( 'A storybook action-adventure that lives inside your pages. Three short steps and the tale begins.', 'living-chronicle' ); ?></p>
        <ul class="lc-status" role="list">
            <li class="lc-chip"><span class="lc-chip-label"><?php esc_html_e( 'Version', 'living-chronicle' ); ?></span> <?php echo esc_html( LC_VERSION ); ?></li>
            <li class="lc-chip"><span class="lc-chip-label"><?php esc_html_e( 'Storyteller', 'living-chronicle' ); ?></span>
                <?php echo 'wp-ai' === $active_provider ? esc_html__( 'Site AI', 'living-chronicle' ) : esc_html__( 'Local (offline)', 'living-chronicle' ); ?></li>
            <li class="lc-chip"><span class="lc-chip-label"><?php esc_html_e( 'Site AI', 'living-chronicle' ); ?></span>
                <?php if ( ! $wp_ai_available ) : ?>
                    <?php esc_html_e( 'Not available', 'living-chronicle' ); ?>
                <?php elseif ( ! $wp_ai_configured ) : ?>
                    <?php esc_html_e( 'No connector', 'living-chronicle' ); ?>
                <?php else : ?>
                    <?php echo esc_html( LC_Provider_WP_AI::provider_label( $active_ai_provider ) ); ?>
                <?php endif; ?></li>
        </ul>
        <?php if ( 'wp-ai' === $chosen_provider && ! $wp_ai_available ) : ?>
            <p class="lc-notice-soft"><?php esc_html_e( 'Site AI is selected but unavailable right now, so the local storyteller is telling the tale instead. Nothing is broken — the game always keeps playing.', 'living-chronicle' ); ?></p>
        <?php elseif ( 'wp-ai' === $chosen_provider && ! $wp_ai_configured ) : ?>
            <p class="lc-notice-soft"><?php esc_html_e( 'Site AI is selected, but no AI connector on this site can generate text yet, so the local storyteller is telling the tale. Add a connector key under Settings → Connectors.', 'living-chronicle' ); ?></p>
        <?php endif; ?>
    </header>
    <hr class="wp-header-end">

    <section class="lc-steps" aria-label="<?php esc_attr_e( 'Setup steps', 'living-chronicle' ); ?>">
        <article class="lc-card lc-step">
            <span class="lc-step-num" aria-hidden="true">1</span>
            <h2><?php esc_html_e( 'Place the game on a page', 'living-chronicle' ); ?></h2>
            <p><?php esc_html_e( 'Edit any page or post and add the shortcode where the game should appear:', 'living-chronicle' ); ?></p>
            <p class="lc-shortcode"><code>[living_chronicle]</code></p>
            <ul>
                <li><?php esc_html_e( 'Block editor: add a Shortcode block (a plain Paragraph block also works) and type the shortcode.', 'living-chronicle' ); ?></li>
                <li><?php esc_html_e( 'Classic editor: type the shortcode directly into the content.', 'living-chronicle' ); ?></li>
            </ul>
            <p><?php esc_html_e( 'Publish or update the page — the game renders where the shortcode sits.', 'living-chronicle' ); ?></p>
        </article>

        <article class="lc-card lc-step">
            <span class="lc-step-num" aria-hidden="true">2</span>
            <h2><?php esc_html_e( 'Shape the embed (optional)', 'living-chronicle' ); ?></h2>
            <p class="lc-shortcode"><code>[living_chronicle profile="family" slot="main" height="720"]</code></p>
            <dl class="lc-attrs">
                <dt><code>profile</code></dt>
                <dd><?php esc_html_e( 'Save-profile name (default "default").', 'living-chronicle' ); ?></dd>
                <dt><code>slot</code></dt>
                <dd><?php esc_html_e( 'Durable name for this instance’s save. Give each shortcode on a page a fixed slot so its local save survives reordering.', 'living-chronicle' ); ?></dd>
                <dt><code>height</code></dt>
                <dd><?php esc_html_e( 'Embed height in pixels, clamped to 360–960 (default 720).', 'living-chronicle' ); ?></dd>
            </dl>
        </article>

        <article class="lc-card lc-step">
            <span class="lc-step-num" aria-hidden="true">3</span>
            <h2><?php esc_html_e( 'Choose the storyteller (optional)', 'living-chronicle' ); ?></h2>
            <p><?php esc_html_e( 'The game ships fully playable with the local storyteller: authored, offline, no key, no network. On WordPress 7.0+ with a configured AI Client you may hand narration to Site AI — every request goes through this plugin’s server-side proxy, and any failure falls back to authored storytelling mid-play, invisibly.', 'living-chronicle' ); ?></p>
            <p><a class="lc-button" href="<?php echo esc_url( $settings_url ); ?>"><?php esc_html_e( 'Open Storyteller Settings', 'living-chronicle' ); ?></a></p>
        </article>
    </section>

    <section class="lc-grid" aria-label="<?php esc_attr_e( 'Reference', 'living-chronicle' ); ?>">
        <article class="lc-card">
            <h2><?php esc_html_e( 'Controls', 'living-chronicle' ); ?></h2>
            <ul class="lc-controls">
                <li><kbd>WASD</kbd>/<kbd>←↑↓→</kbd> <?php esc_html_e( 'move', 'living-chronicle' ); ?></li>
                <li><kbd>Shift</kbd> <?php esc_html_e( 'run', 'living-chronicle' ); ?></li>
                <li><kbd>J</kbd> <?php esc_html_e( 'attack', 'living-chronicle' ); ?></li>
                <li><kbd>K</kbd> <?php esc_html_e( 'heavy attack', 'living-chronicle' ); ?></li>
                <li><kbd>L</kbd> <?php esc_html_e( 'block', 'living-chronicle' ); ?></li>
                <li><kbd>Space</kbd> <?php esc_html_e( 'dodge', 'living-chronicle' ); ?></li>
                <li><kbd>E</kbd> <?php esc_html_e( 'interact', 'living-chronicle' ); ?></li>
                <li><kbd>I</kbd> <?php esc_html_e( 'inventory', 'living-chronicle' ); ?></li>
                <li><kbd>Tab</kbd> <?php esc_html_e( 'Chronicle', 'living-chronicle' ); ?></li>
                <li><kbd>Esc</kbd> <?php esc_html_e( 'close / leave interior', 'living-chronicle' ); ?></li>
            </ul>
            <p><?php esc_html_e( 'Touch controls appear automatically on mobile and other coarse-pointer devices.', 'living-chronicle' ); ?></p>
        </article>

        <article class="lc-card">
            <h2><?php esc_html_e( 'Saves', 'living-chronicle' ); ?></h2>
            <p><?php esc_html_e( 'The game saves locally in each player’s browser, keyed per page, profile and slot. Clearing site storage clears that save. Uninstalling the plugin removes its settings but cannot remove players’ local browser saves.', 'living-chronicle' ); ?></p>
        </article>

        <article class="lc-card">
            <h2><?php esc_html_e( 'Caching & security', 'living-chronicle' ); ?></h2>
            <p><?php esc_html_e( 'Full-page caching is safe for normal play. The optional story route requires a nonce, rate-limits requests, and validates request and response sizes; a stale nonce on a long-cached page only means the game silently uses its authored storytelling. No AI credential ever reaches a visitor’s browser — never place a key in shortcode attributes or page source.', 'living-chronicle' ); ?></p>
        </article>

        <article class="lc-card">
            <h2><?php esc_html_e( 'Troubleshooting', 'living-chronicle' ); ?></h2>
            <ul>
                <li><?php esc_html_e( 'Blank space where the game should be: confirm the plugin is active and the shortcode is exactly [living_chronicle]; check the browser console for a blocked eldric-living-chronicle.js.', 'living-chronicle' ); ?></li>
                <li><?php esc_html_e( 'Script optimizers: deferring the game script is fine, but do not let an optimizer strip or combine away the lc-eldric-game handle.', 'living-chronicle' ); ?></li>
                <li><?php esc_html_e( 'Markup inserted via AJAX: call window.EldricLivingChronicle.mountAll(container) after inserting it.', 'living-chronicle' ); ?></li>
                <li><?php esc_html_e( '“The storyteller is resting”: the optional story route allows 10 requests per minute per user/IP; local play is unaffected.', 'living-chronicle' ); ?></li>
            </ul>
        </article>
    </section>
</div>
